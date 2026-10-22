import { z } from 'zod'

export const adminListSchema = z.object({ page: z.coerce.number().int().positive().default(1), limit: z.coerce.number().int().positive().max(100).default(20) })
export const reviewStatusSchema = z.object({ status: z.enum(['pending', 'approved', 'rejected', 'hidden']) })
export const reviewInputSchema = z.object({ project: z.string().regex(/^[a-f\d]{24}$/i), rating: z.number().int().min(1).max(5), text: z.string().trim().min(2).max(2000) })
export const platformSettingsSchema = z.object({ displayName: z.string().trim().min(1).max(120), supportEmail: z.string().trim().email(), currency: z.literal('INR'), maintenanceMode: z.boolean(), announcement: z.string().trim().max(500) })
