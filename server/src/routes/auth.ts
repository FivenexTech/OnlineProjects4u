import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { googleLogin, logout, me, requestOtp, updateMe, verifyOtp } from '../controllers/auth.js'
import { requireAuth } from '../middleware/auth.js'
import { validateBody } from '../middleware/validation.js'
import { googleTokenSchema, loginSchema, otpRequestSchema, otpVerifySchema, profileUpdateSchema, registerSchema } from '../schemas/auth.js'
import { notConfigured } from '../controllers/placeholders.js'

export const authRouter = Router()
const authLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false })
authRouter.post('/register', authLimit, validateBody(registerSchema), requestOtp)
authRouter.post('/login', authLimit, validateBody(loginSchema), requestOtp)
authRouter.post('/google', authLimit, validateBody(googleTokenSchema), googleLogin)
authRouter.post('/otp/request', authLimit, validateBody(otpRequestSchema), requestOtp)
authRouter.post('/otp/verify', authLimit, validateBody(otpVerifySchema), verifyOtp)
authRouter.post('/logout', requireAuth, logout)
authRouter.get('/me', requireAuth, me)
authRouter.patch('/me', requireAuth, validateBody(profileUpdateSchema), updateMe)
authRouter.post('/verify-email', notConfigured)
authRouter.post('/request-password-reset', authLimit, notConfigured)
authRouter.post('/reset-password', authLimit, notConfigured)