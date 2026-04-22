<script setup lang="ts">
import { useAuthStore } from '../stores/auth.store'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const logout = () => {
  authStore.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center">
    <div class="text-center">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">
        Welcome, {{ authStore.user?.name }}! 👋
      </h1>
      <p class="text-gray-500 mb-2">{{ authStore.user?.email }}</p>
      <span class="inline-block bg-green-100 text-green-700 text-xs font-medium px-3 py-1 rounded-full mb-6">
        ✅ Email Verified
      </span>
      <p class="text-gray-400 text-sm mb-8">Dashboard coming in Phase 7</p>
      <button @click="logout"
        class="bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-2.5 rounded-lg transition text-sm">
        Logout
      </button>
    </div>
  </div>
</template>