import { Schema, model, type InferSchemaType } from 'mongoose'

export const userRoles = ['student', 'admin'] as const
export type UserRole = typeof userRoles[number]
const userSchema = new Schema({ name: { type: String, required: true, trim: true, maxlength: 100 }, email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true }, passwordHash: { type: String, required: true, select: false }, googleSubject: { type: String, unique: true, sparse: true, index: true }, role: { type: String, enum: userRoles, default: 'student', index: true }, emailVerifiedAt: { type: Date }, verificationTokenHash: { type: String, select: false }, passwordResetTokenHash: { type: String, select: false }, passwordResetExpiresAt: { type: Date } }, { timestamps: true })
export type User = InferSchemaType<typeof userSchema>
export const UserModel = model('User', userSchema)