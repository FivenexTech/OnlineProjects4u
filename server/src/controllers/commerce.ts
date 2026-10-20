import type { RequestHandler } from 'express'
import mongoose from 'mongoose'
import { AppError } from '../middleware/errors.js'
import { reserveCoupon } from '../services/coupons.js'
import { OrderModel } from '../models/order.js'
import { PaymentModel } from '../models/payment.js'
import { ProjectModel } from '../models/project.js'

export const createOrder: RequestHandler = async (request, response, next) => {
  const session = await mongoose.startSession()
  try {
    let order
    await session.withTransaction(async () => {
      const projects = await ProjectModel.find({ _id: { $in: request.body.projectIds }, publicationStatus: 'published' }).select('title category price currency').session(session).lean()
      if (projects.length !== request.body.projectIds.length) throw new AppError(400, 'One or more projects are unavailable', 'PROJECTS_UNAVAILABLE')
      if (projects.some((project) => project.currency !== 'INR')) throw new AppError(400, 'Projects must use the INR currency', 'CURRENCY_MISMATCH')
      const lineItems = projects.map((project) => ({ project: project._id, titleSnapshot: project.title, categorySnapshot: project.category, unitPrice: project.price }))
      const subtotal = lineItems.reduce((total, item) => total + item.unitPrice, 0)
      const [created] = await OrderModel.create([{ user: request.auth?.userId, lineItems, subtotal, discountAmount: 0, amount: subtotal, currency: 'INR', status: 'pending' }], { session })
      order = created
      if (request.body.couponCode) {
        const couponSnapshot = await reserveCoupon(request.body.couponCode, request.auth?.userId as string, projects.map((project) => ({ projectId: String(project._id), category: project.category, unitPrice: project.price })), subtotal, String(created._id), session)
        created.couponSnapshot = couponSnapshot
        created.discountAmount = couponSnapshot.discountAmount
        created.amount = Math.max(0, subtotal - couponSnapshot.discountAmount)
        await created.save({ session })
        order = created
      }
    })
    response.status(201).json({ data: order })
  } catch (error) { next(error) }
  finally { await session.endSession() }
}

export const listOrders: RequestHandler = async (request, response, next) => {
  try { const orders = await OrderModel.find({ user: request.auth?.userId }).sort({ createdAt: -1 }).lean(); response.json({ data: orders }) } catch (error) { next(error) }
}

export const createPayment: RequestHandler = async (request, response, next) => {
  try {
    const order = await OrderModel.findOne({ _id: request.body.orderId, user: request.auth?.userId }).lean()
    if (!order) throw new AppError(404, 'Order not found', 'ORDER_NOT_FOUND')
    if (order.status !== 'pending') throw new AppError(409, 'Only pending orders can start payment', 'ORDER_NOT_PAYABLE')
    const existing = await PaymentModel.findOne({ order: order._id }).lean()
    if (existing) return response.json({ data: existing })
    const payment = await PaymentModel.create({ order: order._id, provider: 'razorpay', amount: order.amount, currency: order.currency, status: 'created' })
    response.status(201).json({ data: payment })
  } catch (error) { next(error) }
}

export const paymentWebhook: RequestHandler = async (_request, _response, next) => next(new AppError(501, 'Razorpay verification is not configured', 'RAZORPAY_NOT_CONFIGURED'))

export const listPurchases: RequestHandler = async (request, response, next) => {
  try { const purchases = await OrderModel.find({ user: request.auth?.userId, status: 'paid' }).sort({ createdAt: -1 }).populate('lineItems.project', 'title slug').lean(); response.json({ data: purchases }) } catch (error) { next(error) }
}
