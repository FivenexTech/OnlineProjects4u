import type { RequestHandler } from 'express'
import { CustomProjectRequestModel } from '../models/custom-project-request.js'
import { AuditLogModel } from '../models/audit-log.js'
import { OrderModel } from '../models/order.js'
import { ProjectModel } from '../models/project.js'
import { SupportTicketModel } from '../models/support-ticket.js'
import { UserModel } from '../models/user.js'

export const overview: RequestHandler = async (_request, response, next) => {
  try {
    const [customers, projects, orders, openTickets, projectRequests, revenue, paymentStatuses, recentOrders, recentUsers, recentActivity] = await Promise.all([
      UserModel.countDocuments({ role: 'student' }), ProjectModel.countDocuments(), OrderModel.countDocuments(), SupportTicketModel.countDocuments({ status: { $in: ['open', 'in_progress'] } }), CustomProjectRequestModel.countDocuments({ status: { $in: ['submitted', 'under_review', 'clarification_needed'] } }),
      OrderModel.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: '$currency', total: { $sum: '$amount' } } }]),
      OrderModel.aggregate([{ $group: { _id: '$status', total: { $sum: 1 } } }]),
      OrderModel.find().sort({ createdAt: -1 }).limit(5).populate('user', 'name email').lean(),
      UserModel.find({ role: 'student' }).select('name email createdAt emailVerifiedAt').sort({ createdAt: -1 }).limit(5).lean(),
      AuditLogModel.find().sort({ createdAt: -1 }).limit(8).lean(),
    ])
    response.json({ data: { counts: { customers, projects, orders, openTickets, projectRequests }, revenue, paymentStatuses, recentOrders, recentUsers, recentActivity, generatedAt: new Date().toISOString() } })
  } catch (error) { next(error) }
}