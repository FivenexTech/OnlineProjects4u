import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type { RequestHandler } from 'express'
import { UserModel } from '../models/user.js'
import { env } from '../config/env.js'
import { AppError } from '../middleware/errors.js'

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