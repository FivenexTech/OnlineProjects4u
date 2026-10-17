import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { notConfigured } from '../controllers/placeholders.js'

export const commerceRouter = Router()
commerceRouter.use(requireAuth)
commerceRouter.post('/orders', notConfigured)
commerceRouter.get('/orders', notConfigured)
commerceRouter.post('/payments/create', notConfigured)
commerceRouter.post('/payments/webhook', notConfigured)
commerceRouter.get('/purchases', notConfigured)
commerceRouter.get('/purchases/:projectId/download', notConfigured)