export function isEligibleAdminPromotion(email: string, emailVerifiedAt: Date | null | undefined, configuredAdminEmail: string | undefined): boolean {
  return Boolean(emailVerifiedAt && configuredAdminEmail && email.trim().toLowerCase() === configuredAdminEmail.trim().toLowerCase())
}
