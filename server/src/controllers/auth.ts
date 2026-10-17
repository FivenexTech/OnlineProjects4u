import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type { RequestHandler } from 'express'
import { UserModel } from '../models/user.js'
import { env } from '../config/env.js'
import { AppError } from '../middleware/errors.js'
import { OAuth2Client } from 'google-auth-library'
import { randomBytes, createHash } from 'node:crypto'
import { EmailOtpModel } from '../models/email-otp.js'

function issueToken(userId: string, role: 'student' | 'admin'): string { return jwt.sign({ role }, env.JWT_SECRET, { subject: userId, expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }) }

export const register: RequestHandler = async (request, response, next) => {
  try {
    const existing = await UserModel.exists({ email: request.body.email })
    if (existing) throw new AppError(409, 'An account with this email already exists', 'EMAIL_IN_USE')
    const passwordHash = await bcrypt.hash(request.body.password, 12)
    const user = await UserModel.create({ name: request.body.name, email: request.body.email, passwordHash, role: 'student' })
    response.status(201).json({ data: { user: { id: user.id, name: user.name, email: user.email, role: user.role, emailVerified: false }, token: issueToken(user.id, user.role) } })
  } catch (error) { next(error) }
}

export const login: RequestHandler = async (request, response, next) => {
  try {
    const user = await UserModel.findOne({ email: request.body.email }).select('+passwordHash')
    if (!user || !(await bcrypt.compare(request.body.password, user.passwordHash))) throw new AppError(401, 'Invalid email or password', 'AUTH_INVALID')
    response.json({ data: { user: { id: user.id, name: user.name, email: user.email, role: user.role, emailVerified: Boolean(user.emailVerifiedAt) }, token: issueToken(user.id, user.role) } })
  } catch (error) { next(error) }
}

export const me: RequestHandler = async (request, response, next) => {
  try { const user = await UserModel.findById(request.auth?.userId); if (!user) throw new AppError(404, 'Account not found', 'USER_NOT_FOUND'); response.json({ data: { id: user.id, name: user.name, email: user.email, role: user.role, emailVerified: Boolean(user.emailVerifiedAt) } }) } catch (error) { next(error) }
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
    response.json({ data: { user: { id: user.id, name: user.name, email: user.email, role: user.role, emailVerified: Boolean(user.emailVerifiedAt) }, token: issueToken(user.id, user.role) } })
  } catch (error) { next(error) }
}

export const requestOtp: RequestHandler = async (_request, _response, next) => next(new AppError(501, 'Email delivery is not configured. Configure an approved email provider before requesting an OTP.', 'EMAIL_DELIVERY_NOT_CONFIGURED'))

export const verifyOtp: RequestHandler = async (request, response, next) => {
  try {
    const user = await UserModel.findOne({ email: request.body.email })
    if (!user) throw new AppError(401, 'The OTP could not be verified', 'OTP_INVALID')
    const otp = await EmailOtpModel.findOne({ user: user.id, purpose: request.body.purpose, consumedAt: null }).select('+codeHash')
    if (!otp || otp.expiresAt < new Date() || otp.attempts >= 5 || createHash('sha256').update(request.body.code).digest('hex') !== otp.codeHash) { if (otp) { otp.attempts += 1; await otp.save() }; throw new AppError(401, 'The OTP could not be verified', 'OTP_INVALID') }
    otp.consumedAt = new Date(); await otp.save(); user.emailVerifiedAt = new Date(); await user.save(); response.json({ data: { verified: true, token: issueToken(user.id, user.role) } })
  } catch (error) { next(error) }
}