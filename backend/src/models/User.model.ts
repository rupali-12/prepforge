import mongoose, { Document, Schema } from 'mongoose'
import bcrypt from 'bcrypt'

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  email: string
  passwordHash: string
  role: 'user' | 'admin'
  isEmailVerified: boolean
  profile: {
    experienceLevel: 'entry' | 'mid' | 'senior'
    targetCompanies: string[]
    preferredLanguage: string
  }
  stats: {
    problemsSolved: number
    mockInterviews: number
    streak: number
    lastActiveDate: Date | null
  }
  createdAt: Date
  updatedAt: Date
  comparePassword(password: string): Promise<boolean>
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    profile: {
      experienceLevel: {
        type: String,
        enum: ['entry', 'mid', 'senior'],
        default: 'entry',
      },
      targetCompanies: {
        type: [String],
        default: [],
      },
      preferredLanguage: {
        type: String,
        default: 'javascript',
      },
    },
    stats: {
      problemsSolved: { type: Number, default: 0 },
      mockInterviews: { type: Number, default: 0 },
      streak: { type: Number, default: 0 },
      lastActiveDate: { type: Date, default: null },
    },
  },
  { timestamps: true }
)

// Hash password before saving
UserSchema.pre('save', async function (this: IUser) {
  if (!this.isModified('passwordHash')) return

  const salt = await bcrypt.genSalt(12)
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt)
})

// Compare password on login
UserSchema.methods.comparePassword = async function (
  password: string
): Promise<boolean> {
  return bcrypt.compare(password, this.passwordHash)
}

const User = mongoose.model<IUser>('User', UserSchema)
export default User