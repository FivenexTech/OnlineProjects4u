import type { RequestHandler } from 'express'
import { OrderModel } from '../models/order.js'
import { orderAdminQuerySchema } from '../schemas/commerce.js'

export const listAdminOrders: RequestHandler = async (request, response, next) => {
  try {
    const query = orderAdminQuerySchema.parse(request.query)
    const filter = query.status ? { status: query.status } : {}
    const [items, total] = await Promise.all([
      OrderModel.find(filter).sort({ createdAt: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).populate('user', 'name email').lean(),
      OrderModel.countDocuments(filter),
    ])
    response.json({ data: items, meta: { page: query.page, limit: query.limit, total, pages: Math.ceil(total / query.limit) } })
  } catch (error) { next(error) }
}
