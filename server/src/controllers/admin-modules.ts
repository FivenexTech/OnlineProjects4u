import type { RequestHandler } from 'express'
import { AuditLogModel } from '../models/audit-log.js'
import { OrderModel } from '../models/order.js'
import { PaymentModel } from '../models/payment.js'
import { PlatformSettingsModel } from '../models/platform-settings.js'
import { ProjectModel } from '../models/project.js'
import { ReviewModel } from '../models/review.js'
import { UserModel } from '../models/user.js'
import { adminListSchema, platformSettingsSchema, reviewStatusSchema } from '../schemas/admin-modules.js'
import { AppError } from '../middleware/errors.js'

export const listAdminReviews: RequestHandler = async (req, res, next) => {
  try {
    const { page, limit } = adminListSchema.parse(req.query)
    const [data, total] = await Promise.all([
      ReviewModel.find().populate('user', 'name email').populate('project', 'title').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      ReviewModel.countDocuments()
    ])
    res.json({ data, meta: { page, limit, total, pages: Math.ceil(total / limit) } })
  } catch (error) { next(error) }
}

export const moderateReview: RequestHandler = async (req, res, next) => {
  try {
    const { status } = reviewStatusSchema.parse(req.body)
    const reviewId = String(req.params.id)
    const review = await ReviewModel.findByIdAndUpdate(reviewId, { status }, { new: true }).lean()
    if (!review) throw new AppError(404, 'Review not found', 'REVIEW_NOT_FOUND')
    await AuditLogModel.create({ actor: req.auth?.userId, action: `review.${status}`, resourceType: 'review', resourceId: reviewId })
    res.json({ data: review })
  } catch (error) { next(error) }
}

export const listApprovedReviews: RequestHandler = async (req, res, next) => {
  try { res.json({ data: await ReviewModel.find({ project: String(req.params.projectId), status: 'approved' }).populate('user', 'name').sort({ createdAt: -1 }).lean() }) } catch (error) { next(error) }
}

export const createReview: RequestHandler = async (req, res, next) => {
  try {
    const purchased = await OrderModel.exists({ user: req.auth?.userId, status: 'paid', 'lineItems.project': req.body.project })
    if (!purchased) throw new AppError(403, 'A paid purchase is required to review this project', 'REVIEW_PURCHASE_REQUIRED')
    const review = await ReviewModel.create({ ...req.body, user: req.auth?.userId })
    res.status(201).json({ data: review })
  } catch (error) { next(error) }
}

export const reports: RequestHandler = async (_req, res, next) => {
  try {
    const [users, projects, publishedProjects, draftProjects, orders, revenue, orderStatuses, bestSelling] = await Promise.all([
      UserModel.countDocuments(), ProjectModel.countDocuments(), ProjectModel.countDocuments({ publicationStatus: 'published' }), ProjectModel.countDocuments({ publicationStatus: 'draft' }), OrderModel.countDocuments(),
      PaymentModel.aggregate([{ $match: { status: 'verified' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      OrderModel.aggregate([{ $group: { _id: '$status', total: { $sum: 1 } } }, { $sort: { total: -1 } }]),
      OrderModel.aggregate([{ $match: { status: 'paid' } }, { $unwind: '$lineItems' }, { $group: { _id: '$lineItems.project', title: { $first: '$lineItems.titleSnapshot' }, sales: { $sum: 1 } } }, { $sort: { sales: -1 } }, { $limit: 10 }])
    ])
    res.json({ data: { users, projects, publishedProjects, draftProjects, orders, verifiedRevenue: revenue[0]?.total || 0, orderStatuses, bestSelling } })
  } catch (error) { next(error) }
}

export const listAuditLogs: RequestHandler = async (req, res, next) => {
  try {
    const { page, limit } = adminListSchema.parse(req.query)
    const [data, total] = await Promise.all([AuditLogModel.find().populate('actor', 'name email').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(), AuditLogModel.countDocuments()])
    res.json({ data, meta: { page, limit, total, pages: Math.ceil(total / limit) } })
  } catch (error) { next(error) }
}

export const getSettings: RequestHandler = async (_req, res, next) => {
  try { const data = await PlatformSettingsModel.findOneAndUpdate({ key: 'default' }, {}, { upsert: true, new: true, setDefaultsOnInsert: true }).select('-key -__v').lean(); res.json({ data }) } catch (error) { next(error) }
}
export const updateSettings: RequestHandler = async (req, res, next) => {
  try {
    const input = platformSettingsSchema.parse(req.body)
    const data = await PlatformSettingsModel.findOneAndUpdate({ key: 'default' }, input, { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }).select('-key -__v').lean()
    await AuditLogModel.create({ actor: req.auth?.userId, action: 'settings.updated', resourceType: 'platform_settings' })
    res.json({ data })
  } catch (error) { next(error) }
}
