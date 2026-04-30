<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProblemsStore } from '../../stores/problems.store'
import { interviewService } from '../../services/interview.service'
import { useAuthStore } from '../../stores/auth.store'

const router = useRouter()
const problemsStore = useProblemsStore()
const authStore = useAuthStore()

const selectedProblemId = ref('')
const selectedDuration = ref(30)
const selectedLanguage = ref('javascript')
const isStarting = ref(false)
const error = ref('')

const durations = [
  { value: 20, label: '20 minutes (Quick)' },
  { value: 30, label: '30 minutes (Standard)' },
  { value: 45, label: '45 minutes (Full)' },
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

    router.push({
      name: 'interview',
      params: { sessionId: response.data.session.id },
    })
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } } }
    error.value = e.response?.data?.message ?? 'Failed to start interview'
  } finally {
    isStarting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-950 flex items-center justify-center p-4">
    <div class="w-full max-w-2xl">
      <!-- Header -->
      <div class="text-center mb-10">
        <div class="text-5xl mb-4">🎤</div>
        <h1 class="text-3xl font-bold text-white mb-2">Mock Interview</h1>
        <p class="text-gray-400">Practice with an AI interviewer. Get real-time feedback on your approach and communication.</p>
      </div>

      <!-- Setup card -->
      <div class="bg-gray-900 rounded-2xl border border-gray-800 p-8 space-y-6">

        <!-- Error -->
        <div v-if="error" class="bg-red-900/30 border border-red-700 text-red-400 rounded-lg px-4 py-3 text-sm">
          {{ error }}
        </div>

        <!-- Problem selection -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-3">
            Select Problem
          </label>
          <div class="space-y-2 max-h-64 overflow-y-auto">
            <div
              v-if="problemsStore.isLoading"
              class="text-center py-8 text-gray-500 text-sm"
            >
              Loading problems...
            </div>
            <label
              v-for="problem in problemsStore.problems"
              :key="problem._id"
              :class="[
                'flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition',
                selectedProblemId === problem._id
                  ? 'border-blue-500 bg-blue-900/20'
                  : 'border-gray-700 hover:border-gray-600 bg-gray-800/50',
              ]"
            >
              <input
                type="radio"
                :value="problem._id"
                v-model="selectedProblemId"
                class="accent-blue-500"
              />
              <div class="flex-1">
                <span class="text-white text-sm font-medium">{{ problem.title }}</span>
              </div>
              <span
                :class="[
                  'text-xs font-medium px-2 py-0.5 rounded-full capitalize',
                  problem.difficulty === 'easy' ? 'bg-green-900/50 text-green-400' :
                  problem.difficulty === 'medium' ? 'bg-yellow-900/50 text-yellow-400' :
                  'bg-red-900/50 text-red-400',
                ]"
              >
                {{ problem.difficulty }}
              </span>
            </label>
          </div>
        </div>

        <!-- Duration -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-3">Duration</label>
          <div class="grid grid-cols-3 gap-3">
            <label
              v-for="d in durations"
              :key="d.value"
              :class="[
                'flex flex-col items-center p-3 rounded-xl border cursor-pointer transition text-center',
                selectedDuration === d.value
                  ? 'border-blue-500 bg-blue-900/20'
                  : 'border-gray-700 hover:border-gray-600 bg-gray-800/50',
              ]"
            >
              <input type="radio" :value="d.value" v-model="selectedDuration" class="hidden" />
              <span class="text-2xl font-bold text-white">{{ d.value }}</span>
              <span class="text-xs text-gray-400 mt-1">minutes</span>
            </label>
          </div>
        </div>

        <!-- Language -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-3">Language</label>
          <div class="grid grid-cols-4 gap-3">
            <label
              v-for="lang in languages"
              :key="lang.value"
              :class="[
                'flex items-center justify-center p-3 rounded-xl border cursor-pointer transition text-sm font-medium',
                selectedLanguage === lang.value
                  ? 'border-blue-500 bg-blue-900/20 text-blue-300'
                  : 'border-gray-700 hover:border-gray-600 bg-gray-800/50 text-gray-400',
              ]"
            >
              <input type="radio" :value="lang.value" v-model="selectedLanguage" class="hidden" />
              {{ lang.label }}
            </label>
          </div>
        </div>

        <!-- Start button -->
        <button
          @click="startInterview"
          :disabled="isStarting || !selectedProblemId"
          class="w-full py-4 rounded-xl font-semibold text-white transition flex items-center justify-center gap-3 disabled:opacity-50"
          style="background: linear-gradient(135deg, #1d4ed8, #7c3aed);"
        >
          <span v-if="isStarting" class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          <span v-else class="text-xl">🎤</span>
          {{ isStarting ? 'Starting interview...' : 'Start Mock Interview' }}
        </button>

        <p class="text-center text-xs text-gray-600">
          The AI will act as your interviewer. Explain your thinking out loud as you code.
        </p>
      </div>

      <div class="text-center mt-6">
        <router-link to="/problems" class="text-sm text-gray-500 hover:text-gray-300 transition">
          ← Back to Problems
        </router-link>
      </div>
    </div>
  </div>
</template>