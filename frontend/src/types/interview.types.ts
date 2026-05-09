export interface InterviewSession {
  id: string
  status: 'active' | 'completed' | 'abandoned'
  duration: number
  language: string
  transcript: TranscriptMessage[]
  startedAt: string
  completedAt?: string
  scores?: InterviewScores
  aiSummary?: string
}

export interface TranscriptMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface InterviewScores {
  overall: number
  problemUnderstanding: number
  approachQuality: number
  codeQuality: number
  communication: number
}

export interface InterviewResult {
  scores: InterviewScores
  summary: string
  strengths: string[]
  improvements: string[]
  verdict: 'Hire' | 'Consider' | 'No Hire'
}