<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.store'
import api from '../services/api'

const authStore = useAuthStore()
const router = useRouter()

interface Submission {
  _id: string
  status: string
  language: string
  createdAt: string
  problemId: { title: string; slug: string; difficulty: string }
}

interface Session {
  _id: string
  status: string
  createdAt: string
  scores: { overall: number } | null
  problemId: { title: string; difficulty: string }
}

const submissions = ref<Submission[]>([])
const sessions = ref<Session[]>([])
const isLoading = ref(true)

onMounted(async () => {
  try {
    const [subRes, sesRes] = await Promise.all([
      api.get('/submissions/me'),
      api.get('/sessions/me'),
    ])
    submissions.value = subRes.data.data.submissions.slice(0, 5)
    sessions.value = sesRes.data.data.sessions.slice(0, 3)
  } catch (e) {
    console.error('Dashboard load error:', e)
  } finally {
    isLoading.value = false
  }
})

const user = computed(() => authStore.user)
const stats = computed(() => user.value?.stats)

const acceptanceRate = computed(() => {
  const total = submissions.value.length
  if (!total) return 0
  const accepted = submissions.value.filter(s => s.status === 'accepted').length
  return Math.round((accepted / total) * 100)
})

const greetingText = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
})

const difficultyStats = computed(() => {
  const easy = submissions.value.filter(s => s.problemId?.difficulty === 'easy' && s.status === 'accepted').length
  const medium = submissions.value.filter(s => s.problemId?.difficulty === 'medium' && s.status === 'accepted').length
  const hard = submissions.value.filter(s => s.problemId?.difficulty === 'hard' && s.status === 'accepted').length
  return { easy, medium, hard }
})

const statusConfig = (status: string) => {
  if (status === 'accepted') return { label: 'Accepted', class: 'text-green-600 bg-green-50' }
  if (status === 'wrong_answer') return { label: 'Wrong Answer', class: 'text-red-600 bg-red-50' }
  return { label: 'Failed', class: 'text-gray-600 bg-gray-100' }
}

const difficultyConfig = (d: string) => {
  if (d === 'easy') return 'text-green-600 bg-green-50'
  if (d === 'medium') return 'text-yellow-600 bg-yellow-50'
  return 'text-red-600 bg-red-50'
}

