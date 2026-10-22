import { env } from '../config/env.js'

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function isAuthorizedAdminEmail(email: string): boolean {
  return Boolean(env.ADMIN_EMAIL && normalizeEmail(email) === normalizeEmail(env.ADMIN_EMAIL))
}
