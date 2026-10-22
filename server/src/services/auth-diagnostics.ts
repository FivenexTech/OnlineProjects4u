import mongoose from 'mongoose'
import { env } from '../config/env.js'

type AuthStage = 'request' | 'otp-verify' | 'session' | 'bearer' | 'me' | 'authorization'

export function authDiagnostic(stage: AuthStage, details: Record<string, unknown>): void {
  if (env.NODE_ENV !== 'development') return
  console.info('[auth]', JSON.stringify({
    stage,
    backend: `${env.CLIENT_ORIGIN}|${env.ADMIN_ORIGIN}`,
    database: mongoose.connection.name || 'not-connected',
    ...details,
  }))
}
