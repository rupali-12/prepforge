<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <router-link to="/" class="inline-block">
          <h1 class="text-4xl font-bold text-white tracking-tight">
            Prep<span class="text-blue-400">Forge</span>
          </h1>
          <p class="text-blue-300 text-sm mt-1">AI-Powered Interview Preparation</p>
        </router-link>
      </div>

      <!-- Card -->
      <div class="bg-white rounded-2xl shadow-2xl p-8">
        <slot />
      </div>
    </div>
  </div>
</template>