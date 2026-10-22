import crypto from 'node:crypto'
import Razorpay from 'razorpay'
import { env } from '../config/env.js'
import { AppError } from '../middleware/errors.js'

let client: Razorpay | undefined
function getClient(): Razorpay {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) throw new AppError(503, 'Razorpay is not configured', 'RAZORPAY_NOT_CONFIGURED')
  return client ??= new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET })
}

export function razorpayKeyId(): string {
  if (!env.RAZORPAY_KEY_ID) throw new AppError(503, 'Razorpay is not configured', 'RAZORPAY_NOT_CONFIGURED')
  return env.RAZORPAY_KEY_ID
}

export async function createRazorpayOrder(amountRupees: number, receipt: string): Promise<{ id: string; amount: number; currency: string }> {
  const order = await getClient().orders.create({ amount: Math.round(amountRupees * 100), currency: 'INR', receipt, payment_capture: true })
  return { id: order.id, amount: Number(order.amount), currency: String(order.currency) }
}

export async function fetchRazorpayPayment(paymentId: string): Promise<{ order_id?: string; amount: number; currency: string; status: string }> {
  const payment = await getClient().payments.fetch(paymentId)
  return { order_id: payment.order_id, amount: Number(payment.amount), currency: String(payment.currency), status: String(payment.status) }
}

export function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string): boolean {
  if (!env.RAZORPAY_KEY_SECRET) throw new AppError(503, 'Razorpay is not configured', 'RAZORPAY_NOT_CONFIGURED')
  const expected = crypto.createHmac('sha256', env.RAZORPAY_KEY_SECRET).update(`${orderId}|${paymentId}`).digest()
  const received = Buffer.from(signature, 'hex')
  return received.length === expected.length && crypto.timingSafeEqual(expected, received)
}

export function verifyWebhookSignature(rawBody: Buffer, signature: string): boolean {
  if (!env.RAZORPAY_WEBHOOK_SECRET) throw new AppError(503, 'Razorpay webhook is not configured', 'RAZORPAY_WEBHOOK_NOT_CONFIGURED')
  const expected = crypto.createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest()
  const received = Buffer.from(signature, 'hex')
  return received.length === expected.length && crypto.timingSafeEqual(expected, received)
}
