import { createApp } from './app.js'
import { connectDatabase, disconnectDatabase } from './config/database.js'
import { env } from './config/env.js'
import { fileURLToPath } from 'node:url'

export async function startServer(): Promise<void> {
	await connectDatabase()
	const app = createApp()
	const server = app.listen(env.PORT, () => console.log(`OnlineProjects4U API listening on port ${env.PORT}`))
	const shutdown = (signal: string) => {
		console.log(`Received ${signal}; shutting down safely`)
		server.close(() => { void disconnectDatabase().finally(() => process.exit(0)) })
	}
	process.once('SIGINT', () => shutdown('SIGINT'))
	process.once('SIGTERM', () => shutdown('SIGTERM'))
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
	startServer().catch(() => { console.error('Database connection failed; API was not started'); process.exitCode = 1 })
}