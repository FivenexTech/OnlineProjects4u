import { Schema, model, type InferSchemaType } from 'mongoose'

const orderSchema = new Schema({ user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, lineItems: [{ project: { type: Schema.Types.ObjectId, ref: 'Project', required: true }, titleSnapshot: { type: String, required: true }, unitPrice: { type: Number, required: true, min: 0 } }], amount: { type: Number, required: true, min: 0 }, currency: { type: String, default: 'INR' }, status: { type: String, enum: ['pending', 'paid', 'cancelled', 'refunded'], default: 'pending', index: true } }, { timestamps: true })
export type Order = InferSchemaType<typeof orderSchema>
export const OrderModel = model('Order', orderSchema)