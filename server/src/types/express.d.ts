import type { UserRole } from '../models/user.js'

declare global {
  namespace Express {
    interface Request {
      auth?: { userId: string; role: UserRole; sessionId?: string }
    }
  }
}

export {}