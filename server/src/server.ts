import { createApp } from './app.js'
import { connectDatabase, disconnectDatabase } from './config/database.js'
import { env } from './config/env.js'
import { fileURLToPath } from 'node:url'

export function formatDatabaseConnectionError(error: unknown): { name: string; code: string; message: string } {
	const details = error instanceof Error ? error : new Error(String(error))
	const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : 'UNKNOWN'
	const message = details.message.replace(/mongodb(?:\+srv)?:\/\/[^\s]+/gi, '[redacted-mongodb-uri]')
	return { name: details.name, code, message }
}

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
	startServer().catch((error: unknown) => {
		if (env.NODE_ENV === 'development') console.error('Database connection failed; API was not started', formatDatabaseConnectionError(error))
		else console.error('Database connection failed; API was not started')
		process.exitCode = 1
	})
}