import { createHash, randomBytes } from 'node:crypto'
import { SessionModel } from '../models/session.js'
import { env } from '../config/env.js'
export const sessionCookieName = 'op_session'
const hash = (value: string) => createHash('sha256').update(value).digest('hex')
export async function createSession(userId: string): Promise<string> { const token = randomBytes(32).toString('base64url'); await SessionModel.create({ user: userId, tokenHash: hash(token), expiresAt: new Date(Date.now() + env.SESSION_TTL_DAYS * 86400000) }); return token }
export async function findSession(token: string) { return SessionModel.findOne({ tokenHash: hash(token), revokedAt: null, expiresAt: { $gt: new Date() } }) }
export async function revokeSession(token: string): Promise<void> { await SessionModel.updateOne({ tokenHash: hash(token), revokedAt: null }, { $set: { revokedAt: new Date() } }) }
function cookieAttributes(): string {
  return `Path=/; HttpOnly; SameSite=Lax${env.SESSION_COOKIE_DOMAIN ? `; Domain=${env.SESSION_COOKIE_DOMAIN}` : ''}${env.COOKIE_SECURE ? '; Secure' : ''}`
}
export function sessionCookie(token: string): string { return `${sessionCookieName}=${token}; Max-Age=${env.SESSION_TTL_DAYS * 86400}; ${cookieAttributes()}` }
export function expiredSessionCookie(): string { return `${sessionCookieName}=; Max-Age=0; ${cookieAttributes()}` }