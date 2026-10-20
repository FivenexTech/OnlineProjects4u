import { connectDatabase, disconnectDatabase } from '../config/database.js'
import { env } from '../config/env.js'
import { UserModel } from '../models/user.js'
import { isEligibleAdminPromotion } from '../services/admin-bootstrap.js'

async function provisionAdmin(): Promise<void> {
  if (!env.ADMIN_EMAIL) throw new Error('ADMIN_EMAIL must be supplied for one-time provisioning')
  await connectDatabase()
  const existing = await UserModel.findOne({ email: env.ADMIN_EMAIL })
  if (!existing) throw new Error('The administrator must register and verify the configured email before provisioning')
  if (!isEligibleAdminPromotion(existing.email, existing.emailVerifiedAt, env.ADMIN_EMAIL)) throw new Error('The configured administrator email is not verified')
  existing.role = 'admin'
  await existing.save()
  console.log('Verified administrator provisioning completed')
}

provisionAdmin().catch(() => { console.error('Admin provisioning failed'); process.exitCode = 1 }).finally(() => { void disconnectDatabase() })