<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.store'
import AuthLayout from '../../components/AuthLayout.vue'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({ email: '', password: '' })
const showPassword = ref(false)
const formError = ref('')

const handleLogin = async () => {
  if (!form.email || !form.password) {
    formError.value = 'Email and password are required'
    return
  }
  formError.value = ''
  try {
    const response = await authStore.login({
      email: form.email.toLowerCase(),
      password: form.password,
    })
    router.push({ name: 'dashboard' })
  } catch (err: any) {
    const data = err.response?.data
    // If unverified — redirect to verify page
    if (data?.data?.requiresVerification) {
      authStore.pendingVerificationEmail = form.email.toLowerCase()
      localStorage.setItem('pendingVerificationEmail', form.email.toLowerCase())
      router.push({ name: 'verify-email' })
      return
    }
    formError.value = data?.message || 'Login failed'
  }
}
</script>

<template>
  <AuthLayout>
    <h2 class="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
    <p class="text-gray-500 text-sm mb-6">Sign in to continue your prep</p>

    <!-- Error -->
    <div v-if="formError"
      class="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">
      {{ formError }}
    </div>

    <form @submit.prevent="handleLogin" class="space-y-4">
      <!-- Email -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
        <input
          v-model="form.email"
          type="email"
          placeholder="you@example.com"
          class="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
      </div>

      <!-- Password -->
      <div>
        <div class="flex justify-between items-center mb-1">
          <label class="block text-sm font-medium text-gray-700">Password</label>
          <router-link to="/forgot-password" class="text-xs text-blue-600 hover:underline">
            Forgot password?
          </router-link>
        </div>
        <div class="relative">
          <input
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Your password"
            class="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition pr-10"
          />
          <button type="button" @click="showPassword = !showPassword"
            class="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 text-xs">
            {{ showPassword ? 'Hide' : 'Show' }}
          </button>
        </div>
      </div>

      <!-- Submit -->
      <button
        type="submit"
        :disabled="authStore.isLoading"
        class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg py-2.5 text-sm transition mt-2">
        {{ authStore.isLoading ? 'Signing in...' : 'Sign In' }}
      </button>
    </form>

    <p class="text-center text-sm text-gray-500 mt-6">
      Don't have an account?
      <router-link to="/register" class="text-blue-600 font-medium hover:underline">Sign up free</router-link>
    </p>
  </AuthLayout>
</template>