import jwt from 'jsonwebtoken'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { env } from '../src/config/env.js'

describe('admin authorization', () => {
  it('rejects an unauthenticated admin request', async () => {
    const response = await request(createApp()).get('/api/admin/overview')
    expect(response.status).toBe(401)
    expect(response.body.error.code).toBe('AUTH_REQUIRED')
  })

  it('rejects a valid student token with 403', async () => {
    const token = jwt.sign({ role: 'student' }, env.JWT_SECRET, { subject: 'student-test-id' })
    const response = await request(createApp()).get('/api/admin/overview').set('Authorization', `Bearer ${token}`)
    expect(response.status).toBe(403)
    expect(response.body.error.code).toBe('FORBIDDEN')
  })

  it('rejects an expired token with 401', async () => {
    const token = jwt.sign({ role: 'student' }, env.JWT_SECRET, { subject: 'expired-test-id', expiresIn: -1 })
    const response = await request(createApp()).get('/api/auth/me').set('Authorization', `Bearer ${token}`)
    expect(response.status).toBe(401)
    expect(response.body.error.code).toBe('AUTH_INVALID')
  })

  it('protects profile reads and updates', async () => {
    const read = await request(createApp()).get('/api/auth/me')
    const update = await request(createApp()).patch('/api/auth/me').send({ name: 'Updated Student' })
    expect(read.status).toBe(401)
    expect(update.status).toBe(401)
    expect(update.body.error.code).toBe('AUTH_REQUIRED')
  })
})