<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '../../stores/auth.store'
import AuthLayout from '../../components/AuthLayout.vue'

const authStore = useAuthStore()
const email = ref('')
const formError = ref('')
const submitted = ref(false)

const handleSubmit = async () => {
  if (!email.value) {
    formError.value = 'Email is required'
    return
  }
  const emailRegex = /^\S+@\S+\.\S+$/
  if (!emailRegex.test(email.value)) {
    formError.value = 'Please enter a valid email'
    return
  }
  formError.value = ''
  try {
    await authStore.forgotPassword({ email: email.value.toLowerCase() })
    submitted.value = true
  } catch {
    formError.value = authStore.error || 'Something went wrong'
  }
}
</script>

<template>
  <AuthLayout>
    <!-- After submit -->
    <div v-if="submitted" class="text-center">
      <div class="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <span class="text-2xl">✉️</span>
      </div>
      <h2 class="text-2xl font-bold text-gray-900 mb-2">Check your inbox</h2>
      <p class="text-gray-500 text-sm mb-6">
        If an account exists for <span class="font-medium text-gray-700">{{ email }}</span>,
        you'll receive a password reset OTP shortly.
      </p>
      <router-link to="/reset-password"
        class="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg py-2.5 text-sm text-center transition">
        Enter Reset OTP →
      </router-link>
      <p class="text-center text-sm text-gray-500 mt-4">
        <router-link to="/login" class="text-blue-600 hover:underline">← Back to login</router-link>
      </p>
    </div>

    <!-- Before submit -->
    <div v-else>
      <h2 class="text-2xl font-bold text-gray-900 mb-1">Forgot password?</h2>
      <p class="text-gray-500 text-sm mb-6">Enter your email and we'll send you a reset OTP</p>

      <div v-if="formError"
        class="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">
        {{ formError }}
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
          <input
            v-model="email"
            type="email"
            placeholder="you@example.com"
            class="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>
        <button
          type="submit"
          :disabled="authStore.isLoading"
          class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg py-2.5 text-sm transition">
          {{ authStore.isLoading ? 'Sending...' : 'Send Reset OTP' }}
        </button>
      </form>

      <p class="text-center text-sm text-gray-500 mt-6">
        <router-link to="/login" class="text-blue-600 hover:underline">← Back to login</router-link>
      </p>
    </div>
  </AuthLayout>
</template>