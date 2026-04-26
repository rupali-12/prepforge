import mongoose, { Document, Schema } from 'mongoose'

export interface ISession extends Document {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  problemId: mongoose.Types.ObjectId
  status: 'active' | 'completed' | 'abandoned'
  duration: number
  language: string
  transcript: {
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
  }[]
  finalCode: string
  scores: {
    overall: number
    problemUnderstanding: number
    approachQuality: number
    codeQuality: number
    communication: number
  } | null
  aiSummary: string
  startedAt: Date
  completedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

const SessionSchema = new Schema<ISession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    problemId: { type: Schema.Types.ObjectId, ref: 'Problem', required: true },
    status: {
      type: String,
      enum: ['active', 'completed', 'abandoned'],
      default: 'active',
    },
    duration: { type: Number, default: 30 },
    language: { type: String, default: 'javascript' },
    transcript: [
      {
        role: { type: String, enum: ['user', 'assistant'] },
        content: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    finalCode: { type: String, default: '' },
    scores: {
      type: {
        overall: Number,
        problemUnderstanding: Number,
        approachQuality: Number,
        codeQuality: Number,
        communication: Number,
      },
      default: null,
    },
    aiSummary: { type: String, default: '' },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

const Session = mongoose.model<ISession>('Session', SessionSchema)
export default Session