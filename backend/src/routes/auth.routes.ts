import { Router } from 'express'
import {
  register,
  verifyEmail,
  resendOTP,
  login,
  forgotPassword,
  resetPassword,
  refreshToken,
  getMe,
} from '../controllers/auth.controller'
import { protect } from '../middlewares/auth.middleware'

const router = Router()

router.post('/register', register)
router.post('/verify-email', verifyEmail)
router.post('/resend-otp', resendOTP)
router.post('/login', login)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)
router.post('/refresh', refreshToken)
router.get('/me', protect, getMe)

export default router