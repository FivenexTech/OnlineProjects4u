import type { RequestHandler } from 'express'
import { PaymentModel } from '../models/payment.js'
import { orderAdminQuerySchema } from '../schemas/commerce.js'

export const listAdminPayments: RequestHandler = async (request, response, next) => {
  try {
    const query = orderAdminQuerySchema.parse(request.query)
    const [items, total] = await Promise.all([
      PaymentModel.find({ status: 'verified' })
        .sort({ createdAt: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .populate({
          path: 'order',
          select: 'user amount currency status createdAt',
          populate: { path: 'user', select: 'name email' },
        })
        .lean(),
      PaymentModel.countDocuments({ status: 'verified' }),
    ])
    response.json({
      data: items,
      meta: { page: query.page, limit: query.limit, total, pages: Math.ceil(total / query.limit) },
    })
  } catch (error) {
    next(error)
  }
}
