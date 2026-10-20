import type { RequestHandler } from 'express'
import { UserModel } from '../models/user.js'
import { customerQuerySchema } from '../schemas/commerce.js'

function escapeRegex(value: string): string { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }

export const listAdminCustomers: RequestHandler = async (request, response, next) => {
  try {
    const query = customerQuerySchema.parse(request.query)
    const filter: Record<string, unknown> = { role: 'student' }
    if (query.verified !== undefined) filter.emailVerifiedAt = query.verified ? { $exists: true } : { $exists: false }
    if (query.search) { const pattern = { $regex: escapeRegex(query.search), $options: 'i' }; filter.$or = [{ name: pattern }, { email: pattern }] }
    const [items, total] = await Promise.all([
      UserModel.find(filter).select('name email role emailVerifiedAt createdAt').sort({ createdAt: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).lean(),
      UserModel.countDocuments(filter),
    ])
    response.json({ data: items, meta: { page: query.page, limit: query.limit, total, pages: Math.ceil(total / query.limit) } })
  } catch (error) { next(error) }
}