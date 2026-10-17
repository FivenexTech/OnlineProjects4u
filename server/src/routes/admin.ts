import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { notConfigured } from '../controllers/placeholders.js'

export const adminRouter = Router()
adminRouter.use(requireAuth, requireRole('admin'))
adminRouter.get('/overview', notConfigured)
adminRouter.get('/orders', notConfigured)
adminRouter.get('/users', notConfigured)
adminRouter.patch('/projects/:id', notConfigured)
adminRouter.post('/projects/:id/publish', notConfigured)
adminRouter.post('/projects/:id/archive', notConfigured)
adminRouter.get('/support', notConfigured)