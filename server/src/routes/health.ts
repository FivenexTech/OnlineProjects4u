import { Router } from 'express'
import { isDatabaseConnected } from '../config/database.js'

export const healthRouter = Router()
healthRouter.get('/', (_request, response) => response.json({ data: { status: 'ok', service: 'onlineprojects4u-api' } }))
healthRouter.get('/ready', (_request, response) => {
	const database = isDatabaseConnected()
	return response.status(database ? 200 : 503).json({ data: { status: database ? 'ready' : 'not-ready', service: 'onlineprojects4u-api', database: database ? 'connected' : 'not-connected' } })
})