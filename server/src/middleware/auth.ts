import type { RequestHandler } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import type { UserRole } from '../models/user.js'
import { AppError } from './errors.js'
import { expiredSessionCookie, findSession, sessionCookieName } from '../services/sessions.js'

type TokenPayload = { sub: string; role: UserRole }
export const requireAuth: RequestHandler = async (request, response, next) => {
  const cookie = request.header('cookie')?.split(';').map((item) => item.trim()).find((item) => item.startsWith(`${sessionCookieName}=`))?.slice(sessionCookieName.length + 1)
  if (cookie) { const session = await findSession(cookie); if (session) { const user = await (await import('../models/user.js')).UserModel.findById(session.user); if (user) { request.auth = { userId: user.id, role: user.role, sessionId: session.id }; return next() } } response.setHeader('Set-Cookie', expiredSessionCookie()) }
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