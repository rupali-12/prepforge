import mongoose, { Document, Schema } from 'mongoose'

export interface ISubmission extends Document {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  problemId: mongoose.Types.ObjectId
  code: string
  language: string
  status: 'accepted' | 'wrong_answer' | 'runtime_error' | 'time_limit' | 'pending'
  testResults: {
    passed: boolean
    input: string
    expected: string
    output: string
    executionTime?: number
  }[]
  aiReview: {
    timeComplexity: string
    spaceComplexity: string
    score: number
    strengths: string[]
    improvements: string[]
    optimizedApproach: string
  } | null
  executionTime: number
  createdAt: Date
}

const SubmissionSchema = new Schema<ISubmission>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    problemId: {
      type: Schema.Types.ObjectId,
      ref: 'Problem',
      required: true,
    },
    code: { type: String, required: true },
    language: { type: String, required: true },
    status: {
      type: String,
      enum: ['accepted', 'wrong_answer', 'runtime_error', 'time_limit', 'pending'],
      default: 'pending',
    },
    testResults: [
      {
        passed: Boolean,
        input: String,
        expected: String,
        output: String,
        executionTime: Number,
      },
    ],
    aiReview: {
      type: {
        timeComplexity: String,
        spaceComplexity: String,
        score: Number,
        strengths: [String],
        improvements: [String],
        optimizedApproach: String,
      },
      default: null,
    },
    executionTime: { type: Number, default: 0 },
  },
  { timestamps: true }
)

const Submission = mongoose.model<ISubmission>('Submission', SubmissionSchema)
export default Submission