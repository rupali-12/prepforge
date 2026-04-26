<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.store'
import AuthLayout from '../../components/AuthLayout.vue'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const showPassword = ref(false)
const formError = ref('')

const validateForm = () => {
  if (!form.name || !form.email || !form.password || !form.confirmPassword) {
    formError.value = 'All fields are required'
    return false
  }
  if (form.name.trim().length < 2) {
    formError.value = 'Name must be at least 2 characters'
    return false
  }
  const emailRegex = /^\S+@\S+\.\S+$/
  if (!emailRegex.test(form.email)) {
    formError.value = 'Please enter a valid email address'
    return false
  }
  if (form.password.length < 6) {
    formError.value = 'Password must be at least 6 characters'
    return false
  }
  if (form.password !== form.confirmPassword) {
    formError.value = 'Passwords do not match'
    return false
  }
  formError.value = ''
  return true
}

const handleRegister = async () => {
  if (!validateForm()) return
  try {
    await authStore.register({
      name: form.name.trim(),
      email: form.email.toLowerCase(),
      password: form.password,
    })
    router.push({ name: 'verify-email' })
  } catch (err: any) {
    formError.value = authStore.error || 'Registration failed'
  }
}
</script>

<template>
  <AuthLayout>
    <h2 class="text-2xl font-bold text-gray-900 mb-1">Create your account</h2>
    <p class="text-gray-500 text-sm mb-6">Start your interview prep journey today</p>

    <!-- Error -->
    <div v-if="formError || authStore.error"
      class="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">
      {{ formError || authStore.error }}
    </div>

    <form @submit.prevent="handleRegister" class="space-y-4">
      <!-- Name -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
        <input
          v-model="form.name"
          type="text"
          placeholder="John Doe"
          class="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
      </div>

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
        <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
        <div class="relative">
          <input
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Min 6 characters"
            class="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition pr-10"
          />
          <button type="button" @click="showPassword = !showPassword"
            class="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 text-xs">
            {{ showPassword ? 'Hide' : 'Show' }}
          </button>
        </div>
      </div>

      <!-- Confirm Password -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
        <input
          v-model="form.confirmPassword"
          :type="showPassword ? 'text' : 'password'"
          placeholder="Repeat your password"
          class="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
      </div>

      <!-- Submit -->
      <button
        type="submit"
        :disabled="authStore.isLoading"
        class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg py-2.5 text-sm transition mt-2">
        {{ authStore.isLoading ? 'Creating account...' : 'Create Account' }}
      </button>
    </form>

    <p class="text-center text-sm text-gray-500 mt-6">
      Already have an account?
      <router-link to="/login" class="text-blue-600 font-medium hover:underline">Sign in</router-link>
    </p>
  </AuthLayout>
</template>