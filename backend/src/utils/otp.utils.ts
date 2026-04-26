import OTP from '../models/OTP.model'

// Generate a random 6-digit OTP
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Save OTP to database (deletes any existing OTP for same email+type)
export const saveOTP = async (
  email: string,
  otp: string,
  type: 'email_verification' | 'password_reset'
): Promise<void> => {
  // Delete any existing OTP for this email and type
  await OTP.deleteMany({ email, type })

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

  await OTP.create({ email, otp, type, expiresAt })
}

// Verify OTP — returns true if valid, false if wrong/expired
export const verifyOTP = async (
  email: string,
  otp: string,
  type: 'email_verification' | 'password_reset'
): Promise<boolean> => {
  const record = await OTP.findOne({ email, type })

  if (!record) return false
  if (record.otp !== otp) return false
  if (record.expiresAt < new Date()) {
    await OTP.deleteOne({ _id: record._id })
    return false
  }

  // Valid — delete it so it can't be reused
  await OTP.deleteOne({ _id: record._id })
  return true
}