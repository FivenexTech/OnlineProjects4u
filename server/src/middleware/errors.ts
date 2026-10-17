import type { ErrorRequestHandler, RequestHandler } from 'express'
import { ZodError } from 'zod'

export class AppError extends Error {
  constructor(public readonly statusCode: number, message: string, public readonly code = 'APP_ERROR') { super(message) }
}

export const notFoundHandler: RequestHandler = (_request, _response, next) => next(new AppError(404, 'Route not found', 'NOT_FOUND'))

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof ZodError) return response.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Request validation failed', details: error.flatten() } })
  if (error instanceof AppError) return response.status(error.statusCode).json({ error: { code: error.code, message: error.message } })
  console.error(error)
  return response.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } })
}