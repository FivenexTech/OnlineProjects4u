import { Router } from 'express'
import { createAdminCoupon, deleteAdminCoupon, listAdminCoupons, setAdminCouponActive, updateAdminCoupon } from '../controllers/admin-coupons.js'
import { listAdminCustomers } from '../controllers/admin-users.js'
import { listAdminSupportTickets, updateAdminSupportTicket } from '../controllers/admin-support.js'
import { listAdminOrders } from '../controllers/admin-orders.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { notConfigured } from '../controllers/placeholders.js'
import { overview } from '../controllers/admin.js'
import { createProject, getAdminProject, listAdminProjects, transitionAdminProject, updateAdminProject, updateProjectFiles } from '../controllers/admin-projects.js'
import { validateBody } from '../middleware/validation.js'
import { couponInputSchema, couponStatusSchema, couponUpdateSchema } from '../schemas/commerce.js'
import { fileMetadataSchema, projectInputSchema, projectUpdateSchema } from '../schemas/project.js'
import { supportTicketStatusSchema } from '../schemas/support.js'
import { listAdminPayments } from '../controllers/admin-payments.js'
import { getSettings, listAdminReviews, listAuditLogs, moderateReview, reports, updateSettings } from '../controllers/admin-modules.js'
import { platformSettingsSchema, reviewStatusSchema } from '../schemas/admin-modules.js'

export const adminRouter = Router()
adminRouter.use(requireAuth, requireRole('admin'))
adminRouter.get('/overview', overview)
adminRouter.get('/projects', listAdminProjects)
adminRouter.post('/projects', validateBody(projectInputSchema), createProject)
adminRouter.get('/projects/:id', getAdminProject)
adminRouter.patch('/projects/:id', validateBody(projectUpdateSchema), updateAdminProject)
adminRouter.post('/projects/:id/:action', transitionAdminProject)
adminRouter.post('/projects/:id/files', validateBody(fileMetadataSchema), updateProjectFiles)
adminRouter.get('/orders', listAdminOrders)
adminRouter.get('/payments', listAdminPayments)
adminRouter.get('/coupons', listAdminCoupons)
adminRouter.post('/coupons', validateBody(couponInputSchema), createAdminCoupon)
adminRouter.patch('/coupons/:id', validateBody(couponUpdateSchema), updateAdminCoupon)
adminRouter.patch('/coupons/:id/status', validateBody(couponStatusSchema), setAdminCouponActive)
adminRouter.delete('/coupons/:id', deleteAdminCoupon)
adminRouter.get('/users', listAdminCustomers)
adminRouter.get('/support', listAdminSupportTickets)
adminRouter.patch('/support/:id', validateBody(supportTicketStatusSchema), updateAdminSupportTicket)
adminRouter.get('/reviews', listAdminReviews)
adminRouter.patch('/reviews/:id/status', validateBody(reviewStatusSchema), moderateReview)
adminRouter.get('/reports', reports)
adminRouter.get('/audit-logs', listAuditLogs)
adminRouter.get('/settings', getSettings)
adminRouter.patch('/settings', validateBody(platformSettingsSchema), updateSettings)