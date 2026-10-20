import { z } from 'zod'

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Expected a MongoDB id')

export const createOrderSchema = z.object({ projectIds: z.array(objectId).min(1).max(20).refine((ids) => new Set(ids).size === ids.length, 'Duplicate projects are not allowed'), couponCode: z.string().trim().toUpperCase().min(3).max(40).optional() })
export const createPaymentSchema = z.object({ orderId: objectId })
export const orderAdminQuerySchema = z.object({ status: z.enum(['pending', 'paid', 'cancelled', 'refunded']).optional(), page: z.coerce.number().int().positive().default(1), limit: z.coerce.number().int().positive().max(100).default(50) })

const couponFields = z.object({
	code: z.string().trim().toUpperCase().regex(/^[A-Z0-9][A-Z0-9_-]{2,39}$/),
	discountType: z.enum(['percentage', 'fixed']),
	discountValue: z.number().int().positive(),
	currency: z.literal('INR').default('INR'),
	startsAt: z.coerce.date().optional(),
	expiresAt: z.coerce.date().optional(),
	usageLimit: z.number().int().positive().optional(),
	perUserLimit: z.number().int().positive().optional(),
	minimumOrderValue: z.number().int().nonnegative().default(0),
	projectIds: z.array(objectId).max(100).default([]),
	categories: z.array(z.string().trim().min(1).max(100)).max(50).default([]),
	active: z.boolean().default(true),
})
const validateCouponRules = (value: z.infer<typeof couponFields>, context: z.RefinementCtx) => {
	if (value.discountType === 'percentage' && value.discountValue > 100) context.addIssue({ code: 'too_big', maximum: 100, inclusive: true, origin: 'number', path: ['discountValue'], message: 'Percentage discounts cannot exceed 100' })
	if (value.expiresAt && value.startsAt && value.expiresAt <= value.startsAt) context.addIssue({ code: 'custom', path: ['expiresAt'], message: 'Expiry must be after the start date' })
}
export const couponInputSchema = couponFields.superRefine(validateCouponRules)
export const couponUpdateSchema = couponFields.partial().superRefine((value, context) => {
	if (value.discountType === 'percentage' && value.discountValue !== undefined && value.discountValue > 100) context.addIssue({ code: 'too_big', maximum: 100, inclusive: true, origin: 'number', path: ['discountValue'], message: 'Percentage discounts cannot exceed 100' })
	if (value.expiresAt && value.startsAt && value.expiresAt <= value.startsAt) context.addIssue({ code: 'custom', path: ['expiresAt'], message: 'Expiry must be after the start date' })
})
export const couponStatusSchema = z.object({ active: z.boolean() })
export const couponQuerySchema = z.object({ search: z.string().trim().max(40).optional(), active: z.enum(['true', 'false']).transform((value) => value === 'true').optional(), page: z.coerce.number().int().positive().default(1), limit: z.coerce.number().int().positive().max(100).default(50) })
export const customerQuerySchema = z.object({ search: z.string().trim().max(100).optional(), verified: z.enum(['true', 'false']).transform((value) => value === 'true').optional(), page: z.coerce.number().int().positive().default(1), limit: z.coerce.number().int().positive().max(100).default(50) })
