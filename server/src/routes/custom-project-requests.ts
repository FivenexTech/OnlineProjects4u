import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { validateBody } from '../middleware/validation.js'
import { customProjectRequestSchema, requestReviewSchema } from '../schemas/custom-project-request.js'
import { createRequest, getOwnRequest, listAllRequests, listOwnRequests, reviewRequest } from '../controllers/custom-project-requests.js'

export const customProjectRequestsRouter = Router()
customProjectRequestsRouter.use(requireAuth)
customProjectRequestsRouter.post('/', validateBody(customProjectRequestSchema), createRequest)
customProjectRequestsRouter.get('/mine', listOwnRequests)
customProjectRequestsRouter.get('/mine/:id', getOwnRequest)
customProjectRequestsRouter.get('/admin/all', requireRole('admin'), listAllRequests)
customProjectRequestsRouter.patch('/admin/:id', requireRole('admin'), validateBody(requestReviewSchema), reviewRequest)