import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

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
})
