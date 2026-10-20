import type { RequestHandler } from 'express'
import { SupportTicketModel } from '../models/support-ticket.js'
import { AppError } from '../middleware/errors.js'

type SupportStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

export const listAdminSupportTickets: RequestHandler = async (request, response, next) => {
  try { const status = typeof request.query.status === 'string' && ['open', 'in_progress', 'resolved', 'closed'].includes(request.query.status) ? request.query.status as SupportStatus : undefined; const filter: { status?: SupportStatus } = status ? { status } : {}; const tickets = await SupportTicketModel.find(filter).sort({ createdAt: -1 }).limit(100).populate('user', 'name email').lean(); response.json({ data: tickets }) } catch (error) { next(error) }
}

export const updateAdminSupportTicket: RequestHandler = async (request, response, next) => {
  try { const ticket = await SupportTicketModel.findByIdAndUpdate(request.params.id, { $set: { status: request.body.status } }, { new: true, runValidators: true }).populate('user', 'name email').lean(); if (!ticket) throw new AppError(404, 'Support ticket not found', 'SUPPORT_TICKET_NOT_FOUND'); response.json({ data: ticket }) } catch (error) { next(error) }
}
