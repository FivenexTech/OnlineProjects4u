import type { RequestHandler } from 'express'
import mongoose from 'mongoose'
import { AppError } from '../middleware/errors.js'
import { reserveCoupon } from '../services/coupons.js'
import { OrderModel } from '../models/order.js'
import { PaymentModel } from '../models/payment.js'
import { ProjectModel } from '../models/project.js'
import { env } from '../config/env.js'
import { createRazorpayOrder, fetchRazorpayPayment, razorpayKeyId, verifyRazorpaySignature, verifyWebhookSignature } from '../services/razorpay.js'

export const createOrder: RequestHandler = async (request, response, next) => {
  const session = await mongoose.startSession()
  try {
    let order
    await session.withTransaction(async () => {
      const references = request.body.projectIds as string[]
      const projects = await ProjectModel.find({ $or: [{ _id: { $in: references.filter((id) => mongoose.isValidObjectId(id)) } }, { slug: { $in: references } }], publicationStatus: 'published' }).select('title slug category price currency').session(session).lean()
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
    if (existing?.status === 'verified') return response.json({ data: { payment: existing, alreadyPaid: true } })
    if (order.razorpayOrderId && existing) return response.json({ data: { keyId: razorpayKeyId(), razorpayOrderId: order.razorpayOrderId, amount: Math.round(order.amount * 100), currency: order.currency, payment: existing } })
    const razorpayOrder = await createRazorpayOrder(order.amount, String(order._id))
    const payment = existing ?? await PaymentModel.create({ order: order._id, provider: 'razorpay', amount: order.amount, currency: order.currency, status: 'created' })
    await OrderModel.updateOne({ _id: order._id, status: 'pending' }, { $set: { razorpayOrderId: razorpayOrder.id } })
    response.status(existing ? 200 : 201).json({ data: { keyId: razorpayKeyId(), razorpayOrderId: razorpayOrder.id, amount: razorpayOrder.amount, currency: razorpayOrder.currency, payment } })
  } catch (error) { next(error) }
}

export const verifyPayment: RequestHandler = async (request, response, next) => {
  try {
    const { razorpayPaymentId, razorpayOrderId, razorpaySignature } = request.body
    const order = await OrderModel.findOne({ razorpayOrderId, user: request.auth?.userId })
    if (!order) throw new AppError(404, 'Order not found', 'ORDER_NOT_FOUND')
    const payment = await PaymentModel.findOne({ order: order._id })
    if (!payment) throw new AppError(404, 'Payment record not found', 'PAYMENT_NOT_FOUND')
    if (payment.status === 'verified' && payment.providerReference === razorpayPaymentId) return response.json({ data: { verified: true, orderId: order.id } })
    if (!verifyRazorpaySignature(order.razorpayOrderId as string, razorpayPaymentId, razorpaySignature)) throw new AppError(400, 'Payment signature is invalid', 'PAYMENT_SIGNATURE_INVALID')
    const remote = await fetchRazorpayPayment(razorpayPaymentId)
    if (remote.order_id !== order.razorpayOrderId || remote.amount !== Math.round(order.amount * 100) || remote.currency !== order.currency || remote.status !== 'captured') throw new AppError(400, 'Payment details could not be verified', 'PAYMENT_NOT_CAPTURED')
    await PaymentModel.updateOne({ _id: payment._id, status: { $ne: 'verified' } }, { $set: { status: 'verified', providerReference: razorpayPaymentId } })
    await OrderModel.updateOne({ _id: order._id, status: 'pending' }, { $set: { status: 'paid' } })
    response.json({ data: { verified: true, orderId: order.id } })
  } catch (error) { next(error) }
}

export const paymentWebhook: RequestHandler = async (request, response, next) => {
  try {
    const signature = request.header('x-razorpay-signature')
    const eventId = request.header('x-razorpay-event-id')
    const rawBody = request.body as Buffer
    if (!signature || !eventId || !Buffer.isBuffer(rawBody) || !verifyWebhookSignature(rawBody, signature)) throw new AppError(400, 'Invalid webhook signature', 'WEBHOOK_SIGNATURE_INVALID')
    const payload = JSON.parse(rawBody.toString('utf8')) as { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string; amount?: number; currency?: string; status?: string } }; refund?: { entity?: { payment_id?: string } } } }
    const paymentId = payload.payload?.payment?.entity?.id || payload.payload?.refund?.entity?.payment_id
    if (paymentId) {
      const remote = payload.payload?.payment?.entity
      const linkedOrder = remote?.order_id ? await OrderModel.findOne({ razorpayOrderId: remote.order_id }).lean() : undefined
      const payment = linkedOrder ? await PaymentModel.findOne({ order: linkedOrder._id }) : await PaymentModel.findOne({ providerReference: paymentId })
      const order = linkedOrder || payment?.order as { _id: unknown; razorpayOrderId?: string; amount: number; currency: string; status: string } | undefined
      if (payment && order && remote && remote.amount === Math.round(order.amount * 100) && remote.currency === order.currency && ['payment.captured', 'payment.authorized'].includes(payload.event || '') && remote.status === 'captured') {
        await PaymentModel.updateOne({ _id: payment._id, webhookEventIds: { $ne: eventId } }, { $set: { status: 'verified', providerReference: paymentId }, $addToSet: { webhookEventIds: eventId } })
        await OrderModel.updateOne({ _id: order._id, status: 'pending' }, { $set: { status: 'paid' } })
      } else if (payment) await PaymentModel.updateOne({ _id: payment._id }, { $addToSet: { webhookEventIds: eventId } })
    }
    response.status(204).send()
  } catch (error) { next(error) }
}

export const listPurchases: RequestHandler = async (request, response, next) => {
  try { const purchases = await OrderModel.find({ user: request.auth?.userId, status: 'paid' }).sort({ createdAt: -1 }).populate('lineItems.project', 'title slug').lean(); response.json({ data: purchases }) } catch (error) { next(error) }
}
