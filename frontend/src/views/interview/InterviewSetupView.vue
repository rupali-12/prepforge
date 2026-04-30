<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProblemsStore } from '../../stores/problems.store'
import { useAuthStore } from '../../stores/auth.store'
import { interviewService } from '../../services/interview.service'

const router = useRouter()
const problemsStore = useProblemsStore()
const authStore = useAuthStore()

const selectedProblemId = ref('')
const selectedDuration = ref(30)
const selectedLanguage = ref('javascript')
const isStarting = ref(false)
const error = ref('')

const durations = [
  { value: 20, label: '20' },
  { value: 30, label: '30' },
  { value: 45, label: '45' },
]

const languages = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
]

onMounted(() => {
  problemsStore.fetchProblems()
})

const startInterview = async () => {
  if (!selectedProblemId.value) {
    error.value = 'Please select a problem'
    return
  }
  isStarting.value = true
  error.value = ''
  try {
    const response = await interviewService.startSession({
      problemId: selectedProblemId.value,
      duration: selectedDuration.value,
      language: selectedLanguage.value,
    })
    router.push({ name: 'interview', params: { sessionId: response.data.session.id } })
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } } }
    error.value = e.response?.data?.message ?? 'Failed to start interview'
  } finally {
    isStarting.value = false
  }
}

const logout = () => {
  authStore.logout()
  router.push({ name: 'login' })
}

const difficultyColor = (d: string) => ({
  easy: 'text-green-600 bg-green-50',
  medium: 'text-yellow-600 bg-yellow-50',
  hard: 'text-red-600 bg-red-50',
}[d] ?? '')
</script>

<template>
  <div class="min-h-screen bg-gray-50">

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

    <div class="max-w-4xl mx-auto px-6 py-10">

      <!-- Page header -->
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900 mb-1">Mock Interview</h1>
        <p class="text-gray-500 text-sm">
          Practice with an AI interviewer. Get real-time feedback on your approach and communication.
        </p>
      </div>

      <!-- Error -->
      <div
        v-if="error"
        class="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-6"
      >
        {{ error }}
      </div>

      <div class="grid grid-cols-3 gap-6">

        <!-- LEFT: Problem selection -->
        <div class="col-span-2">
          <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <!-- Header -->
            <div class="px-5 py-4 border-b border-gray-100">
              <h2 class="text-sm font-semibold text-gray-700">Select a Problem</h2>
            </div>

            <!-- Problem table header -->
            <div class="grid grid-cols-12 gap-4 px-5 py-2.5 bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-500 uppercase tracking-wide">
              <div class="col-span-1">#</div>
              <div class="col-span-6">Title</div>
              <div class="col-span-3">Difficulty</div>
              <div class="col-span-2">Rate</div>
            </div>

            <!-- Loading -->
            <div v-if="problemsStore.isLoading" class="px-5 py-8 text-center text-sm text-gray-400">
              Loading problems...
            </div>

            <!-- Problem rows -->
            <div
              v-for="(problem, index) in problemsStore.problems"
              :key="problem._id"
              @click="selectedProblemId = problem._id"
              :class="[
                'grid grid-cols-12 gap-4 px-5 py-3.5 border-b border-gray-50 cursor-pointer transition items-center',
                selectedProblemId === problem._id
                  ? 'bg-blue-50 border-l-2 border-l-blue-500'
                  : 'hover:bg-gray-50'
              ]"
            >
              <div class="col-span-1 text-sm text-gray-400">{{ index + 1 }}</div>
              <div class="col-span-6">
                <span :class="['text-sm font-medium', selectedProblemId === problem._id ? 'text-blue-700' : 'text-gray-900']">
                  {{ problem.title }}
                </span>
              </div>
              <div class="col-span-3">
                <span :class="['text-xs font-medium px-2.5 py-1 rounded-full capitalize', difficultyColor(problem.difficulty)]">
                  {{ problem.difficulty }}
                </span>
              </div>
              <div class="col-span-2 text-xs text-gray-400">{{ problem.acceptanceRate }}%</div>
            </div>
          </div>
        </div>

        <!-- RIGHT: Settings + Start -->
        <div class="col-span-1 space-y-4">

          <!-- Duration -->
          <div class="bg-white rounded-xl border border-gray-200 p-5">
            <h2 class="text-sm font-semibold text-gray-700 mb-4">Duration</h2>
            <div class="space-y-2">
              <label
                v-for="d in durations"
                :key="d.value"
                :class="[
                  'flex items-center justify-between px-4 py-3 rounded-lg border cursor-pointer transition',
                  selectedDuration === d.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                ]"
              >
                <input type="radio" :value="d.value" v-model="selectedDuration" class="hidden" />
                <span :class="['text-sm font-medium', selectedDuration === d.value ? 'text-blue-700' : 'text-gray-700']">
                  {{ d.label }} minutes
                </span>
                <span v-if="d.value === 30" class="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  Standard
                </span>
              </label>
            </div>
          </div>

          <!-- Language -->
          <div class="bg-white rounded-xl border border-gray-200 p-5">
            <h2 class="text-sm font-semibold text-gray-700 mb-4">Language</h2>
            <div class="space-y-2">
              <label
                v-for="lang in languages"
                :key="lang.value"
                :class="[
                  'flex items-center gap-3 px-4 py-2.5 rounded-lg border cursor-pointer transition',
                  selectedLanguage === lang.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                ]"
              >
                <input type="radio" :value="lang.value" v-model="selectedLanguage" class="accent-blue-600" />
                <span :class="['text-sm font-medium', selectedLanguage === lang.value ? 'text-blue-700' : 'text-gray-700']">
                  {{ lang.label }}
                </span>
              </label>
            </div>
          </div>

          <!-- Selected problem preview -->
          <div
            v-if="selectedProblemId"
            class="bg-blue-50 rounded-xl border border-blue-200 p-4"
          >
            <p class="text-xs text-blue-500 font-medium mb-1">Selected Problem</p>
            <p class="text-sm font-semibold text-blue-800">
              {{ problemsStore.problems.find(p => p._id === selectedProblemId)?.title }}
            </p>
            <p class="text-xs text-blue-600 capitalize mt-0.5">
              {{ problemsStore.problems.find(p => p._id === selectedProblemId)?.difficulty }}
              · {{ selectedDuration }} min · {{ selectedLanguage }}
            </p>
          </div>

          <!-- Start button -->
          <button
            @click="startInterview"
            :disabled="isStarting || !selectedProblemId"
            class="w-full py-3.5 rounded-xl font-semibold text-sm text-white transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style="background:#2563eb;"
          >
            <span v-if="isStarting" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            <span v-else>🎤</span>
            {{ isStarting ? 'Starting...' : 'Start Mock Interview' }}
          </button>

          <p class="text-xs text-gray-400 text-center leading-relaxed">
            The AI will act as your interviewer. Think out loud as you code.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>