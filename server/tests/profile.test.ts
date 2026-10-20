import jwt from 'jsonwebtoken'
import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { env } from '../src/config/env.js'

const findById = vi.hoisted(() => vi.fn())
const findByIdAndUpdate = vi.hoisted(() => vi.fn())
vi.mock('../src/models/user.js', () => ({ UserModel: { findById, findByIdAndUpdate } }))

import { createApp } from '../src/app.js'

const token = jwt.sign({ role: 'student' }, env.JWT_SECRET, { subject: 'student-profile-id' })

describe('profile API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    findById.mockResolvedValue({ id: 'student-profile-id', name: 'Student User', email: 'student@example.com', phone: '', role: 'student', emailVerifiedAt: new Date(), createdAt: new Date('2026-01-01') })
    findByIdAndUpdate.mockReturnValue({ lean: () => Promise.resolve({ _id: { toString: () => 'student-profile-id' }, name: 'Updated User', email: 'student@example.com', phone: '+91 12345', role: 'student', emailVerifiedAt: new Date(), createdAt: new Date('2026-01-01') }) })
  })

  it('returns only the authenticated user profile', async () => {
    const response = await request(createApp()).get('/api/auth/me').set('Authorization', `Bearer ${token}`)
    expect(response.status).toBe(200)
    expect(response.body.data).toMatchObject({ id: 'student-profile-id', email: 'student@example.com', role: 'student' })
    expect(response.body.data.createdAt).toBeTruthy()
  })

  it('updates only the authenticated user profile fields', async () => {
    const response = await request(createApp()).patch('/api/auth/me').set('Authorization', `Bearer ${token}`).send({ name: 'Updated User', phone: '+91 12345', role: 'admin' })
    expect(response.status).toBe(200)
    expect(findByIdAndUpdate).toHaveBeenCalledWith('student-profile-id', { $set: { name: 'Updated User', phone: '+91 12345' } }, { new: true, runValidators: true })
    expect(response.body.data.role).toBe('student')
  })
})
