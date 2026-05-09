<script setup lang="ts">
import { ref, onMounted, nextTick, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { VueMonacoEditor } from '@guolao/vue-monaco-editor'
import { useAuthStore } from '../../stores/auth.store'
import { useInterview } from '../../composables/useInterview'
import { interviewService } from '../../services/interview.service'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const sessionId = route.params.sessionId as string

const {
  isConnected,
  isTyping,
  isEvaluating,
  transcript,
  interviewResult,
  sessionError,
  connect,
  joinSession,
  sendMessage,
  endInterview,
} = useInterview()

const session = ref<{ duration: number; language: string } | null>(null)
const code = ref(`// Write your solution here\nfunction solve() {\n\n}`)
const userMessage = ref('')
const chatContainer = ref<HTMLElement>()
const timeLeft = ref(0)
const timerInterval = ref<ReturnType<typeof setInterval>>()
const showEndConfirm = ref(false)
const isLoading = ref(true)

onMounted(async () => {
  try {
    const response = await interviewService.getSession(sessionId)
    session.value = response.data.session

    // Set timer
    const startedAt = new Date(response.data.session.startedAt).getTime()
    const durationMs = (response.data.session.duration || 30) * 60 * 1000
    const elapsed = Date.now() - startedAt
    timeLeft.value = Math.max(0, Math.floor((durationMs - elapsed) / 1000))

    // Start countdown
    timerInterval.value = setInterval(() => {
      if (timeLeft.value > 0) {
        timeLeft.value--
      } else {
        clearInterval(timerInterval.value)
        handleEndInterview()
      }
    }, 1000)

    // Connect socket
    const token = authStore.accessToken || ''
    connect(token)

    setTimeout(() => {
      joinSession(sessionId)
      isLoading.value = false
    }, 500)
  } catch (error) {
    console.error('Failed to load session:', error)
    isLoading.value = false
  }
})

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

const timerColor = computed(() => {
  if (timeLeft.value > 300) return 'text-green-400'
  if (timeLeft.value > 60) return 'text-yellow-400'
  return 'text-red-400'
})

const scrollToBottom = async () => {
  await nextTick()
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

const handleSendMessage = () => {
  if (!userMessage.value.trim()) return
  sendMessage(sessionId, userMessage.value.trim(), code.value)
  userMessage.value = ''
  scrollToBottom()
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSendMessage()
  }
}

const handleEndInterview = () => {
  clearInterval(timerInterval.value)
  endInterview(sessionId, code.value)
  showEndConfirm.value = false
}

// Watch for result and navigate
const checkResult = setInterval(() => {
  if (interviewResult.value) {
    clearInterval(checkResult)
    router.push({
      name: 'interview-result',
      params: { sessionId },
      query: { result: JSON.stringify(interviewResult.value) },
    })
  }
}, 500)

const editorOptions = {
  fontSize: 13,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  automaticLayout: true,
  tabSize: 2,
  wordWrap: 'on' as const,
  padding: { top: 16 },
  lineNumbers: 'on' as const,
}

const formatContent = (content: string) => {
  return content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>')
}
</script>

<template>
  <div class="h-screen flex flex-col overflow-hidden" style="background:#0f0f0f;">

    <!-- Navbar -->
    <nav
      class="flex items-center justify-between px-4 py-2.5 flex-shrink-0 border-b"
      style="background:#1a1a1a; border-color:#333;"
    >
      <div class="flex items-center gap-3">
        <span class="text-white font-semibold text-sm">🎤 Mock Interview</span>
        <div
          :class="['w-2 h-2 rounded-full', isConnected ? 'bg-green-400' : 'bg-red-400']"
        ></div>
        <span class="text-xs text-gray-500">{{ isConnected ? 'Connected' : 'Connecting...' }}</span>
      </div>

      <!-- Timer -->
      <div class="flex items-center gap-2">
        <span :class="['text-2xl font-mono font-bold tabular-nums', timerColor]">
          {{ formatTime(timeLeft) }}
        </span>
      </div>

      <!-- End button -->
      <button
        @click="showEndConfirm = true"
        class="text-sm px-4 py-1.5 rounded-lg font-medium transition"
        style="background:#7f1d1d; color:#fca5a5; border:1px solid #991b1b;"
      >
        End Interview
      </button>
    </nav>

    <!-- End confirm modal -->
    <div
      v-if="showEndConfirm"
      class="fixed inset-0 z-50 flex items-center justify-center"
      style="background:rgba(0,0,0,0.8);"
    >
      <div class="bg-gray-900 rounded-2xl border border-gray-700 p-8 max-w-sm w-full mx-4 text-center">
        <div class="text-4xl mb-4">⏹️</div>
        <h3 class="text-white font-bold text-lg mb-2">End the interview?</h3>
        <p class="text-gray-400 text-sm mb-6">
          Your current code will be submitted and you'll receive an AI evaluation.
        </p>
        <div class="flex gap-3">
          <button
            @click="showEndConfirm = false"
            class="flex-1 py-2.5 rounded-lg text-sm border border-gray-600 text-gray-400 hover:bg-gray-800 transition"
          >
            Continue
          </button>
          <button
            @click="handleEndInterview"
            class="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition"
            style="background:#dc2626;"
          >
            End & Evaluate
          </button>
        </div>
      </div>
    </div>

    <!-- Evaluating overlay -->
    <div
      v-if="isEvaluating"
      class="fixed inset-0 z-50 flex items-center justify-center"
      style="background:rgba(0,0,0,0.9);"
    >
      <div class="text-center">
        <div class="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        <p class="text-white text-xl font-semibold mb-2">Evaluating your performance...</p>
        <p class="text-gray-400 text-sm">AI is analyzing your approach, code, and communication</p>
      </div>
    </div>

    <!-- Main layout -->
    <div class="flex flex-1 overflow-hidden">

      <!-- LEFT: Chat panel -->
      <div
        class="flex flex-col border-r"
        style="width:40%; background:#111; border-color:#333;"
      >
        <!-- Chat messages -->
        <div
          ref="chatContainer"
          class="flex-1 overflow-y-auto p-4 space-y-4"
        >
          <!-- Loading -->
          <div v-if="isLoading" class="text-center py-12">
            <div class="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p class="text-gray-500 text-sm">Connecting to interviewer...</p>
          </div>

          <!-- Messages -->
          <div
            v-for="(msg, index) in transcript"
            :key="index"
            :class="['flex', msg.role === 'user' ? 'justify-end' : 'justify-start']"
          >
            <!-- AI message -->
            <div v-if="msg.role === 'assistant'" class="flex gap-3 max-w-xs">
              <div
                class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                style="background:#1d4ed8;"
              >
                <span class="text-sm">🤖</span>
              </div>
              <div
                class="rounded-2xl rounded-tl-none px-4 py-3 text-sm text-gray-200 leading-relaxed"
                style="background:#1e2a3a;"
                v-html="formatContent(msg.content)"
              ></div>
            </div>

            <!-- User message -->
            <div v-else class="max-w-xs">
              <div
                class="rounded-2xl rounded-tr-none px-4 py-3 text-sm text-white"
                style="background:#1d4ed8;"
              >
                {{ msg.content }}
              </div>
            </div>
          </div>

          <!-- AI typing indicator -->
          <div v-if="isTyping" class="flex gap-3">
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style="background:#1d4ed8;"
            >
              <span class="text-sm">🤖</span>
            </div>
            <div
              class="rounded-2xl rounded-tl-none px-4 py-3 flex gap-1 items-center"
              style="background:#1e2a3a;"
            >
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay:0ms"></div>
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay:150ms"></div>
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay:300ms"></div>
            </div>
          </div>
        </div>

        <!-- Message input -->
        <div class="p-4 border-t" style="border-color:#333;">
          <div
            class="flex gap-2 rounded-xl border p-2"
            style="background:#1a1a1a; border-color:#444;"
          >
            <textarea
              v-model="userMessage"
              @keydown="handleKeydown"
              placeholder="Explain your approach... (Enter to send)"
              rows="2"
              class="flex-1 bg-transparent text-white text-sm placeholder-gray-600 resize-none focus:outline-none"
            ></textarea>
            <button
              @click="handleSendMessage"
              :disabled="!userMessage.trim() || isTyping"
              class="self-end p-2 rounded-lg transition disabled:opacity-40"
              style="background:#1d4ed8; color:white;"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
              </svg>
            </button>
          </div>
          <p class="text-xs text-gray-600 mt-1.5 text-center">
            Enter to send • Shift+Enter for new line
          </p>
        </div>
      </div>

      <!-- RIGHT: Monaco Editor -->
      <div class="flex-1 flex flex-col overflow-hidden" style="background:#1e1e1e;">
        <div
          class="flex items-center justify-between px-4 py-2 flex-shrink-0"
          style="background:#2d2d2d; border-bottom:1px solid #3d3d3d;"
        >
          <span class="text-xs text-gray-400">
            {{ session?.language || 'javascript' }} — Code Editor
          </span>
          <span class="text-xs text-gray-600">Your code is auto-saved to the session</span>
        </div>

        <VueMonacoEditor
          v-model:value="code"
          :language="session?.language || 'javascript'"
          theme="vs-dark"
          :options="editorOptions"
          class="flex-1"
          style="min-height:0;"
        />
      </div>
    </div>
  </div>
</template>