import type { RequestHandler } from 'express'
import { AppError } from '../middleware/errors.js'
import { CouponRedemptionModel } from '../models/coupon-redemption.js'
import { CouponModel } from '../models/coupon.js'
import { couponQuerySchema } from '../schemas/commerce.js'

export const listAdminCoupons: RequestHandler = async (request, response, next) => {
  try {
    const query = couponQuerySchema.parse(request.query)
    const filter: Record<string, unknown> = {}
    if (query.active !== undefined) filter.active = query.active
    if (query.search) filter.code = { $regex: query.search, $options: 'i' }
    const [items, total] = await Promise.all([
      CouponModel.find(filter).sort({ createdAt: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).lean(),
      CouponModel.countDocuments(filter),
    ])
    response.json({ data: items, meta: { page: query.page, limit: query.limit, total, pages: Math.ceil(total / query.limit) } })
  } catch (error) { next(error) }
}

export const createAdminCoupon: RequestHandler = async (request, response, next) => {
  try { const coupon = await CouponModel.create({ ...request.body, code: request.body.code.toUpperCase() }); response.status(201).json({ data: coupon }) } catch (error) { next(error) }
}

export const updateAdminCoupon: RequestHandler = async (request, response, next) => {
  try {
    const current = await CouponModel.findById(request.params.id)
    if (!current) throw new AppError(404, 'Coupon not found', 'COUPON_NOT_FOUND')
    if (request.body.code && request.body.code.toUpperCase() !== current.code) throw new AppError(400, 'Coupon codes cannot be changed after creation', 'COUPON_CODE_IMMUTABLE')
    const { code: _code, ...changes } = request.body
    const coupon = await CouponModel.findByIdAndUpdate(current._id, { $set: changes }, { new: true, runValidators: true }).lean()
    response.json({ data: coupon })
  } catch (error) { next(error) }
}

export const setAdminCouponActive: RequestHandler = async (request, response, next) => {
  try {
    const coupon = await CouponModel.findByIdAndUpdate(request.params.id, { $set: { active: request.body.active } }, { new: true, runValidators: true }).lean()
    if (!coupon) throw new AppError(404, 'Coupon not found', 'COUPON_NOT_FOUND')
    response.json({ data: coupon })
  } catch (error) { next(error) }
}

export const deleteAdminCoupon: RequestHandler = async (request, response, next) => {
  try {
    const coupon = await CouponModel.findById(request.params.id).select('usageCount')
    if (!coupon) throw new AppError(404, 'Coupon not found', 'COUPON_NOT_FOUND')
    if (coupon.usageCount > 0) throw new AppError(409, 'Used coupons cannot be deleted; deactivate them instead', 'COUPON_DELETE_BLOCKED')
    await CouponRedemptionModel.deleteMany({ coupon: coupon._id })
    await coupon.deleteOne()
    response.status(204).send()
  } catch (error) { next(error) }
}
