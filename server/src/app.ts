import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { pinoHttp } from 'pino-http'
import { env } from './config/env.js'
import { errorHandler, notFoundHandler } from './middleware/errors.js'
import { adminRouter } from './routes/admin.js'
import { authRouter } from './routes/auth.js'
import { commerceRouter } from './routes/commerce.js'
import { healthRouter } from './routes/health.js'
import { projectsRouter } from './routes/projects.js'
import { supportRouter } from './routes/support.js'

export function createApp() {
  const app = express()
  app.disable('x-powered-by')
  app.use(helmet())
  app.use(cors({ origin: env.CLIENT_ORIGIN, methods: ['GET', 'POST', 'PATCH'], allowedHeaders: ['Content-Type', 'Authorization'] }))
  app.use(express.json({ limit: '100kb' }))
  app.use(pinoHttp({ redact: ['req.headers.authorization', 'req.headers.cookie'] }))
  app.use('/api/health', healthRouter)
  app.use('/api/auth', authRouter)
  app.use('/api/projects', projectsRouter)
  app.use('/api/support', supportRouter)
  app.use('/api', commerceRouter)
  app.use('/api/admin', adminRouter)
  app.use(notFoundHandler)
  app.use(errorHandler)
  return app
}