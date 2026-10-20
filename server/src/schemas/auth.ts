import { z } from 'zod'

export const registerSchema = z.object({ email: z.email().transform((value) => value.toLowerCase()) })
export const loginSchema = z.object({ email: z.email().transform((value) => value.toLowerCase()) })
export const googleTokenSchema = z.object({ idToken: z.string().min(20).max(10000) })
export const otpRequestSchema = z.object({ email: z.email().transform((value) => value.toLowerCase()), purpose: z.enum(['email_verification', 'login']).default('login') })
export const otpVerifySchema = z.object({ email: z.email().transform((value) => value.toLowerCase()), purpose: z.enum(['email_verification', 'login']).default('login'), code: z.string().regex(/^\d{6}$/) })
export const profileUpdateSchema = z.object({ name: z.string().trim().min(2).max(100), phone: z.string().trim().max(30).regex(/^[+\d()\- .]*$/).optional() })