import { describe, expect, it } from 'vitest'
import { vi } from 'vitest'
import { sendVerificationOtp } from '../src/services/email.js'
import { env } from '../src/config/env.js'

const send = vi.hoisted(() => vi.fn())
vi.mock('resend', () => ({ Resend: vi.fn(() => ({ emails: { send } })) }))

describe('verification email provider', () => {
  it('fails closed when transactional email is not configured', async () => {
    const previousKey = env.RESEND_API_KEY
    env.RESEND_API_KEY = undefined
    await expect(sendVerificationOtp('student@example.com', '123456')).rejects.toMatchObject({ code: 'EMAIL_DELIVERY_NOT_CONFIGURED', statusCode: 503 })
    env.RESEND_API_KEY = previousKey
  })

  it('sends HTML and plain-text OTP content through the Resend SDK', async () => {
    const previousKey = env.RESEND_API_KEY
    env.RESEND_API_KEY = 'test-resend-key'
    send.mockReset()
    send.mockResolvedValue({ data: { id: 'email-id' }, error: null })
    await sendVerificationOtp('student@example.com', '123456')
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ from: expect.stringContaining(env.RESEND_FROM_EMAIL), to: ['student@example.com'], html: expect.stringContaining('123456'), text: expect.stringContaining('123456') }))
    env.RESEND_API_KEY = previousKey
  })

  it('maps provider failures without exposing provider details', async () => {
    const previousKey = env.RESEND_API_KEY
    env.RESEND_API_KEY = 'test-resend-key'
    send.mockResolvedValue({ data: null, error: { message: 'provider secret detail' } })
    await expect(sendVerificationOtp('student@example.com', '123456')).rejects.toMatchObject({ code: 'EMAIL_DELIVERY_FAILED', statusCode: 502 })
    env.RESEND_API_KEY = previousKey
  })
})