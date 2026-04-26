<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 flex items-center justify-center">
    <div class="text-center text-white">
      <h1 class="text-6xl font-bold mb-4">Prep<span class="text-blue-400">Forge</span></h1>
      <p class="text-blue-300 text-xl mb-8">AI-Powered Interview Preparation</p>
      <div class="flex gap-4 justify-center">
        <router-link to="/register"
          class="bg-blue-500 hover:bg-blue-400 text-white font-semibold px-8 py-3 rounded-lg transition">
          Get Started Free
        </router-link>
        <router-link to="/login"
          class="border border-blue-400 text-blue-300 hover:bg-blue-900 font-semibold px-8 py-3 rounded-lg transition">
          Sign In
        </router-link>
      </div>
    </div>
  </div>
</template>