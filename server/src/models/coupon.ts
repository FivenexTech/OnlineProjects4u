import { Schema, model, type InferSchemaType } from 'mongoose'

export const couponDiscountTypes = ['percentage', 'fixed'] as const
const couponSchema = new Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true, minlength: 3, maxlength: 40, index: true },
  discountType: { type: String, enum: couponDiscountTypes, required: true },
  discountValue: { type: Number, required: true, min: 0 },
  currency: { type: String, enum: ['INR'], default: 'INR' },
  startsAt: { type: Date },
  expiresAt: { type: Date },
  usageLimit: { type: Number, min: 1 },
  perUserLimit: { type: Number, min: 1 },
  usageCount: { type: Number, min: 0, default: 0 },
  minimumOrderValue: { type: Number, min: 0, default: 0 },
  projectIds: { type: [Schema.Types.ObjectId], ref: 'Project', default: [] },
  categories: { type: [String], default: [] },
  active: { type: Boolean, default: true, index: true },
}, { timestamps: true })
couponSchema.index({ code: 1 }, { unique: true })
export type Coupon = InferSchemaType<typeof couponSchema>
export const CouponModel = model('Coupon', couponSchema)
