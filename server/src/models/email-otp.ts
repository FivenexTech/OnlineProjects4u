import { Schema, model } from 'mongoose'

const emailOtpSchema = new Schema({ user: { type: Schema.Types.ObjectId, ref: 'User', index: true }, email: { type: String, required: true, lowercase: true, trim: true, index: true }, purpose: { type: String, enum: ['email_verification', 'login'], required: true }, codeHash: { type: String, required: true, select: false }, expiresAt: { type: Date, required: true }, cooldownUntil: { type: Date, required: true }, attempts: { type: Number, default: 0 }, consumedAt: { type: Date } }, { timestamps: true })
emailOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
export const EmailOtpModel = model('EmailOtp', emailOtpSchema)