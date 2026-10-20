import { Schema, model, type InferSchemaType } from 'mongoose'

const couponRedemptionSchema = new Schema({
  coupon: { type: Schema.Types.ObjectId, ref: 'Coupon', required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  usageCount: { type: Number, min: 0, default: 0 },
  orderIds: { type: [Schema.Types.ObjectId], ref: 'Order', default: [] },
}, { timestamps: true })
couponRedemptionSchema.index({ coupon: 1, user: 1 }, { unique: true })
export type CouponRedemption = InferSchemaType<typeof couponRedemptionSchema>
export const CouponRedemptionModel = model('CouponRedemption', couponRedemptionSchema)
