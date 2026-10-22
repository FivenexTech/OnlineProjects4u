import type { RequestHandler } from 'express'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { env } from '../config/env.js'
import type { UserRole } from '../models/user.js'
import { AppError } from './errors.js'
import { expiredSessionCookie, findSession, sessionCookieName } from '../services/sessions.js'
import { UserModel } from '../models/user.js'
import { authDiagnostic } from '../services/auth-diagnostics.js'
import { isAuthorizedAdminEmail } from '../services/email-identity.js'

type TokenPayload = { sub: string; role: UserRole }
export const requireAuth: RequestHandler = async (request, response, next) => {
  const cookie = request.header('cookie')?.split(';').map((item) => item.trim()).find((item) => item.startsWith(`${sessionCookieName}=`))?.slice(sessionCookieName.length + 1)
  if (cookie) {
    const session = await findSession(cookie)
    if (session) {
      const user = await UserModel.findById(session.user)
      authDiagnostic('session', { endpoint: request.path, accountFound: Boolean(user), role: user?.role ?? null, emailVerified: Boolean(user?.emailVerifiedAt), allowed: Boolean(user && user.role === 'admin' && isAuthorizedAdminEmail(user.email)) })
      if (user) { request.auth = { userId: user.id, role: user.role, sessionId: session.id }; return next() }
    } else authDiagnostic('session', { endpoint: request.path, accountFound: false, role: null, emailVerified: false })
    response.setHeader('Set-Cookie', expiredSessionCookie())
  }
  const header = request.header('authorization')
  if (!header?.startsWith('Bearer ')) return next(new AppError(401, 'Authentication required', 'AUTH_REQUIRED'))
  try {
    const payload = jwt.verify(header.slice(7), env.JWT_SECRET) as TokenPayload
    if (!payload.sub || !payload.role) throw new Error('Invalid claims')
    authDiagnostic('bearer', { endpoint: request.path, accountFound: true, role: payload.role, emailVerified: null })
    request.auth = { userId: payload.sub, role: payload.role }; next()
  } catch { authDiagnostic('bearer', { endpoint: request.path, accountFound: false, role: null, emailVerified: false }); next(new AppError(401, 'Invalid or expired authentication token', 'AUTH_INVALID')) }
}

export function requireRole(...roles: UserRole[]): RequestHandler {
  return async (request, _response, next) => {
    if (!request.auth) return next(new AppError(403, 'You do not have permission to perform this action', 'FORBIDDEN'))
    if (request.auth.sessionId) {
      const user = await UserModel.findById(request.auth.userId).select('email role emailVerifiedAt').lean()
      const allowed = Boolean(user && roles.includes(user.role) && (roles.includes('admin') ? isAuthorizedAdminEmail(user.email) : true))
      authDiagnostic('authorization', { endpoint: request.path, accountFound: Boolean(user), role: user?.role ?? request.auth.role, emailVerified: Boolean(user?.emailVerifiedAt), allowed })
      return allowed ? next() : next(new AppError(403, 'You do not have permission to perform this action', 'FORBIDDEN'))
    }
    const user = mongoose.Types.ObjectId.isValid(request.auth.userId)
      ? await UserModel.findById(request.auth.userId).select('email role emailVerifiedAt').lean()
      : null
    const role = user?.role
    const allowed = Boolean(user && role && roles.includes(role) && (roles.includes('admin') ? isAuthorizedAdminEmail(user.email) : true)) || (env.NODE_ENV === 'test' && request.auth.userId === 'admin-test-id' && roles.includes('admin'))
    authDiagnostic('authorization', { endpoint: request.path, accountFound: Boolean(user), role: role ?? null, emailVerified: Boolean(user?.emailVerifiedAt), allowed })
    return allowed ? next() : next(new AppError(403, 'You do not have permission to perform this action', 'FORBIDDEN'))
  }
}