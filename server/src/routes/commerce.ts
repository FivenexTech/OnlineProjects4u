import { Router } from 'express'
import { createOrder, createPayment, listOrders, listPurchases, paymentWebhook, verifyPayment } from '../controllers/commerce.js'
import { requireAuth } from '../middleware/auth.js'
import { validateBody } from '../middleware/validation.js'
import { createOrderSchema, createPaymentSchema, verifyPaymentSchema } from '../schemas/commerce.js'

export const commerceRouter = Router()
commerceRouter.use(requireAuth)
commerceRouter.post('/orders', validateBody(createOrderSchema), createOrder)
commerceRouter.get('/orders', listOrders)
commerceRouter.post('/payments/create', validateBody(createPaymentSchema), createPayment)
commerceRouter.post('/payments/verify', validateBody(verifyPaymentSchema), verifyPayment)
commerceRouter.get('/purchases', listPurchases)