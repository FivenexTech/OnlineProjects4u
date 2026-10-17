import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CLIENT_ORIGIN: z.string().url().default('http://localhost:5173'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  MONGODB_DNS_SERVERS: z.string().default(process.platform === 'win32' ? '8.8.8.8,8.8.4.4' : ''),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  PASSWORD_RESET_URL: z.string().url().default('http://localhost:5173/reset-password'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().url().optional(),
  EMAIL_PROVIDER: z.enum(['console', 'resend', 'sendgrid']).default('console'),
  EMAIL_FROM: z.string().email().default('no-reply@example.invalid'),
  EMAIL_PROVIDER_API_KEY: z.string().optional(),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  PRIVATE_STORAGE_BUCKET: z.string().optional(),
})

export const env = envSchema.parse(process.env)