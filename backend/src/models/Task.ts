import mongoose, { type InferSchemaType, type Model } from 'mongoose'

const taskSchema = new mongoose.Schema(
  {
    ownerUserId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true, ref: 'User' },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: false, trim: true, maxlength: 2000 },
    category: { type: String, required: true, trim: true, maxlength: 60 },
    frequencyUnit: {
      type: String,
      required: true,
      enum: ['weekly', 'monthly', 'yearly'],
      default: 'monthly',
    },
    frequencyInterval: { type: Number, required: true, default: 1, min: 1, max: 3650 },
    startDate: { type: Date, required: true, default: Date.now },
    nextDueDate: { type: Date, required: true, index: true },
    lastCompletedAt: { type: Date, required: false },
    active: { type: Boolean, required: true, default: true },
  },
  { timestamps: true },
)

taskSchema.index({ ownerUserId: 1, nextDueDate: 1 })
taskSchema.index({ ownerUserId: 1, active: 1, category: 1, nextDueDate: 1 })

export type TaskDoc = InferSchemaType<typeof taskSchema> & { _id: mongoose.Types.ObjectId }

export const Task: Model<TaskDoc> =
  (mongoose.models.Task as Model<TaskDoc> | undefined) ?? mongoose.model<TaskDoc>('Task', taskSchema)

