import { Schema, model, type InferSchemaType } from 'mongoose'

const paymentSchema = new Schema({ order: { type: Schema.Types.ObjectId, ref: 'Order', required: true, unique: true }, provider: { type: String, enum: ['razorpay'], required: true }, providerReference: { type: String, index: true }, amount: { type: Number, required: true, min: 0 }, currency: { type: String, default: 'INR' }, status: { type: String, enum: ['created', 'verified', 'failed', 'refunded'], default: 'created', index: true }, webhookEventIds: { type: [String], default: [] } }, { timestamps: true })
export type Payment = InferSchemaType<typeof paymentSchema>
export const PaymentModel = model('Payment', paymentSchema)