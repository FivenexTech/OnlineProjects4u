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
  try { const user = await UserModel.findById(request.auth?.userId); if (!user) throw new AppError(404, 'Account not found', 'USER_NOT_FOUND'); response.json({ data: { id: user.id, name: user.name, email: user.email, phone: user.phone ?? '', role: user.role, emailVerified: Boolean(user.emailVerifiedAt), createdAt: user.createdAt } }) } catch (error) { next(error) }
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
    const user = await UserModel.findOne({ email: request.body.email })
    await issueVerificationOtp(user?.id, request.body.email)
    response.status(202).json({ data: { message: 'If verification is required, a code has been sent.' } })
  } catch (error) {
    if (error instanceof AppError && error.code === 'OTP_COOLDOWN') return response.status(202).json({ data: { message: 'If verification is required, a code has been sent.' } })
    next(error)
  }
}

export const verifyOtp: RequestHandler = async (request, response, next) => {
  try {
    await verifyEmailOtp(request.body.email, request.body.code)
    let user = await UserModel.findOne({ email: request.body.email })
    if (!user) user = await UserModel.create({ name: request.body.email.split('@')[0].slice(0, 100), email: request.body.email, role: 'student', emailVerifiedAt: new Date() })
    else { user.emailVerifiedAt = new Date(); await user.save() }
    const session = await createSession(user.id); response.setHeader('Set-Cookie', sessionCookie(session)); response.json({ data: { verified: true, user: { id: user.id, name: user.name, email: user.email, role: user.role, emailVerified: Boolean(user.emailVerifiedAt) } } })
  } catch (error) { next(error) }
}

export const logout: RequestHandler = async (request, response, next) => { try { const cookie = request.header('cookie')?.split(';').map((item) => item.trim()).find((item) => item.startsWith(`${sessionCookieName}=`))?.slice(sessionCookieName.length + 1); if (cookie) await revokeSession(cookie); response.setHeader('Set-Cookie', expiredSessionCookie()); response.status(204).send() } catch (error) { next(error) } }