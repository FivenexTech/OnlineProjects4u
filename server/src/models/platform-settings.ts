import { Schema, model, type InferSchemaType } from 'mongoose'

const platformSettingsSchema = new Schema({
  key: { type: String, default: 'default', unique: true },
  displayName: { type: String, default: 'OnlineProjects4U', maxlength: 120 },
  supportEmail: { type: String, default: '', maxlength: 254 },
  currency: { type: String, enum: ['INR'], default: 'INR' },
  maintenanceMode: { type: Boolean, default: false },
  announcement: { type: String, default: '', maxlength: 500 }
}, { timestamps: true })
export type PlatformSettings = InferSchemaType<typeof platformSettingsSchema>
export const PlatformSettingsModel = model('PlatformSettings', platformSettingsSchema)
