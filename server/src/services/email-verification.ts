import { createHash, randomInt, timingSafeEqual } from 'node:crypto'
import { EmailOtpModel } from '../models/email-otp.js'
import { AppError } from '../middleware/errors.js'
import { sendVerificationOtp } from './email.js'
import { normalizeEmail } from './email-identity.js'

export type OtpPurpose = 'email_verification' | 'login' | 'admin_login'

const OTP_TTL_MS = 10 * 60 * 1000
const OTP_COOLDOWN_MS = 60 * 1000
const MAX_ATTEMPTS = 5

function hashCode(code: string): string { return createHash('sha256').update(code).digest('hex') }

export async function issueVerificationOtp(userId: string | undefined, email: string, purpose: OtpPurpose = 'email_verification'): Promise<void> {
  email = normalizeEmail(email)
  const now = new Date()
  const active = await EmailOtpModel.findOne({ email, purpose, consumedAt: null }).sort({ createdAt: -1 })
  if (active && active.cooldownUntil > now) throw new AppError(429, 'Please wait before requesting another verification code', 'OTP_COOLDOWN')
  const code = String(randomInt(100000, 1000000))
  const otp = await EmailOtpModel.create({ user: userId, email, purpose, codeHash: hashCode(code), expiresAt: new Date(now.getTime() + OTP_TTL_MS), cooldownUntil: new Date(now.getTime() + OTP_COOLDOWN_MS) })
  try { await sendVerificationOtp(email, code) } catch (error) { await EmailOtpModel.deleteOne({ _id: otp.id }); throw error }
}

export async function verifyEmailOtp(email: string, code: string, purpose: OtpPurpose = 'email_verification'): Promise<void> {
  email = normalizeEmail(email)
  const otp = await EmailOtpModel.findOne({ email, purpose, consumedAt: null }).sort({ createdAt: -1 }).select('+codeHash')
  const invalid = (): never => { throw new AppError(401, 'The verification code is invalid or expired', 'OTP_INVALID') }
  if (!otp) invalid()
  const currentOtp = otp as NonNullable<typeof otp>
  if (currentOtp.expiresAt <= new Date() || currentOtp.attempts >= MAX_ATTEMPTS) invalid()
  const expected = Buffer.from(currentOtp.codeHash, 'hex'); const actual = Buffer.from(hashCode(code), 'hex')
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) { currentOtp.attempts += 1; await currentOtp.save(); invalid() }
  currentOtp.consumedAt = new Date(); await currentOtp.save()
}