import { Schema, model } from 'mongoose'

const auditLogSchema = new Schema({ actor: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, action: { type: String, required: true, maxlength: 100 }, resourceType: { type: String, required: true, maxlength: 80 }, resourceId: { type: String, maxlength: 120 }, metadata: { type: Schema.Types.Mixed } }, { timestamps: true })
auditLogSchema.index({ createdAt: -1 })
export const AuditLogModel = model('AuditLog', auditLogSchema)