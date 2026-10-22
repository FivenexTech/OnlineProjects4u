import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type { RequestHandler } from 'express'
import { UserModel } from '../models/user.js'
import { env } from '../config/env.js'
import { AppError } from '../middleware/errors.js'
import { OAuth2Client } from 'google-auth-library'
import { randomBytes } from 'node:crypto'
import { issueVerificationOtp, verifyEmailOtp } from '../services/email-verification.js'
import { createSession, expiredSessionCookie, revokeSession, sessionCookie, sessionCookieName } from '../services/sessions.js'
import { authDiagnostic } from '../services/auth-diagnostics.js'
import { isAuthorizedAdminEmail, normalizeEmail } from '../services/email-identity.js'

function issueToken(userId: string, role: 'student' | 'admin'): string { return jwt.sign({ role }, env.JWT_SECRET, { subject: userId, expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }) }

export const register: RequestHandler = async (request, response, next) => {
  try {
    const email = request.body.email
    const user = await UserModel.findOne({ email })
    await issueVerificationOtp(user?.id, email)
    response.status(202).json({ data: { verificationRequired: true } })
  } catch (error) {
    if (error instanceof AppError && error.code === 'OTP_COOLDOWN') return response.status(202).json({ data: { verificationRequired: true } })
    next(error)
  }
}

export const login: RequestHandler = async (request, response, next) => {
  try {
    throw new AppError(410, 'Password login has been replaced by email verification', 'PASSWORD_LOGIN_DISABLED')
  } catch (error) { next(error) }
}

export const me: RequestHandler = async (request, response, next) => {
  try { const user = await UserModel.findById(request.auth?.userId); const adminAuthorized = Boolean(user && user.role === 'admin' && isAuthorizedAdminEmail(user.email)); authDiagnostic('me', { endpoint: request.path, accountFound: Boolean(user), role: user?.role ?? null, emailVerified: Boolean(user?.emailVerifiedAt), allowed: Boolean(user) && (user?.role !== 'admin' || adminAuthorized) }); if (!user) throw new AppError(404, 'Account not found', 'USER_NOT_FOUND'); response.json({ data: { id: user.id, name: user.name, email: user.email, phone: user.phone ?? '', role: user.role, adminAuthorized, emailVerified: Boolean(user.emailVerifiedAt), createdAt: user.createdAt } }) } catch (error) { next(error) }
}

export const updateMe: RequestHandler = async (request, response, next) => {
  try { const user = await UserModel.findByIdAndUpdate(request.auth?.userId, { $set: request.body }, { new: true, runValidators: true }).lean(); if (!user) throw new AppError(404, 'Account not found', 'USER_NOT_FOUND'); response.json({ data: { id: user._id.toString(), name: user.name, email: user.email, phone: user.phone ?? '', role: user.role, emailVerified: Boolean(user.emailVerifiedAt), createdAt: user.createdAt } }) } catch (error) { next(error) }
}

export const googleLogin: RequestHandler = async (request, response, next) => {
  try {
    if (!env.GOOGLE_CLIENT_ID) throw new AppError(501, 'Google authentication is not configured', 'GOOGLE_AUTH_NOT_CONFIGURED')
    const ticket = await new OAuth2Client(env.GOOGLE_CLIENT_ID).verifyIdToken({ idToken: request.body.idToken, audience: env.GOOGLE_CLIENT_ID })
    const payload = ticket.getPayload()
    if (!payload?.sub || !payload.email || !payload.email_verified) throw new AppError(401, 'Google account verification failed', 'GOOGLE_AUTH_INVALID')
    let user = await UserModel.findOne({ email: payload.email.toLowerCase() }).select('+passwordHash')
    if (!user) user = await UserModel.create({ name: payload.name?.trim() || 'OnlineProjects4U student', email: payload.email.toLowerCase(), passwordHash: await bcrypt.hash(randomBytes(32).toString('hex'), 12), googleSubject: payload.sub, role: 'student', emailVerifiedAt: new Date() })
    else if (!user.googleSubject) { user.googleSubject = payload.sub; user.emailVerifiedAt ??= new Date(); await user.save() }
    const session = await createSession(user.id); response.setHeader('Set-Cookie', sessionCookie(session)); response.json({ data: { user: { id: user.id, name: user.name, email: user.email, role: user.role, emailVerified: true } } })
  } catch (error) { next(error) }
}

