import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '../services/auth.service'
import type {
  User,
  RegisterPayload,
  LoginPayload,
  VerifyEmailPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
} from '../types/auth.types'

export const useAuthStore = defineStore('auth', () => {
  // ── State ──────────────────────────────────
  const user = ref<User | null>(null)
  const accessToken = ref<string | null>(localStorage.getItem('accessToken'))
  const refreshToken = ref<string | null>(localStorage.getItem('refreshToken'))
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const pendingVerificationEmail = ref<string | null>(
    localStorage.getItem('pendingVerificationEmail')
  )

  // ── Getters ────────────────────────────────
  const isAuthenticated = computed(() => !!accessToken.value && !!user.value)
  const isVerified = computed(() => user.value?.isEmailVerified ?? false)
  const isAdmin = computed(() => user.value?.role === 'admin')

  // ── Helpers ────────────────────────────────
  function setTokens(access: string, refresh: string) {
    accessToken.value = access
    refreshToken.value = refresh
    localStorage.setItem('accessToken', access)
    localStorage.setItem('refreshToken', refresh)
  }

  function clearAuth() {
    user.value = null
    accessToken.value = null
    refreshToken.value = null
    pendingVerificationEmail.value = null
    localStorage.clear()
  }

  function setError(message: string | null) {
    error.value = message
  }

  // ── Actions ────────────────────────────────
  async function register(payload: RegisterPayload) {
    isLoading.value = true
    error.value = null
    try {
      const response = await authService.register(payload)
      pendingVerificationEmail.value = payload.email
      localStorage.setItem('pendingVerificationEmail', payload.email)
      return response
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Registration failed'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function verifyEmail(payload: VerifyEmailPayload) {
    isLoading.value = true
    error.value = null
    try {
      const response = await authService.verifyEmail(payload)
      user.value = response.data.user
      setTokens(response.data.accessToken, response.data.refreshToken)
      pendingVerificationEmail.value = null
      localStorage.removeItem('pendingVerificationEmail')
      return response
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Verification failed'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function resendOTP(email: string) {
    isLoading.value = true
    error.value = null
    try {
      const response = await authService.resendOTP(email)
      return response
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to resend OTP'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function login(payload: LoginPayload) {
    isLoading.value = true
    error.value = null
    try {
      const response = await authService.login(payload)
      user.value = response.data.user
      setTokens(response.data.accessToken, response.data.refreshToken)
      return response
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Login failed'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function forgotPassword(payload: ForgotPasswordPayload) {
    isLoading.value = true
    error.value = null
    try {
      const response = await authService.forgotPassword(payload)
      return response
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to send reset email'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function resetPassword(payload: ResetPasswordPayload) {
    isLoading.value = true
    error.value = null
    try {
      const response = await authService.resetPassword(payload)
      return response
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Password reset failed'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchMe() {
    if (!accessToken.value) return
    try {
      const response = await authService.getMe()
      user.value = response.data.user
    } catch {
      clearAuth()
    }
  }

  function logout() {
    clearAuth()
  }

  return {
    // State
    user,
    accessToken,
    refreshToken,
    isLoading,
    error,
    pendingVerificationEmail,
    // Getters
    isAuthenticated,
    isVerified,
    isAdmin,
    // Actions
    register,
    verifyEmail,
    resendOTP,
    login,
    forgotPassword,
    resetPassword,
    fetchMe,
    logout,
    setError,
  }
})