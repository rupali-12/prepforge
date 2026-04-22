<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.store'
import AuthLayout from '../../components/AuthLayout.vue'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({ email: '', otp: '', newPassword: '', confirmPassword: '' })
const showPassword = ref(false)
const formError = ref('')
const success = ref(false)

const handleReset = async () => {
  if (!form.email || !form.otp || !form.newPassword || !form.confirmPassword) {
    formError.value = 'All fields are required'
    return
  }
  if (form.otp.length !== 6) {
    formError.value = 'OTP must be 6 digits'
    return
  }
  if (form.newPassword.length < 6) {
    formError.value = 'Password must be at least 6 characters'
    return
  }
  if (form.newPassword !== form.confirmPassword) {
    formError.value = 'Passwords do not match'
    return
  }
  formError.value = ''
  try {
    await authStore.resetPassword({
      email: form.email.toLowerCase(),
      otp: form.otp,
      newPassword: form.newPassword,
    })
    success.value = true
    setTimeout(() => router.push({ name: 'login' }), 3000)
  } catch {
    formError.value = authStore.error || 'Reset failed. Check your OTP.'
  }
}
</script>

<template>
  <AuthLayout>
    <!-- Success state -->
    <div v-if="success" class="text-center">
      <div class="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <span class="text-2xl">✅</span>
      </div>
      <h2 class="text-2xl font-bold text-gray-900 mb-2">Password reset!</h2>
      <p class="text-gray-500 text-sm">Redirecting you to login in 3 seconds...</p>
    </div>

    <!-- Form -->
    <div v-else>
      <h2 class="text-2xl font-bold text-gray-900 mb-1">Reset your password</h2>
      <p class="text-gray-500 text-sm mb-6">Enter the OTP from your email and your new password</p>

      <div v-if="formError"
        class="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">
        {{ formError }}
      </div>

      <form @submit.prevent="handleReset" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
          <input v-model="form.email" type="email" placeholder="you@example.com"
            class="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">OTP from Email</label>
          <input v-model="form.otp" type="text" maxlength="6" placeholder="6-digit OTP"
            class="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition tracking-widest text-center font-bold" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">New Password</label>
          <div class="relative">
            <input v-model="form.newPassword" :type="showPassword ? 'text' : 'password'" placeholder="Min 6 characters"
              class="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition pr-10" />
            <button type="button" @click="showPassword = !showPassword"
              class="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 text-xs">
              {{ showPassword ? 'Hide' : 'Show' }}
            </button>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
          <input v-model="form.confirmPassword" :type="showPassword ? 'text' : 'password'" placeholder="Repeat password"
            class="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
        </div>

        <button type="submit" :disabled="authStore.isLoading"
          class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg py-2.5 text-sm transition">
          {{ authStore.isLoading ? 'Resetting...' : 'Reset Password' }}
        </button>
      </form>

      <p class="text-center text-sm text-gray-500 mt-6">
        <router-link to="/login" class="text-blue-600 hover:underline">← Back to login</router-link>
      </p>
    </div>
  </AuthLayout>
</template>