import mongoose, { type InferSchemaType, type Model } from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true, minlength: 3, maxlength: 30, unique: true },
    passwordHash: { type: String, required: true },
    refreshTokenHash: { type: String, required: false },
  },
  { timestamps: true },
)

export type UserDoc = InferSchemaType<typeof userSchema> & { _id: mongoose.Types.ObjectId }

export const User: Model<UserDoc> =
  (mongoose.models.User as Model<UserDoc> | undefined) ?? mongoose.model<UserDoc>('User', userSchema)

