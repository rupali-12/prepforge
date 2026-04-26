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
      <p class="text-gray-500 mb-6">{{ authStore.user?.email }}</p>
      <router-link
        to="/problems"
        class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition mb-4">
        Start Solving Problems →
      </router-link>
      <br />
      <button @click="logout"
        class="text-sm text-gray-400 hover:text-red-500 transition mt-4">
        Logout
      </button>
    </div>
  </div>
</template>