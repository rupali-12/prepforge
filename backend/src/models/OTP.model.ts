import mongoose, { Document, Schema } from 'mongoose'

export interface IOTP extends Document {
  email: string
  otp: string
  type: 'email_verification' | 'password_reset'
  expiresAt: Date
  createdAt: Date
}

const OTPSchema = new Schema<IOTP>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    otp: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['email_verification', 'password_reset'],
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB auto-deletes expired OTPs
    },
  },
  { timestamps: true }
)

const OTP = mongoose.model<IOTP>('OTP', OTPSchema)
export default OTP