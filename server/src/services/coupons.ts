import type { ClientSession } from 'mongoose'
import { CouponRedemptionModel } from '../models/coupon-redemption.js'
import { CouponModel, type Coupon } from '../models/coupon.js'
import { AppError } from '../middleware/errors.js'

type PricingItem = { projectId: string; category: string; unitPrice: number }
type CouponLike = Pick<Coupon, 'code' | 'discountType' | 'discountValue' | 'startsAt' | 'expiresAt' | 'minimumOrderValue' | 'projectIds' | 'categories' | 'active'> & { usageLimit?: number | null; usageCount?: number | null }
type CouponDocument = CouponLike & { _id: unknown; perUserLimit?: number | null }

function couponFailure(message: string, code: string): never { throw new AppError(400, message, code) }

export function calculateCouponDiscount(coupon: CouponLike, items: PricingItem[], now = new Date()): { eligibleSubtotal: number; discountAmount: number } {
  if (!coupon.active) couponFailure('Coupon is inactive', 'COUPON_INACTIVE')
  if (coupon.startsAt && coupon.startsAt > now) couponFailure('Coupon is not active yet', 'COUPON_NOT_STARTED')
  if (coupon.expiresAt && coupon.expiresAt <= now) couponFailure('Coupon has expired', 'COUPON_EXPIRED')
  const subtotal = items.reduce((total, item) => total + item.unitPrice, 0)
  if (subtotal < (coupon.minimumOrderValue ?? 0)) couponFailure('Order does not meet the coupon minimum', 'COUPON_MINIMUM_NOT_MET')
  const projectIds = (coupon.projectIds ?? []).map(String)
  const categories = coupon.categories ?? []
  const hasRestrictions = projectIds.length > 0 || categories.length > 0
  const eligibleItems = hasRestrictions ? items.filter((item) => projectIds.includes(item.projectId) || categories.includes(item.category)) : items
  const eligibleSubtotal = eligibleItems.reduce((total, item) => total + item.unitPrice, 0)
  if (eligibleSubtotal <= 0) couponFailure('Coupon does not apply to these projects', 'COUPON_NOT_APPLICABLE')
  const discountAmount = coupon.discountType === 'percentage' ? Math.min(eligibleSubtotal, Math.round(eligibleSubtotal * coupon.discountValue / 100)) : Math.min(eligibleSubtotal, coupon.discountValue)
  if (discountAmount <= 0) couponFailure('Coupon does not provide a discount', 'COUPON_INVALID_DISCOUNT')
  return { eligibleSubtotal, discountAmount }
}

export async function reserveCoupon(code: string, userId: string, items: PricingItem[], subtotal: number, orderId: string, session: ClientSession): Promise<{ code: string; discountType: Coupon['discountType']; discountValue: number; discountAmount: number }> {
  const now = new Date()
  const filter: Record<string, unknown> = { code: code.toUpperCase(), active: true, $and: [{ $or: [{ startsAt: { $exists: false } }, { startsAt: { $lte: now } }] }, { $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }] }] }
  const coupon = await CouponModel.findOne(filter).session(session)
  if (!coupon) couponFailure('Coupon is invalid, inactive or expired', 'COUPON_INVALID')
  const currentCoupon = coupon as CouponDocument
  if (currentCoupon.usageLimit !== undefined) filter.usageCount = { $lt: currentCoupon.usageLimit }
  const reserved = await CouponModel.findOneAndUpdate(filter, { $inc: { usageCount: 1 } }, { new: true, session })
  if (!reserved) couponFailure('Coupon usage limit has been reached', 'COUPON_EXHAUSTED')
  const currentReserved = reserved as CouponDocument
  const pricing = calculateCouponDiscount(currentReserved, items, now)
  const redemptionFilter: Record<string, unknown> = { coupon: String(currentReserved._id), user: userId }
  if (currentReserved.perUserLimit !== undefined) redemptionFilter.$or = [{ usageCount: { $lt: currentReserved.perUserLimit } }, { usageCount: { $exists: false } }]
  try {
    await CouponRedemptionModel.findOneAndUpdate(redemptionFilter, { $inc: { usageCount: 1 }, $push: { orderIds: orderId } }, { new: true, upsert: true, setDefaultsOnInsert: true, session })
  } catch (error) {
    if ((error as { code?: number }).code === 11000) couponFailure('Coupon usage limit has been reached for this user', 'COUPON_USER_LIMIT')
    throw error
  }
  if (subtotal < (currentReserved.minimumOrderValue ?? 0)) couponFailure('Order does not meet the coupon minimum', 'COUPON_MINIMUM_NOT_MET')
  return { code: currentReserved.code, discountType: currentReserved.discountType, discountValue: currentReserved.discountValue, discountAmount: pricing.discountAmount }
}
