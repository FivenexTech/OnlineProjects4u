import { z } from 'zod'

const emailSchema = z.string().trim().email().transform((value) => value.toLowerCase())
export const registerSchema = z.object({ email: emailSchema })
export const loginSchema = z.object({ email: emailSchema })
export const googleTokenSchema = z.object({ idToken: z.string().min(20).max(10000) })
export const otpPurposeSchema = z.enum(['email_verification', 'login', 'admin_login'])
export const otpRequestSchema = z.object({ email: emailSchema, purpose: otpPurposeSchema.default('login') })
export const otpVerifySchema = z.object({ email: emailSchema, purpose: otpPurposeSchema.default('login'), code: z.string().regex(/^\d{6}$/) })
export const profileUpdateSchema = z.object({ name: z.string().trim().min(2).max(100), phone: z.string().trim().max(30).regex(/^[+\d()\- .]*$/).optional() })