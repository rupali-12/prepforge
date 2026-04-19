import { Request, Response } from 'express'
import User from '../models/User.model'
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.utils'
import { generateOTP, saveOTP, verifyOTP } from '../utils/otp.utils'
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/email.service'

// ─────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body

    // Validate fields
    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'All fields are required' })
      return
    }

    if (name.trim().length < 2) {
      res.status(400).json({ success: false, message: 'Name must be at least 2 characters' })
      return
    }

    const emailRegex = /^\S+@\S+\.\S+$/
    if (!emailRegex.test(email)) {
      res.status(400).json({ success: false, message: 'Please enter a valid email address' })
      return
    }

    if (password.length < 6) {
      res.status(400).json({ success: false, message: 'Password must be at least 6 characters' })
      return
    }

    // Check existing user
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      if (!existingUser.isEmailVerified) {
        // Resend OTP if user registered but never verified
        const otp = generateOTP()
        await saveOTP(email.toLowerCase(), otp, 'email_verification')
        await sendVerificationEmail(email, existingUser.name, otp)
        res.status(200).json({
          success: true,
          message: 'Account exists but is not verified. A new OTP has been sent to your email.',
          data: { email: email.toLowerCase(), requiresVerification: true },
        })
        return
      }
      res.status(409).json({ success: false, message: 'Email is already registered' })
      return
    }

    // Create user (unverified)
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      passwordHash: password,
      isEmailVerified: false,
    })

    // Generate and send OTP
    const otp = generateOTP()
    await saveOTP(email.toLowerCase(), otp, 'email_verification')
    await sendVerificationEmail(email, name.trim(), otp)

    res.status(201).json({
      success: true,
      message: 'Account created! Please check your email for the verification OTP.',
      data: {
        email: email.toLowerCase(),
        requiresVerification: true,
      },
    })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ success: false, message: 'Server error during registration' })
  }
}

// ─────────────────────────────────────────
// POST /api/auth/verify-email
// ─────────────────────────────────────────
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body

    if (!email || !otp) {
      res.status(400).json({ success: false, message: 'Email and OTP are required' })
      return
    }

    if (otp.length !== 6) {
      res.status(400).json({ success: false, message: 'OTP must be 6 digits' })
      return
    }

    const isValid = await verifyOTP(email.toLowerCase(), otp, 'email_verification')
    if (!isValid) {
      res.status(400).json({ success: false, message: 'Invalid or expired OTP' })
      return
    }

    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { isEmailVerified: true },
      { new: true }
    )

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' })
      return
    }

    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    }

    const accessToken = generateAccessToken(tokenPayload)
    const refreshToken = generateRefreshToken(tokenPayload)

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! Welcome to PrepForge.',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          profile: user.profile,
          stats: user.stats,
        },
        accessToken,
        refreshToken,
      },
    })
  } catch (error) {
    console.error('Verify email error:', error)
    res.status(500).json({ success: false, message: 'Server error during verification' })
  }
}

// ─────────────────────────────────────────
// POST /api/auth/resend-otp
// ─────────────────────────────────────────
export const resendOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body

    if (!email) {
      res.status(400).json({ success: false, message: 'Email is required' })
      return
    }

    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      res.status(404).json({ success: false, message: 'No account found with this email' })
      return
    }

    if (user.isEmailVerified) {
      res.status(400).json({ success: false, message: 'Email is already verified' })
      return
    }

    const otp = generateOTP()
    await saveOTP(email.toLowerCase(), otp, 'email_verification')
    await sendVerificationEmail(email, user.name, otp)

    res.status(200).json({
      success: true,
      message: 'A new OTP has been sent to your email',
    })
  } catch (error) {
    console.error('Resend OTP error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// ─────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required' })
      return
    }

    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password' })
      return
    }

    // Block unverified users from logging in
    if (!user.isEmailVerified) {
      res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in',
        data: { requiresVerification: true, email: user.email },
      })
      return
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid email or password' })
      return
    }

    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    }

    const accessToken = generateAccessToken(tokenPayload)
    const refreshToken = generateRefreshToken(tokenPayload)

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          profile: user.profile,
          stats: user.stats,
        },
        accessToken,
        refreshToken,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ success: false, message: 'Server error during login' })
  }
}

// ─────────────────────────────────────────
// POST /api/auth/forgot-password
// ─────────────────────────────────────────
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body

    if (!email) {
      res.status(400).json({ success: false, message: 'Email is required' })
      return
    }

    const user = await User.findOne({ email: email.toLowerCase() })

    // Always return success (don't reveal if email exists — security best practice)
    if (!user || !user.isEmailVerified) {
      res.status(200).json({
        success: true,
        message: 'If an account exists with this email, you will receive a reset OTP',
      })
      return
    }

    const otp = generateOTP()
    await saveOTP(email.toLowerCase(), otp, 'password_reset')
    await sendPasswordResetEmail(email, user.name, otp)

    res.status(200).json({
      success: true,
      message: 'Password reset OTP sent to your email',
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// ─────────────────────────────────────────
// POST /api/auth/reset-password
// ─────────────────────────────────────────
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp, newPassword } = req.body

    if (!email || !otp || !newPassword) {
      res.status(400).json({ success: false, message: 'Email, OTP and new password are required' })
      return
    }

    if (newPassword.length < 6) {
      res.status(400).json({ success: false, message: 'Password must be at least 6 characters' })
      return
    }

    const isValid = await verifyOTP(email.toLowerCase(), otp, 'password_reset')
    if (!isValid) {
      res.status(400).json({ success: false, message: 'Invalid or expired OTP' })
      return
    }

    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' })
      return
    }

    // Setting passwordHash triggers the pre-save hook to hash it
    user.passwordHash = newPassword
    await user.save()

    res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now log in.',
    })
  } catch (error) {
    console.error('Reset password error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// ─────────────────────────────────────────
// POST /api/auth/refresh
// ─────────────────────────────────────────
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      res.status(400).json({ success: false, message: 'Refresh token is required' })
      return
    }

    const decoded = verifyRefreshToken(refreshToken)
    const user = await User.findById(decoded.userId)

    if (!user) {
      res.status(401).json({ success: false, message: 'User not found' })
      return
    }

    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    }

    const newAccessToken = generateAccessToken(tokenPayload)
    const newRefreshToken = generateRefreshToken(tokenPayload)

    res.status(200).json({
      success: true,
      data: { accessToken: newAccessToken, refreshToken: newRefreshToken },
    })
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired refresh token' })
  }
}

// ─────────────────────────────────────────
// GET /api/auth/me
// ─────────────────────────────────────────
export const getMe = async (req: any, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user.userId).select('-passwordHash')
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' })
      return
    }
    res.status(200).json({ success: true, data: { user } })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}