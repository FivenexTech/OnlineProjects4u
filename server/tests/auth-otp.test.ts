import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { env } from '../src/config/env.js'

const userFindOne = vi.hoisted(() => vi.fn())
const userCreate = vi.hoisted(() => vi.fn())
const issueVerificationOtp = vi.hoisted(() => vi.fn())
const verifyEmailOtp = vi.hoisted(() => vi.fn())
const createSession = vi.hoisted(() => vi.fn())
const sessionCookie = vi.hoisted(() => vi.fn())
vi.mock('../src/models/user.js', () => ({ UserModel: { findOne: userFindOne, create: userCreate, findById: vi.fn() } }))
vi.mock('../src/services/email-verification.js', () => ({ issueVerificationOtp, verifyEmailOtp }))
vi.mock('../src/services/sessions.js', () => ({ createSession, sessionCookie, sessionCookieName: 'op_session', revokeSession: vi.fn() }))

import { createApp } from '../src/app.js'

describe('passwordless OTP HTTP flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    userFindOne.mockResolvedValue(null)
    issueVerificationOtp.mockResolvedValue(undefined)
    verifyEmailOtp.mockResolvedValue(undefined)
    userCreate.mockResolvedValue({ id: 'new-user-id', name: 'student', email: 'student@example.com', role: 'student' })
    createSession.mockResolvedValue('session-token')
    sessionCookie.mockReturnValue('op_session=session-token; Max-Age=604800; HttpOnly; SameSite=Lax')
  })

  it('returns a generic request response and does not reveal the submitted email', async () => {
    const response = await request(createApp()).post('/api/auth/otp/request').send({ email: 'student@example.com' })
    expect(response.status).toBe(202)
    expect(response.body).toEqual({ data: { message: 'If verification is required, a code has been sent.' } })
    expect(JSON.stringify(response.body)).not.toContain('student@example.com')
  })

  it('creates a student account after successful verification and issues a seven-day session', async () => {
    const response = await request(createApp()).post('/api/auth/otp/verify').send({ email: 'student@example.com', purpose: 'email_verification', code: '123456' })
    expect(response.status).toBe(200)
    expect(userCreate).toHaveBeenCalledWith(expect.objectContaining({ email: 'student@example.com', role: 'student', emailVerifiedAt: expect.any(Date) }))
    expect(createSession).toHaveBeenCalledWith('new-user-id')
    expect(response.headers['set-cookie'][0]).toContain('Max-Age=604800')
  })

  it('preserves an existing administrator role during OTP verification', async () => {
    const admin = {
      id: 'admin-id',
      name: 'OnlineProjects4U Admin',
      email: 'onlineprojects44u@gmail.com',
      role: 'admin',
      emailVerifiedAt: new Date(),
      save: vi.fn().mockResolvedValue(undefined),
    }
    userFindOne.mockResolvedValue(admin)

    const response = await request(createApp()).post('/api/auth/otp/verify').send({ email: admin.email, purpose: 'email_verification', code: '123456' })

    expect(response.status).toBe(200)
    expect(admin.role).toBe('admin')
    expect(response.body.data.user).toMatchObject({ email: admin.email, role: 'admin', emailVerified: true })
    expect(userCreate).not.toHaveBeenCalled()
  })

  it('rejects a non-allowlisted email from the admin OTP flow before issuing a code', async () => {
    const response = await request(createApp()).post('/api/auth/otp/request').send({ email: 'verified-customer@example.com', purpose: 'admin_login' })

    expect(response.status).toBe(403)
    expect(response.body.error.code).toBe('ADMIN_EMAIL_NOT_ALLOWED')
    expect(issueVerificationOtp).not.toHaveBeenCalled()
  })

  it('requires the allowlisted, provisioned administrator for an admin session', async () => {
    const admin = {
      id: 'admin-id',
      name: 'OnlineProjects4U Admin',
      email: `  ${env.ADMIN_EMAIL} `,
      role: 'admin',
      emailVerifiedAt: new Date(),
      save: vi.fn().mockResolvedValue(undefined),
    }
    userFindOne.mockResolvedValue(admin)

    const requested = await request(createApp()).post('/api/auth/otp/request').send({ email: ` ${env.ADMIN_EMAIL?.toUpperCase()} `, purpose: 'admin_login' })
    const verified = await request(createApp()).post('/api/auth/otp/verify').send({ email: ` ${env.ADMIN_EMAIL?.toUpperCase()} `, purpose: 'admin_login', code: '123456' })

    expect(requested.status).toBe(202)
    expect(issueVerificationOtp).toHaveBeenCalledWith('admin-id', env.ADMIN_EMAIL, 'admin_login')
    expect(verified.status).toBe(200)
    expect(verified.body.data.user.role).toBe('admin')
    expect(createSession).toHaveBeenCalledWith('admin-id')
  })

  it('does not issue an admin session for an allowlisted account that is not provisioned', async () => {
    userFindOne.mockResolvedValue({ id: 'student-id', name: 'Customer', email: env.ADMIN_EMAIL, role: 'student', emailVerifiedAt: new Date(), save: vi.fn() })

    const response = await request(createApp()).post('/api/auth/otp/verify').send({ email: env.ADMIN_EMAIL, purpose: 'admin_login', code: '123456' })

    expect(response.status).toBe(403)
    expect(response.body.error.code).toBe('ADMIN_NOT_PROVISIONED')
    expect(createSession).not.toHaveBeenCalled()
  })
})
