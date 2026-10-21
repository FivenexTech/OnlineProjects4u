import type { RequestHandler } from 'express'
import { CustomProjectRequestModel } from '../models/custom-project-request.js'
import { AuditLogModel } from '../models/audit-log.js'
import { OrderModel } from '../models/order.js'
import { ProjectModel } from '../models/project.js'
import { SupportTicketModel } from '../models/support-ticket.js'
import { UserModel } from '../models/user.js'
import { PaymentModel } from '../models/payment.js'

export const overview: RequestHandler = async (_request, response, next) => {
  try {
    const [users, customers, projects, orders, openTickets, projectRequests, projectStatuses, revenue, paymentStatuses, recentOrders, recentUsers, recentProjects, recentPayments, recentActivity] = await Promise.all([
      UserModel.countDocuments(), UserModel.countDocuments({ role: 'student' }), ProjectModel.countDocuments(), OrderModel.countDocuments(), SupportTicketModel.countDocuments({ status: { $in: ['open', 'in_progress'] } }), CustomProjectRequestModel.countDocuments({ status: { $in: ['submitted', 'under_review', 'clarification_needed'] } }),
      ProjectModel.aggregate([{ $group: { _id: '$publicationStatus', total: { $sum: 1 } } }]),
      PaymentModel.aggregate([{ $match: { status: 'verified' } }, { $group: { _id: '$currency', total: { $sum: '$amount' } } }]),
      PaymentModel.aggregate([{ $group: { _id: '$status', total: { $sum: 1 } } }]),
      OrderModel.find().sort({ createdAt: -1 }).limit(5).populate('user', 'name email').lean(),
      UserModel.find({ role: 'student' }).select('name email createdAt emailVerifiedAt').sort({ createdAt: -1 }).limit(5).lean(),
      ProjectModel.find().select('title publicationStatus createdAt').sort({ createdAt: -1 }).limit(5).lean(),
      PaymentModel.find().select('order amount currency status createdAt').sort({ createdAt: -1 }).limit(5).populate({ path: 'order', select: 'user', populate: { path: 'user', select: 'name email' } }).lean(),
      AuditLogModel.find().sort({ createdAt: -1 }).limit(8).lean(),
    ])
    response.json({ data: { counts: { users, customers, projects, orders, openTickets, projectRequests }, projectStatuses, revenue, paymentStatuses, recentOrders, recentUsers, recentProjects, recentPayments, recentActivity, generatedAt: new Date().toISOString() } })
  } catch (error) { next(error) }
}