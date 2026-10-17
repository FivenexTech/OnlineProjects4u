import type { RequestHandler } from 'express'
import { SupportTicketModel } from '../models/support-ticket.js'

export const createTicket: RequestHandler = async (request, response, next) => {
  try { const ticket = await SupportTicketModel.create({ ...request.body, user: request.auth?.userId }); response.status(201).json({ data: { id: ticket.id, status: ticket.status } }) } catch (error) { next(error) }
}