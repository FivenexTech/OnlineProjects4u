import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'

describe('GET /api/health', () => {
  it('returns service health without requiring MongoDB', async () => {
    const response = await request(createApp()).get('/api/health')
    expect(response.status).toBe(200)
    expect(response.body.data.status).toBe('ok')
  })

  it('reports database readiness separately when MongoDB is not connected', async () => {
    const response = await request(createApp()).get('/api/health/ready')
    expect(response.status).toBe(503)
    expect(response.body.data.status).toBe('not-ready')
    expect(response.body.data.database).toBe('not-connected')
  })
})