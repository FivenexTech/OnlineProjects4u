import { describe, expect, it } from 'vitest'
import { registerSchema } from '../src/schemas/auth.js'
import { isEligibleAdminPromotion } from '../src/services/admin-bootstrap.js'

describe('administrator bootstrap safety', () => {
  it('matches only a verified normalized configured email', () => {
    expect(isEligibleAdminPromotion(' OnlineProjects44U@GMAIL.COM ', new Date(), 'onlineprojects44u@gmail.com')).toBe(true)
    expect(isEligibleAdminPromotion('onlineprojects44u@gmail.com', undefined, 'onlineprojects44u@gmail.com')).toBe(false)
    expect(isEligibleAdminPromotion('other@example.com', new Date(), 'onlineprojects44u@gmail.com')).toBe(false)
  })

  it('fails safely when administrator configuration is missing', () => {
    expect(isEligibleAdminPromotion('onlineprojects44u@gmail.com', new Date(), undefined)).toBe(false)
    expect(isEligibleAdminPromotion('onlineprojects44u@gmail.com', new Date(), '')).toBe(false)
  })

  it('does not accept a role from ordinary registration payloads', () => {
    expect(registerSchema.parse({ email: 'student@example.com', role: 'admin' })).toEqual({ email: 'student@example.com' })
  })
})