export const requestOtp: RequestHandler = async (request, response, next) => {
  try {
    const email = normalizeEmail(request.body.email)
    const purpose = request.body.purpose === 'admin_login' ? 'admin_login' : request.path.endsWith('/login') || request.body.purpose === 'login' ? 'login' : 'email_verification'
    const adminEmailAllowed = purpose !== 'admin_login' || isAuthorizedAdminEmail(email)
    if (!adminEmailAllowed) throw new AppError(403, 'This email is not authorized for admin access', 'ADMIN_EMAIL_NOT_ALLOWED')
    const user = await UserModel.findOne({ email })
    authDiagnostic('request', { endpoint: request.path, accountFound: Boolean(user), role: user?.role ?? null, emailVerified: Boolean(user?.emailVerifiedAt), allowed: adminEmailAllowed })
    await issueVerificationOtp(user?.id, email, purpose)
    response.status(202).json({ data: { message: 'If verification is required, a code has been sent.' } })
  } catch (error) {
    if (error instanceof AppError && error.code === 'OTP_COOLDOWN') return response.status(202).json({ data: { message: 'If verification is required, a code has been sent.' } })
    next(error)
  }
}

export const verifyOtp: RequestHandler = async (request, response, next) => {
  try {
    const email = normalizeEmail(request.body.email)
    const purpose = request.body.purpose === 'admin_login' ? 'admin_login' : 'email_verification'
    if (purpose === 'admin_login' && !isAuthorizedAdminEmail(email)) throw new AppError(403, 'This email is not authorized for admin access', 'ADMIN_EMAIL_NOT_ALLOWED')
    await verifyEmailOtp(email, request.body.code, purpose)
    let user = await UserModel.findOne({ email })
    if (purpose === 'admin_login' && (!user || user.role !== 'admin' || !isAuthorizedAdminEmail(user.email))) {
      authDiagnostic('otp-verify', { endpoint: request.path, accountFound: Boolean(user), role: user?.role ?? null, emailVerified: Boolean(user?.emailVerifiedAt), allowed: false })
      throw new AppError(403, 'This administrator account is not provisioned', 'ADMIN_NOT_PROVISIONED')
    }
    if (!user) user = await UserModel.create({ name: email.split('@')[0].slice(0, 100), email, role: 'student', emailVerifiedAt: new Date() })
    else { user.emailVerifiedAt = new Date(); await user.save() }
    authDiagnostic('otp-verify', { endpoint: request.path, accountFound: true, role: user.role, emailVerified: Boolean(user.emailVerifiedAt), allowed: purpose !== 'admin_login' || (user.role === 'admin' && isAuthorizedAdminEmail(user.email)) })
    const session = await createSession(user.id); response.setHeader('Set-Cookie', sessionCookie(session)); response.json({ data: { verified: true, user: { id: user.id, name: user.name, email: user.email, role: user.role, emailVerified: Boolean(user.emailVerifiedAt) } } })
  } catch (error) { next(error) }
}

export const logout: RequestHandler = async (request, response, next) => { try { const cookie = request.header('cookie')?.split(';').map((item) => item.trim()).find((item) => item.startsWith(`${sessionCookieName}=`))?.slice(sessionCookieName.length + 1); if (cookie) await revokeSession(cookie); response.setHeader('Set-Cookie', expiredSessionCookie()); response.status(204).send() } catch (error) { next(error) } }