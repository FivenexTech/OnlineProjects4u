import { Router } from 'express'
import { createProject, downloadProject, getProject, listProjects } from '../controllers/projects.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { validateBody } from '../middleware/validation.js'
import { projectInputSchema } from '../schemas/project.js'

export const projectsRouter = Router()
projectsRouter.get('/', listProjects)
projectsRouter.get('/:id/download', requireAuth, downloadProject)
projectsRouter.get('/:slug', getProject)
projectsRouter.post('/', requireAuth, requireRole('admin'), validateBody(projectInputSchema), createProject)