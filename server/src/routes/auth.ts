import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { login, me, register } from '../controllers/auth.js'
import { requireAuth } from '../middleware/auth.js'
import { validateBody } from '../middleware/validation.js'
import { loginSchema, registerSchema } from '../schemas/auth.js'
import { notConfigured } from '../controllers/placeholders.js'

export const authRouter = Router()
const authLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false })
authRouter.post('/register', authLimit, validateBody(registerSchema), register)
authRouter.post('/login', authLimit, validateBody(loginSchema), login)
authRouter.post('/logout', requireAuth, (_request, response) => response.status(204).send())
authRouter.get('/me', requireAuth, me)
authRouter.post('/verify-email', notConfigured)
authRouter.post('/request-password-reset', authLimit, notConfigured)
authRouter.post('/reset-password', authLimit, notConfigured)