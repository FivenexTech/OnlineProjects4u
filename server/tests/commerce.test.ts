import jwt from 'jsonwebtoken'
import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { env } from '../src/config/env.js'

const orderFind = vi.hoisted(() => vi.fn())
const orderCreate = vi.hoisted(() => vi.fn())
const orderFindOne = vi.hoisted(() => vi.fn())
const orderCountDocuments = vi.hoisted(() => vi.fn())
const projectFind = vi.hoisted(() => vi.fn())
const paymentFindOne = vi.hoisted(() => vi.fn())
const paymentCreate = vi.hoisted(() => vi.fn())
const startSession = vi.hoisted(() => vi.fn(async () => ({ withTransaction: async (callback: () => Promise<void>) => callback(), endSession: vi.fn() })))
const createRazorpayOrder = vi.hoisted(() => vi.fn())
const razorpayKeyId = vi.hoisted(() => vi.fn(() => 'rzp_test_public'))

vi.mock('mongoose', async (importOriginal) => {
  const actual = await importOriginal<typeof import('mongoose')>()
  return { ...actual, default: { ...actual.default, startSession } }
})
vi.mock('../src/models/order.js', () => ({ OrderModel: { find: orderFind, create: orderCreate, findOne: orderFindOne, updateOne: vi.fn(), countDocuments: orderCountDocuments, exists: vi.fn() } }))
vi.mock('../src/models/project.js', () => ({ ProjectModel: { find: projectFind, findOne: vi.fn() } }))
vi.mock('../src/models/payment.js', () => ({ PaymentModel: { findOne: paymentFindOne, create: paymentCreate } }))
vi.mock('../src/models/audit-log.js', () => ({ AuditLogModel: { create: vi.fn().mockResolvedValue(undefined) } }))
vi.mock('../src/services/razorpay.js', () => ({ createRazorpayOrder, razorpayKeyId, fetchRazorpayPayment: vi.fn(), verifyRazorpaySignature: vi.fn(), verifyWebhookSignature: vi.fn(() => false) }))

import { createApp } from '../src/app.js'

function token(role: 'student' | 'admin' = 'student'): string {
  return jwt.sign({ role }, env.JWT_SECRET, { subject: `${role}-test-id` })
}

describe('orders and payments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    orderFind.mockReturnValue({ sort: () => ({ lean: () => Promise.resolve([{ id: 'order-1', status: 'pending' }]) }) })
    orderCountDocuments.mockResolvedValue(0)
    createRazorpayOrder.mockResolvedValue({ id: 'rzp-order-1', amount: 120000, currency: 'INR' })
  })

  it('rejects commerce access without authentication', async () => {
    const response = await request(createApp()).get('/api/orders')
    expect(response.status).toBe(401)
    expect(response.body.error.code).toBe('AUTH_REQUIRED')
  })

  it('lists the authenticated user orders from the database', async () => {
    const response = await request(createApp()).get('/api/orders').set('Authorization', `Bearer ${token()}`)
    expect(response.status).toBe(200)
    expect(response.body.data).toEqual([{ id: 'order-1', status: 'pending' }])
    expect(orderFind).toHaveBeenCalledWith({ user: 'student-test-id' })
  })

  it('validates malformed project references before reaching the database', async () => {
    const response = await request(createApp()).post('/api/orders').set('Authorization', `Bearer ${token()}`).send({ projectIds: ['not a valid project'] })
    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('VALIDATION_ERROR')
    expect(projectFind).not.toHaveBeenCalled()
  })

  it('creates an order from published project records', async () => {
    projectFind.mockReturnValue({ select: () => ({ session: () => ({ lean: () => Promise.resolve([{ _id: '507f1f77bcf86cd799439011', title: 'Published project', category: 'Web Development', price: 1200, currency: 'INR' }]) }) }) })
    orderCreate.mockResolvedValue([{ _id: 'order-1', amount: 1200, status: 'pending' }])
    const response = await request(createApp()).post('/api/orders').set('Authorization', `Bearer ${token()}`).send({ projectIds: ['507f1f77bcf86cd799439011'] })
    expect(response.status).toBe(201)
    expect(response.body.data.status).toBe('pending')
    expect(orderCreate).toHaveBeenCalledWith([expect.objectContaining({ user: 'student-test-id', amount: 1200, subtotal: 1200, discountAmount: 0, status: 'pending' })], expect.objectContaining({ session: expect.anything() }))
  })

  it('creates an unverified payment record for a pending order', async () => {
    orderFindOne.mockReturnValue({ lean: () => Promise.resolve({ _id: '507f1f77bcf86cd799439011', amount: 1200, currency: 'INR', status: 'pending' }) })
    paymentFindOne.mockReturnValue({ lean: () => Promise.resolve(null) })
    paymentCreate.mockResolvedValue({ id: 'payment-1', status: 'created' })
    const response = await request(createApp()).post('/api/payments/create').set('Authorization', `Bearer ${token()}`).send({ orderId: '507f1f77bcf86cd799439011' })
    expect(response.status).toBe(201)
    expect(response.body.data.payment.status).toBe('created')
    expect(response.body.data.razorpayOrderId).toBe('rzp-order-1')
    expect(paymentCreate).toHaveBeenCalledWith(expect.objectContaining({ provider: 'razorpay', status: 'created', amount: 1200 }))
  })

  it('rejects an invalid Razorpay webhook signature', async () => {
    const response = await request(createApp()).post('/api/payments/webhook').set('Authorization', `Bearer ${token()}`).send({ event: 'payment.captured' })
    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('WEBHOOK_SIGNATURE_INVALID')
    expect(paymentCreate).not.toHaveBeenCalled()
  })

  it('protects admin order records from student accounts', async () => {
    const response = await request(createApp()).get('/api/admin/orders').set('Authorization', `Bearer ${token()}`)
    expect(response.status).toBe(403)
    expect(response.body.error.code).toBe('FORBIDDEN')
  })

  it('protects coupon management from student accounts', async () => {
    const response = await request(createApp()).get('/api/admin/coupons').set('Authorization', `Bearer ${token()}`)
    expect(response.status).toBe(403)
    expect(response.body.error.code).toBe('FORBIDDEN')
  })

  it('protects customer records from student accounts', async () => {
    const response = await request(createApp()).get('/api/admin/users').set('Authorization', `Bearer ${token()}`)
    expect(response.status).toBe(403)
    expect(response.body.error.code).toBe('FORBIDDEN')
  })

  it('rejects percentage coupons above one hundred', async () => {
    const response = await request(createApp()).post('/api/admin/coupons').set('Authorization', `Bearer ${token('admin')}`).send({ code: 'TOO-MUCH', discountType: 'percentage', discountValue: 101 })
    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('VALIDATION_ERROR')
  })
})
