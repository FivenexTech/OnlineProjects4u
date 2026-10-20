import jwt from 'jsonwebtoken'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { env } from '../src/config/env.js'

function token(role: 'student' | 'admin'): string {
  return jwt.sign({ role }, env.JWT_SECRET, { subject: `${role}-test-id` })
}

const validProject = {
  title: 'Project management test',
  slug: 'project-management-test',
  description: 'A project description that is long enough for validation.',
  category: 'Web Development',
  technologies: ['React', 'Node.js'],
  price: 1200,
}

describe('project management access and validation', () => {
  it('requires an admin for project creation', async () => {
    const response = await request(createApp()).post('/api/admin/projects').send(validProject)
    expect(response.status).toBe(401)
    expect(response.body.error.code).toBe('AUTH_REQUIRED')
  })

  it('rejects student project-management access', async () => {
    const response = await request(createApp()).post('/api/admin/projects').set('Authorization', `Bearer ${token('student')}`).send(validProject)
    expect(response.status).toBe(403)
    expect(response.body.error.code).toBe('FORBIDDEN')
  })

  it('rejects invalid project data before persistence', async () => {
    const response = await request(createApp()).post('/api/admin/projects').set('Authorization', `Bearer ${token('admin')}`).send({ ...validProject, slug: 'Not a slug' })
    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('rejects unsupported publication transitions', async () => {
    const response = await request(createApp()).post('/api/admin/projects/507f1f77bcf86cd799439011/release').set('Authorization', `Bearer ${token('admin')}`)
    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('INVALID_TRANSITION')
  })

  it('requires authentication before download authorization', async () => {
    const response = await request(createApp()).get('/api/projects/507f1f77bcf86cd799439011/download')
    expect(response.status).toBe(401)
    expect(response.body.error.code).toBe('AUTH_REQUIRED')
  })
})
