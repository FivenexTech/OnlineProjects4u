import { Schema, model } from 'mongoose'
const sessionSchema = new Schema({ user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, tokenHash: { type: String, required: true, unique: true, select: false }, expiresAt: { type: Date, required: true, index: true }, revokedAt: { type: Date } }, { timestamps: true })
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
export const SessionModel = model('Session', sessionSchema)