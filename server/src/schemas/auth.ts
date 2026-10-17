import { z } from 'zod'

export const registerSchema = z.object({ name: z.string().trim().min(2).max(100), email: z.email().transform((value) => value.toLowerCase()), password: z.string().min(12).max(128) })
export const loginSchema = z.object({ email: z.email().transform((value) => value.toLowerCase()), password: z.string().min(1).max(128) })
export const googleTokenSchema = z.object({ idToken: z.string().min(20).max(10000) })
export const otpRequestSchema = z.object({ email: z.email().transform((value) => value.toLowerCase()), purpose: z.enum(['email_verification', 'login']).default('login') })
export const otpVerifySchema = z.object({ email: z.email().transform((value) => value.toLowerCase()), purpose: z.enum(['email_verification', 'login']).default('login'), code: z.string().regex(/^\d{6}$/) })