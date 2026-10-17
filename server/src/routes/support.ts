import { Router } from 'express'
import { createTicket } from '../controllers/support.js'
import { requireAuth } from '../middleware/auth.js'
import { validateBody } from '../middleware/validation.js'
import { supportTicketSchema } from '../schemas/support.js'

export const supportRouter = Router()
supportRouter.post('/', requireAuth, validateBody(supportTicketSchema), createTicket)