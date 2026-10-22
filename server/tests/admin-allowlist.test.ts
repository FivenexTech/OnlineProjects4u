import jwt from 'jsonwebtoken'
import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'
import { env } from '../src/config/env.js'

const findById = vi.hoisted(() => vi.fn())
vi.mock('../src/models/user.js', () => ({ UserModel: { findById } }))

import { createApp } from '../src/app.js'

describe('admin email allowlist', () => {
  it('rejects an admin-role token whose database email is not allowlisted', async () => {
    findById.mockReturnValue({
      select: () => ({
        lean: () => Promise.resolve({
          email: 'verified-but-not-allowlisted@example.com',
          role: 'admin',
          emailVerifiedAt: new Date(),
        }),
      }),
    })
    const token = jwt.sign({ role: 'admin' }, env.JWT_SECRET, { subject: '507f1f77bcf86cd799439011' })

    const response = await request(createApp()).get('/api/admin/overview').set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(403)
    expect(response.body.error.code).toBe('FORBIDDEN')
  })
})
