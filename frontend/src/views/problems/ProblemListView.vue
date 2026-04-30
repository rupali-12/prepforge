<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useProblemsStore } from '../../stores/problems.store'

const store = useProblemsStore()

onMounted(() => store.fetchProblems())

watch(
  () => store.filters,
  () => store.fetchProblems(1),
  { deep: true },
)

const logout = () => {
  authStore.logout()
  router.push({ name: 'login' })
}

const difficultyColor = (d: string) =>
  ({
    easy: 'text-green-600 bg-green-50',
    medium: 'text-yellow-600 bg-yellow-50',
    hard: 'text-red-600 bg-red-50',
  })[d] || ''
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Navbar -->
    <!-- <nav class="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <router-link to="/" class="text-xl font-bold text-blue-700">
        Prep<span class="text-gray-900">Forge</span>
      </router-link>
      <router-link to="/interview/setup" class="text-sm text-purple-400 hover:text-purple-300">
        🎤 Interview
      </router-link>
      <div class="flex items-center gap-4">
        <router-link to="/problems" class="text-sm font-medium text-blue-600">Problems</router-link>
        <router-link to="/dashboard" class="text-sm text-gray-600 hover:text-gray-900"
          >Dashboard</router-link
        >
      </div>
    </nav> -->

        <!-- Navbar — matches Problem Library -->
    <nav class="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <router-link to="/" class="text-xl font-bold text-blue-700">
        Prep<span class="text-gray-900">Forge</span>
      </router-link>
      <div class="flex items-center gap-6">
        <router-link to="/problems" class="text-sm text-gray-600 hover:text-gray-900 transition">
          Problems
        </router-link>
        <router-link to="/interview/setup" class="text-sm font-medium text-blue-600">
          Mock Interview
        </router-link>
        <router-link to="/dashboard" class="text-sm text-gray-600 hover:text-gray-900 transition">
          Dashboard
        </router-link>
        <button
          @click="logout"
          class="text-sm text-gray-400 hover:text-red-500 transition"
        >
          Logout
        </button>
      </div>
    </nav>

    <div class="max-w-5xl mx-auto px-6 py-8">
      <h1 class="text-2xl font-bold text-gray-900 mb-6">Problem Library</h1>

      <!-- Filters -->
      <div class="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-wrap gap-3">
        <!-- Search -->
        <input
          :value="store.filters.search"
          @input="store.setFilter('search', ($event.target as HTMLInputElement).value)"
          type="text"
          placeholder="Search problems..."
          class="flex-1 min-w-48 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <!-- Difficulty -->
        <select
          :value="store.filters.difficulty"
          @change="store.setFilter('difficulty', ($event.target as HTMLSelectElement).value)"
          class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>

        <!-- Tag -->
        <select
          :value="store.filters.tag"
          @change="store.setFilter('tag', ($event.target as HTMLSelectElement).value)"
          class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Topics</option>
          <option value="array">Array</option>
          <option value="string">String</option>
          <option value="linked-list">Linked List</option>
          <option value="stack">Stack</option>
          <option value="dynamic-programming">Dynamic Programming</option>
          <option value="graph">Graph</option>
          <option value="binary-search">Binary Search</option>
          <option value="hash-map">Hash Map</option>
        </select>

        <!-- Clear -->
        <button
          @click="store.clearFilters()"
          class="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 border border-gray-300 rounded-lg"
        >
          Clear
        </button>
      </div>

      <!-- Loading -->
      <div v-if="store.isLoading" class="space-y-3">
        <div
          v-for="i in 8"
          :key="i"
          class="bg-white rounded-xl border border-gray-200 p-4 animate-pulse"
        >
          <div class="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div class="h-3 bg-gray-100 rounded w-1/4"></div>
        </div>
      </div>

      <!-- Problem List -->
      <div v-else class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <!-- Header -->
        <div
          class="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase"
        >
          <div class="col-span-1">#</div>
          <div class="col-span-5">Title</div>
          <div class="col-span-2">Difficulty</div>
          <div class="col-span-3">Tags</div>
          <div class="col-span-1">Rate</div>
        </div>

        <!-- Rows -->
        <div v-if="store.problems.length === 0" class="px-6 py-12 text-center text-gray-400">
          No problems found. Try different filters.
        </div>

        <router-link
          v-for="(problem, index) in store.problems"
          :key="problem._id"
          :to="`/problems/${problem.slug}`"
          class="grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-100 hover:bg-blue-50 transition items-center cursor-pointer"
        >
          <div class="col-span-1 text-sm text-gray-400">{{ index + 1 }}</div>
          <div class="col-span-5">
            <span class="text-sm font-medium text-gray-900 hover:text-blue-600">{{
              problem.title
            }}</span>
          </div>
          <div class="col-span-2">
            <span
              :class="[
                'text-xs font-medium px-2.5 py-1 rounded-full capitalize',
                difficultyColor(problem.difficulty),
              ]"
            >
              {{ problem.difficulty }}
            </span>
          </div>
          <div class="col-span-3 flex flex-wrap gap-1">
            <span
              v-for="tag in problem.tags.slice(0, 2)"
              :key="tag"
              class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
            >
              {{ tag }}
            </span>
          </div>
          <div class="col-span-1 text-xs text-gray-500">{{ problem.acceptanceRate }}%</div>
        </router-link>
      </div>

      <!-- Pagination -->
      <div v-if="store.pagination.totalPages > 1" class="flex justify-center gap-2 mt-6">
        <button
          v-for="page in store.pagination.totalPages"
          :key="page"
          @click="store.fetchProblems(page)"
          :class="[
            'px-3 py-1.5 text-sm rounded-lg border transition',
            page === store.pagination.page
              ? 'bg-blue-600 text-white border-blue-600'
              : 'border-gray-300 text-gray-600 hover:bg-gray-50',
          ]"
        >
          {{ page }}
        </button>
      </div>
    </div>
  </div>
</template>
