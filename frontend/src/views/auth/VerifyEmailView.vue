<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.store'
import AuthLayout from '../../components/AuthLayout.vue'

const router = useRouter()
const authStore = useAuthStore()

const otpDigits = ref(['', '', '', '', '', ''])
const inputRefs = ref<HTMLInputElement[]>([])
const formError = ref('')
const successMessage = ref('')
const resendTimer = ref(60)
let timerInterval: ReturnType<typeof setInterval>

const email = computed(() => authStore.pendingVerificationEmail || '')
const otp = computed(() => otpDigits.value.join(''))

// Redirect if no pending email
onMounted(() => {
  if (!email.value) {
    router.push({ name: 'register' })
    return
  }
  startResendTimer()
})

onUnmounted(() => clearInterval(timerInterval))

function startResendTimer() {
  resendTimer.value = 60
  clearInterval(timerInterval)
  timerInterval = setInterval(() => {
    resendTimer.value--
    if (resendTimer.value <= 0) clearInterval(timerInterval)
  }, 1000)
}

function handleInput(index: number, event: Event) {
  const input = event.target as HTMLInputElement
  const value = input.value.replace(/\D/g, '').slice(-1)
  otpDigits.value[index] = value
  if (value && index < 5) {
    inputRefs.value[index + 1]?.focus()
  }
}

function handleKeydown(index: number, event: KeyboardEvent) {
  if (event.key === 'Backspace' && !otpDigits.value[index] && index > 0) {
    inputRefs.value[index - 1]?.focus()
  }
}

function handlePaste(event: ClipboardEvent) {
  event.preventDefault()
  const pasted = event.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 6) || ''
  pasted.split('').forEach((char, i) => {
    if (i < 6) otpDigits.value[i] = char
  })
}

const handleVerify = async () => {
  if (otp.value.length !== 6) {
    formError.value = 'Please enter all 6 digits'
    return
  }
  formError.value = ''
  try {
    await authStore.verifyEmail({ email: email.value, otp: otp.value })
    router.push({ name: 'dashboard' })
  } catch {
    formError.value = authStore.error || 'Invalid or expired OTP'
    otpDigits.value = ['', '', '', '', '', '']
    inputRefs.value[0]?.focus()
  }
}

const handleResend = async () => {
  if (resendTimer.value > 0) return
  try {
    await authStore.resendOTP(email.value)
    successMessage.value = 'New OTP sent to your email!'
    otpDigits.value = ['', '', '', '', '', '']
    startResendTimer()
    setTimeout(() => (successMessage.value = ''), 4000)
  } catch {
    formError.value = authStore.error || 'Failed to resend OTP'
  }
}
</script>

<template>
  <AuthLayout>
    <div class="text-center mb-6">
      <div class="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <span class="text-2xl">📧</span>
      </div>
      <h2 class="text-2xl font-bold text-gray-900 mb-1">Check your email</h2>
      <p class="text-gray-500 text-sm">
        We sent a 6-digit OTP to<br />
        <span class="font-medium text-gray-700">{{ email }}</span>
      </p>
    </div>

    <!-- Error -->
    <div v-if="formError"
      class="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4 text-center">
      {{ formError }}
    </div>

    <!-- Success -->
    <div v-if="successMessage"
      class="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm mb-4 text-center">
      {{ successMessage }}
    </div>

    <!-- OTP Input -->
    <div class="flex gap-3 justify-center mb-6">
      <input
        v-for="(digit, index) in otpDigits"
        :key="index"
        :ref="(el) => { if (el) inputRefs[index] = el as HTMLInputElement }"
        :value="digit"
        @input="handleInput(index, $event)"
        @keydown="handleKeydown(index, $event)"
        @paste="handlePaste"
        type="text"
        maxlength="1"
        class="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition"
      />
    </div>

    <!-- Verify Button -->
    <button
      @click="handleVerify"
      :disabled="authStore.isLoading || otp.length !== 6"
      class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg py-2.5 text-sm transition">
      {{ authStore.isLoading ? 'Verifying...' : 'Verify Email' }}
    </button>

    <!-- Resend -->
    <p class="text-center text-sm text-gray-500 mt-4">
      Didn't receive it?
      <button
        @click="handleResend"
        :disabled="resendTimer > 0"
        class="text-blue-600 font-medium hover:underline disabled:text-gray-400 disabled:no-underline ml-1">
        {{ resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP' }}
      </button>
    </p>

    <p class="text-center text-sm text-gray-500 mt-2">
      <router-link to="/register" class="text-blue-600 hover:underline">← Back to register</router-link>
    </p>
  </AuthLayout>
</template>