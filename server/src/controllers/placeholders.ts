import type { RequestHandler } from 'express'
import { AppError } from '../middleware/errors.js'

export const notConfigured: RequestHandler = (_request, _response, next) => next(new AppError(501, 'This integration is not configured yet', 'NOT_CONFIGURED'))