import api from './api'
import type {
  RegisterPayload,
  LoginPayload,
  VerifyEmailPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
} from '../types/auth.types'

export const authService = {
  async register(payload: RegisterPayload) {
    const response = await api.post('/auth/register', payload)
    return response.data
  },

  async verifyEmail(payload: VerifyEmailPayload) {
    const response = await api.post('/auth/verify-email', payload)
    return response.data
  },

  async resendOTP(email: string) {
    const response = await api.post('/auth/resend-otp', { email })
    return response.data
  },

  async login(payload: LoginPayload) {
    const response = await api.post('/auth/login', payload)
    return response.data
  },

  async forgotPassword(payload: ForgotPasswordPayload) {
    const response = await api.post('/auth/forgot-password', payload)
    return response.data
  },

  async resetPassword(payload: ResetPasswordPayload) {
    const response = await api.post('/auth/reset-password', payload)
    return response.data
  },

  async getMe() {
    const response = await api.get('/auth/me')
    return response.data
  },

  async refreshToken(refreshToken: string) {
    const response = await api.post('/auth/refresh', { refreshToken })
    return response.data
  },
}