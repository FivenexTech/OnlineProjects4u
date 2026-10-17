import { Schema, model, type InferSchemaType } from 'mongoose'

const supportTicketSchema = new Schema({ user: { type: Schema.Types.ObjectId, ref: 'User' }, subject: { type: String, required: true, trim: true, maxlength: 160 }, message: { type: String, required: true, maxlength: 5000 }, status: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open', index: true } }, { timestamps: true })
export type SupportTicket = InferSchemaType<typeof supportTicketSchema>
export const SupportTicketModel = model('SupportTicket', supportTicketSchema)