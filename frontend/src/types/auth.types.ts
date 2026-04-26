export interface User {
  id: string
  name: string
  email: string
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
    lastActiveDate: string | null
  }
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  success: boolean
  message: string
  data: {
    user: User
    accessToken: string
    refreshToken: string
  }
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface VerifyEmailPayload {
  email: string
  otp: string
}

export interface ForgotPasswordPayload {
  email: string
}

export interface ResetPasswordPayload {
  email: string
  otp: string
  newPassword: string
}

export interface ApiError {
  success: false
  message: string
}