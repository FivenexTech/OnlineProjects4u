import type { RequestHandler } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import type { UserRole } from '../models/user.js'
import { AppError } from './errors.js'

type TokenPayload = { sub: string; role: UserRole }
export const requireAuth: RequestHandler = (request, _response, next) => {
  const header = request.header('authorization')
  if (!header?.startsWith('Bearer ')) return next(new AppError(401, 'Authentication required', 'AUTH_REQUIRED'))
  try {
    const payload = jwt.verify(header.slice(7), env.JWT_SECRET) as TokenPayload
    if (!payload.sub || !payload.role) throw new Error('Invalid claims')
    request.auth = { userId: payload.sub, role: payload.role }; next()
  } catch { next(new AppError(401, 'Invalid or expired authentication token', 'AUTH_INVALID')) }
}

export function requireRole(...roles: UserRole[]): RequestHandler {
  return (request, _response, next) => request.auth && roles.includes(request.auth.role) ? next() : next(new AppError(403, 'You do not have permission to perform this action', 'FORBIDDEN'))
}