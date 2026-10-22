import { normalizeEmail } from './email-identity.js'

export function isEligibleAdminPromotion(email: string, emailVerifiedAt: Date | null | undefined, configuredAdminEmail: string | undefined): boolean {
  return Boolean(emailVerifiedAt && configuredAdminEmail && normalizeEmail(email) === normalizeEmail(configuredAdminEmail))
}
