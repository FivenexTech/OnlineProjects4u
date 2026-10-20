import { createHash } from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const otpFindOne = vi.hoisted(() => vi.fn())
const otpCreate = vi.hoisted(() => vi.fn())
const otpDeleteOne = vi.hoisted(() => vi.fn())
const sendVerificationOtp = vi.hoisted(() => vi.fn())
vi.mock('../src/models/email-otp.js', () => ({ EmailOtpModel: { findOne: otpFindOne, create: otpCreate, deleteOne: otpDeleteOne } }))
vi.mock('../src/services/email.js', () => ({ sendVerificationOtp }))

import { issueVerificationOtp, verifyEmailOtp } from '../src/services/email-verification.js'

describe('email OTP security', () => {
  beforeEach(() => vi.clearAllMocks())

  it('generates a six-digit OTP, stores only its hash, and sends it', async () => {
    otpFindOne.mockReturnValue({ sort: () => Promise.resolve(null) })
    otpCreate.mockImplementation(async (record) => ({ id: 'otp-id', ...record }))
    await issueVerificationOtp('user-id', 'student@example.com')
    const record = otpCreate.mock.calls[0][0] as { codeHash: string; expiresAt: Date; cooldownUntil: Date }
    expect(record.codeHash).toMatch(/^[a-f\d]{64}$/)
    expect(record.expiresAt.getTime()).toBeGreaterThan(Date.now())
    expect(record.cooldownUntil.getTime()).toBeGreaterThan(Date.now())
    expect(sendVerificationOtp).toHaveBeenCalledWith('student@example.com', expect.stringMatching(/^\d{6}$/))
    expect(JSON.stringify(record)).not.toMatch(/\b\d{6}\b/)
  })

  it('enforces resend cooldown without creating another OTP', async () => {
    otpFindOne.mockReturnValue({ sort: () => Promise.resolve({ cooldownUntil: new Date(Date.now() + 30_000) }) })
    await expect(issueVerificationOtp(undefined, 'student@example.com')).rejects.toMatchObject({ code: 'OTP_COOLDOWN', statusCode: 429 })
    expect(otpCreate).not.toHaveBeenCalled()
    expect(sendVerificationOtp).not.toHaveBeenCalled()
  })

  it('rejects expired and repeatedly invalid OTPs', async () => {
    const save = vi.fn()
    const expired = { expiresAt: new Date(Date.now() - 1), attempts: 0, codeHash: createHash('sha256').update('123456').digest('hex'), save }
    otpFindOne.mockReturnValue({ sort: () => ({ select: () => Promise.resolve(expired) }) })
    await expect(verifyEmailOtp('student@example.com', '123456')).rejects.toMatchObject({ code: 'OTP_INVALID' })
    expect(save).not.toHaveBeenCalled()

    const attempts = { expiresAt: new Date(Date.now() + 60_000), attempts: 5, codeHash: expired.codeHash, save }
    otpFindOne.mockReturnValue({ sort: () => ({ select: () => Promise.resolve(attempts) }) })
    await expect(verifyEmailOtp('student@example.com', '123456')).rejects.toMatchObject({ code: 'OTP_INVALID' })
  })

  it('increments failed attempts and consumes a valid OTP once', async () => {
    const save = vi.fn()
    const otp = { expiresAt: new Date(Date.now() + 60_000), attempts: 0, codeHash: createHash('sha256').update('123456').digest('hex'), save }
    otpFindOne.mockReturnValue({ sort: () => ({ select: () => Promise.resolve(otp) }) })
    await expect(verifyEmailOtp('student@example.com', '000000')).rejects.toMatchObject({ code: 'OTP_INVALID' })
    expect(otp.attempts).toBe(1)
    expect(save).toHaveBeenCalledTimes(1)

    otpFindOne.mockReturnValue({ sort: () => ({ select: () => Promise.resolve(otp) }) })
    await verifyEmailOtp('student@example.com', '123456')
    expect(otp.consumedAt).toBeInstanceOf(Date)
    expect(save).toHaveBeenCalledTimes(2)
  })
})
