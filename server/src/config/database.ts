import { setServers } from 'node:dns'
import mongoose from 'mongoose'
import { env } from './env.js'

function configureMongoDns(): void {
  const servers = env.MONGODB_DNS_SERVERS.split(',').map((server) => server.trim()).filter(Boolean)
  if (servers.length > 0) setServers(servers)
}

export async function connectDatabase(): Promise<void> {
	configureMongoDns()
  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect()
}

export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1
}