const scoreColor = (score: number) => {
  if (score >= 80) return 'text-green-500'
  if (score >= 60) return 'text-yellow-500'
  return 'text-red-500'
}

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const logout = () => {
  authStore.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">

    <!-- Navbar -->
    <nav class="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
      <div class="flex items-center gap-8">
        <router-link to="/" class="text-xl font-bold text-blue-700">
          Prep<span class="text-gray-900">Forge</span>
        </router-link>
        <div class="flex items-center gap-6">
          <router-link to="/problems" class="text-sm text-gray-600 hover:text-gray-900 transition font-medium">
            Problems
          </router-link>
          <router-link to="/interview/setup" class="text-sm text-gray-600 hover:text-gray-900 transition font-medium">
            Mock Interview
          </router-link>
          <router-link to="/dashboard" class="text-sm text-blue-600 font-medium">
            Dashboard
          </router-link>
        </div>
      </div>
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {{ user?.name?.charAt(0).toUpperCase() }}
          </div>
          <span class="text-sm text-gray-700 font-medium">{{ user?.name }}</span>
        </div>
        <button @click="logout" class="text-sm text-gray-400 hover:text-red-500 transition">
          Logout
        </button>
      </div>
    </nav>

    <div class="max-w-6xl mx-auto px-6 py-8">

      <!-- Greeting -->
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900">
          {{ greetingText }}, {{ user?.name?.split(' ')[0] }}! 👋
        </h1>
        <p class="text-gray-500 text-sm mt-1">
          Track your progress, practice problems, and ace your next interview.
        </p>
      </div>

      <!-- ── Stats Cards ──────────────────────────── -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">

        <div class="bg-white rounded-2xl border border-gray-200 p-5">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-medium text-gray-500 uppercase tracking-wide">Problems Solved</span>
            <span class="text-2xl">✅</span>
          </div>
          <p class="text-3xl font-bold text-gray-900">{{ stats?.problemsSolved ?? 0 }}</p>
          <p class="text-xs text-gray-400 mt-1">out of 10 available</p>
        </div>

        <div class="bg-white rounded-2xl border border-gray-200 p-5">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-medium text-gray-500 uppercase tracking-wide">Mock Interviews</span>
            <span class="text-2xl">🎤</span>
          </div>
          <p class="text-3xl font-bold text-gray-900">{{ stats?.mockInterviews ?? 0 }}</p>
          <p class="text-xs text-gray-400 mt-1">sessions completed</p>
        </div>

        <div class="bg-white rounded-2xl border border-gray-200 p-5">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-medium text-gray-500 uppercase tracking-wide">Acceptance Rate</span>
            <span class="text-2xl">📈</span>
          </div>
          <p class="text-3xl font-bold text-gray-900">{{ acceptanceRate }}%</p>
          <p class="text-xs text-gray-400 mt-1">from recent submissions</p>
        </div>

        <div class="bg-white rounded-2xl border border-gray-200 p-5">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-medium text-gray-500 uppercase tracking-wide">Current Streak</span>
            <span class="text-2xl">🔥</span>
          </div>
          <p class="text-3xl font-bold text-gray-900">{{ stats?.streak ?? 0 }}</p>
          <p class="text-xs text-gray-400 mt-1">days in a row</p>
        </div>
      </div>

      <!-- ── Main content grid ───────────────────── -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <!-- LEFT column (2/3) -->
        <div class="lg:col-span-2 space-y-6">

          <!-- Recent Submissions -->
          <div class="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 class="text-sm font-semibold text-gray-900">Recent Submissions</h2>
              <router-link to="/problems" class="text-xs text-blue-600 hover:underline">
                View all problems →
              </router-link>
            </div>

            <!-- Loading -->
            <div v-if="isLoading" class="p-6 space-y-3">
              <div v-for="i in 3" :key="i" class="animate-pulse flex gap-4 items-center">
                <div class="h-4 bg-gray-100 rounded w-1/3"></div>
                <div class="h-4 bg-gray-100 rounded w-1/4"></div>
                <div class="h-4 bg-gray-100 rounded w-1/5"></div>
              </div>
            </div>

            <!-- Empty -->
            <div v-else-if="submissions.length === 0" class="px-6 py-12 text-center">
              <div class="text-4xl mb-3">📝</div>
              <p class="text-gray-500 text-sm mb-4">No submissions yet</p>
              <router-link
                to="/problems"
                class="inline-block bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition"
              >
                Start Solving
              </router-link>
            </div>

            <!-- List -->
            <div v-else>
              <div
                v-for="sub in submissions"
                :key="sub._id"
                class="flex items-center gap-4 px-6 py-4 border-b border-gray-50 hover:bg-gray-50 transition last:border-0"
              >
                <!-- Status icon -->
                <div :class="['w-2 h-2 rounded-full flex-shrink-0', sub.status === 'accepted' ? 'bg-green-500' : 'bg-red-400']"></div>

                <!-- Problem name -->
                <div class="flex-1 min-w-0">
                  <router-link
                    :to="`/problems/${sub.problemId?.slug}`"
                    class="text-sm font-medium text-gray-900 hover:text-blue-600 truncate block"
                  >
                    {{ sub.problemId?.title ?? 'Unknown Problem' }}
                  </router-link>
                  <p class="text-xs text-gray-400 mt-0.5">{{ formatDate(sub.createdAt) }}</p>
                </div>

                <!-- Difficulty -->
                <span
                  v-if="sub.problemId?.difficulty"
                  :class="['text-xs px-2 py-0.5 rounded-full capitalize font-medium', difficultyConfig(sub.problemId.difficulty)]"
                >
                  {{ sub.problemId.difficulty }}
                </span>

                <!-- Status badge -->
                <span :class="['text-xs px-2.5 py-1 rounded-full font-medium', statusConfig(sub.status).class]">
                  {{ statusConfig(sub.status).label }}
                </span>

                <!-- Language -->
                <span class="text-xs text-gray-400 font-mono">{{ sub.language }}</span>
              </div>
            </div>
          </div>

          <!-- Recent Interviews -->
          <div class="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 class="text-sm font-semibold text-gray-900">Recent Mock Interviews</h2>
              <router-link to="/interview/setup" class="text-xs text-purple-600 hover:underline">
                Start new →
              </router-link>
            </div>

            <div v-if="isLoading" class="p-6 space-y-3">
              <div v-for="i in 2" :key="i" class="animate-pulse flex gap-4 items-center">
                <div class="h-4 bg-gray-100 rounded w-1/3"></div>
                <div class="h-4 bg-gray-100 rounded w-1/4"></div>
              </div>
            </div>

            <div v-else-if="sessions.length === 0" class="px-6 py-12 text-center">
              <div class="text-4xl mb-3">🎤</div>
              <p class="text-gray-500 text-sm mb-4">No mock interviews yet</p>
              <router-link
                to="/interview/setup"
                class="inline-block text-white text-sm font-medium px-5 py-2 rounded-lg transition"
                style="background:linear-gradient(135deg,#1d4ed8,#7c3aed);"
              >
                Start Interview
              </router-link>
            </div>

            <div v-else>
              <div
                v-for="session in sessions"
                :key="session._id"
                class="flex items-center gap-4 px-6 py-4 border-b border-gray-50 hover:bg-gray-50 transition last:border-0"
              >
                <!-- Icon -->
                <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style="background:linear-gradient(135deg,#1d4ed8,#7c3aed);">
                  <span class="text-sm">🎤</span>
                </div>

                <!-- Info -->
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 truncate">
                    {{ session.problemId?.title ?? 'Interview Session' }}
                  </p>
                  <p class="text-xs text-gray-400 mt-0.5">{{ formatDate(session.createdAt) }}</p>
                </div>

                <!-- Score -->
                <div v-if="session.scores?.overall" class="text-right">
                  <p :class="['text-lg font-bold', scoreColor(session.scores.overall)]">
                    {{ session.scores.overall }}
                  </p>
                  <p class="text-xs text-gray-400">score</p>
                </div>

                <!-- Status -->
                <span :class="['text-xs px-2.5 py-1 rounded-full font-medium capitalize',
                  session.status === 'completed' ? 'bg-green-50 text-green-600' :
                  session.status === 'active' ? 'bg-blue-50 text-blue-600' :
                  'bg-gray-100 text-gray-500']">
                  {{ session.status }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT column (1/3) -->
        <div class="space-y-6">

          <!-- Quick Actions -->
          <div class="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 class="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div class="space-y-3">
              <router-link
                to="/problems"
                class="flex items-center gap-3 p-3 rounded-xl border border-blue-100 bg-blue-50 hover:bg-blue-100 transition group"
              >
                <div class="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white text-sm flex-shrink-0">
                  💻
                </div>
                <div>
                  <p class="text-sm font-medium text-blue-900">Solve Problems</p>
                  <p class="text-xs text-blue-600">10 problems available</p>
                </div>
                <span class="ml-auto text-blue-400 group-hover:translate-x-1 transition-transform">→</span>
              </router-link>

              <router-link
                to="/interview/setup"
                class="flex items-center gap-3 p-3 rounded-xl border border-purple-100 bg-purple-50 hover:bg-purple-100 transition group"
              >
                <div class="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm flex-shrink-0"
                  style="background:linear-gradient(135deg,#1d4ed8,#7c3aed);">
                  🎤
                </div>
                <div>
                  <p class="text-sm font-medium text-purple-900">Mock Interview</p>
                  <p class="text-xs text-purple-600">Practice with AI interviewer</p>
                </div>
                <span class="ml-auto text-purple-400 group-hover:translate-x-1 transition-transform">→</span>
              </router-link>
            </div>
          </div>

          <!-- Difficulty Breakdown -->
          <div class="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 class="text-sm font-semibold text-gray-900 mb-5">Problems by Difficulty</h2>
            <div class="space-y-4">

              <div>
                <div class="flex justify-between text-xs mb-1.5">
                  <span class="text-green-600 font-medium">Easy</span>
                  <span class="text-gray-500">{{ difficultyStats.easy }} solved</span>
                </div>
                <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-green-500 rounded-full transition-all duration-500"
                    :style="{ width: Math.min(difficultyStats.easy * 20, 100) + '%' }"
                  ></div>
                </div>
              </div>

              <div>
                <div class="flex justify-between text-xs mb-1.5">
                  <span class="text-yellow-600 font-medium">Medium</span>
                  <span class="text-gray-500">{{ difficultyStats.medium }} solved</span>
                </div>
                <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-yellow-500 rounded-full transition-all duration-500"
                    :style="{ width: Math.min(difficultyStats.medium * 25, 100) + '%' }"
                  ></div>
                </div>
              </div>

              <div>
                <div class="flex justify-between text-xs mb-1.5">
                  <span class="text-red-600 font-medium">Hard</span>
                  <span class="text-gray-500">{{ difficultyStats.hard }} solved</span>
                </div>
                <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-red-500 rounded-full transition-all duration-500"
                    :style="{ width: Math.min(difficultyStats.hard * 33, 100) + '%' }"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Profile card -->
          <div class="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 class="text-sm font-semibold text-gray-900 mb-4">Your Profile</h2>
            <div class="flex items-center gap-3 mb-4">
              <div class="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white text-lg font-bold">
                {{ user?.name?.charAt(0).toUpperCase() }}
              </div>
              <div>
                <p class="text-sm font-semibold text-gray-900">{{ user?.name }}</p>
                <p class="text-xs text-gray-500">{{ user?.email }}</p>
              </div>
            </div>
            <div class="space-y-2 text-xs text-gray-500">
              <div class="flex justify-between">
                <span>Experience Level</span>
                <span class="font-medium text-gray-700 capitalize">
                  {{ user?.profile?.experienceLevel ?? 'entry' }}
                </span>
              </div>
              <div class="flex justify-between">
                <span>Preferred Language</span>
                <span class="font-medium text-gray-700 capitalize">
                  {{ user?.profile?.preferredLanguage ?? 'javascript' }}
                </span>
              </div>
              <div class="flex justify-between">
                <span>Member since</span>
                <span class="font-medium text-gray-700">
                  {{ user?.createdAt ? formatDate(user.createdAt) : 'Recently' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Motivational tip -->
          <div
            class="rounded-2xl p-5 text-white"
            style="background:linear-gradient(135deg,#1e3a5f,#1d4ed8);"
          >
            <p class="text-xs font-semibold text-blue-300 mb-2">💡 Daily Tip</p>
            <p class="text-sm leading-relaxed">
              Practice explaining your approach out loud before coding. Communication is 25% of your interview score.
            </p>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>