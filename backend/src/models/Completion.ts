import mongoose, { type InferSchemaType, type Model } from 'mongoose'

const completionSchema = new mongoose.Schema(
  {
    taskId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true, ref: 'Task' },
    completedAt: { type: Date, required: true, default: Date.now, index: true },
    note: { type: String, required: false, trim: true, maxlength: 4000 },
    cost: { type: Number, required: false, min: 0 },
  },
  { timestamps: true },
)

export type CompletionDoc = InferSchemaType<typeof completionSchema> & { _id: mongoose.Types.ObjectId }

export const Completion: Model<CompletionDoc> =
  (mongoose.models.Completion as Model<CompletionDoc> | undefined) ??
  mongoose.model<CompletionDoc>('Completion', completionSchema)

