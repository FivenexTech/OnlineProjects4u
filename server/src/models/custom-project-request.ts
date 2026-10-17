import { Schema, model, type InferSchemaType } from 'mongoose'

const customProjectRequestSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  problem: { type: String, required: true, maxlength: 5000 },
  features: { type: String, required: true, maxlength: 5000 },
  academicLevel: { type: String, required: true, maxlength: 80 },
  purpose: { type: String, required: true, maxlength: 160 },
  projectType: { type: String, required: true, maxlength: 80 },
  deadline: { type: Date },
  budget: { type: String, required: true, maxlength: 80 },
  stack: { frontend: String, backend: String, database: String, optional: [String], recommend: Boolean },
  proposal: { summary: String, modules: [String], reasoning: String, complexity: String, timeframe: String, priceRange: String, assumptions: [String] },
  status: { type: String, enum: ['submitted', 'under_review', 'clarification_needed', 'quoted', 'accepted', 'rejected'], default: 'submitted', index: true },
  adminNotes: { type: String, maxlength: 5000, select: false },
  quoteAmount: { type: Number, min: 0 },
}, { timestamps: true })

customProjectRequestSchema.index({ user: 1, createdAt: -1 })
export type CustomProjectRequest = InferSchemaType<typeof customProjectRequestSchema>
export const CustomProjectRequestModel = model('CustomProjectRequest', customProjectRequestSchema)