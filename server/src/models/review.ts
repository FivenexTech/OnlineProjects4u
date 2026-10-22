import { Schema, model, type InferSchemaType } from 'mongoose'

const reviewSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  text: { type: String, required: true, trim: true, maxlength: 2000 },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'hidden'], default: 'pending', index: true }
}, { timestamps: true })
reviewSchema.index({ user: 1, project: 1 }, { unique: true })
export type Review = InferSchemaType<typeof reviewSchema>
export const ReviewModel = model('Review', reviewSchema)
