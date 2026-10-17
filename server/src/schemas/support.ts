import { z } from 'zod'

export const supportTicketSchema = z.object({ subject: z.string().trim().min(3).max(160), message: z.string().trim().min(10).max(5000) })