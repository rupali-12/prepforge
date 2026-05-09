import { ref, onUnmounted } from 'vue'
import { io, Socket } from 'socket.io-client'
import type { TranscriptMessage, InterviewScores, InterviewResult } from '../types/interview.types'

export const useInterview = () => {
  let socket: Socket | null = null

  const isConnected = ref(false)
  const isTyping = ref(false)
  const isEvaluating = ref(false)
  const transcript = ref<TranscriptMessage[]>([])
  const interviewResult = ref<InterviewResult | null>(null)
  const sessionError = ref('')

  const connect = (token: string) => {
    socket = io(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling'],
    })

    socket.on('connect', () => {
      isConnected.value = true
      console.log('Socket connected')
    })

    socket.on('disconnect', () => {
      isConnected.value = false
      console.log('Socket disconnected')
    })

    socket.on('interview:joined', ({ session }: { session: { transcript: TranscriptMessage[] } }) => {
      transcript.value = session.transcript || []
    })

    socket.on('interview:message', (message: TranscriptMessage) => {
      transcript.value.push(message)
    })

    socket.on('interview:typing', ({ isTyping: typing }: { isTyping: boolean }) => {
      isTyping.value = typing
    })

    socket.on('interview:evaluating', () => {
      isEvaluating.value = true
    })

    socket.on('interview:completed', (result: InterviewResult) => {
      isEvaluating.value = false
      interviewResult.value = result
    })

    socket.on('interview:error', ({ message }: { message: string }) => {
      sessionError.value = message
      console.error('Interview error:', message)
    })

    socket.on('connect_error', (err) => {
      console.error('Connection error:', err.message)
      sessionError.value = 'Connection failed. Please refresh.'
    })
  }

  const joinSession = (sessionId: string) => {
    socket?.emit('interview:join', { sessionId })
  }

const sendMessage = (sessionId: string, message: string, code: string) => {
  // Don't push immediately — let the socket event handle it
  socket?.emit('interview:send_message', { sessionId, message, code })
}

  const endInterview = (sessionId: string, finalCode: string) => {
    socket?.emit('interview:end', { sessionId, finalCode })
  }

  const disconnect = () => {
    socket?.disconnect()
    socket = null
  }

  onUnmounted(() => {
    disconnect()
  })

  return {
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
    disconnect,
  }
}