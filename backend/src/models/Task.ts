import mongoose, { type InferSchemaType, type Model } from 'mongoose'

const taskSchema = new mongoose.Schema(
  {
    ownerUserId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true, ref: 'User' },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: false, trim: true, maxlength: 2000 },
    category: { type: String, required: true, trim: true, maxlength: 60 },
    frequencyUnit: {
      type: String,
      required: false,
      enum: ['weekly', 'monthly', 'yearly'],
    },
    frequencyInterval: { type: Number, required: false, min: 1, max: 3650 },
    active: { type: Boolean, required: true, default: true },
  },
  { timestamps: true },
)

export type TaskDoc = InferSchemaType<typeof taskSchema> & { _id: mongoose.Types.ObjectId }

export const Task: Model<TaskDoc> =
  (mongoose.models.Task as Model<TaskDoc> | undefined) ?? mongoose.model<TaskDoc>('Task', taskSchema)

