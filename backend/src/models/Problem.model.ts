import mongoose, { Document, Schema } from 'mongoose'

export interface IProblem extends Document {
  _id: mongoose.Types.ObjectId
  title: string
  slug: string
  difficulty: 'easy' | 'medium' | 'hard'
  description: string
  examples: {
    input: string
    output: string
    explanation?: string
  }[]
  constraints: string[]
  hints: {
    level: number
    content: string
  }[]
  solution: {
    code: string
    explanation: string
    timeComplexity: string
    spaceComplexity: string
  }
  tags: string[]
  companies: string[]
  testCases: {
    input: string
    expected: string
    isHidden: boolean
  }[]
  acceptanceRate: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const ProblemSchema = new Schema<IProblem>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      required: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    examples: [
      {
        input: String,
        output: String,
        explanation: String,
      },
    ],
    constraints: [String],
    hints: [
      {
        level: { type: Number, enum: [1, 2, 3] },
        content: String,
      },
    ],
    solution: {
      code: String,
      explanation: String,
      timeComplexity: String,
      spaceComplexity: String,
    },
    tags: [String],
    companies: [String],
    testCases: [
      {
        input: String,
        expected: String,
        isHidden: { type: Boolean, default: false },
      },
    ],
    acceptanceRate: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

// Auto-generate slug from title
ProblemSchema.pre('save', function(this: IProblem) {
  if (this.isModified('title') || !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, '')
      .replace(/\s+/g, '-')
  }
})

const Problem = mongoose.model<IProblem>('Problem', ProblemSchema)
export default Problem