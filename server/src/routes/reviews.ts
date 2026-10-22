import { Router } from 'express'
import { createReview, listApprovedReviews } from '../controllers/admin-modules.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { validateBody } from '../middleware/validation.js'
import { reviewInputSchema } from '../schemas/admin-modules.js'

export const reviewsRouter = Router()
reviewsRouter.get('/project/:projectId', listApprovedReviews)
reviewsRouter.post('/', requireAuth, requireRole('student'), validateBody(reviewInputSchema), createReview)
