export interface Problem {
  _id: string
  title: string
  slug: string
  difficulty: 'easy' | 'medium' | 'hard'
  description: string
  examples: {
    input: string
    output: string
    explanation?: string
  }[]
  constraints: string[]
  hints: {
    level: number
    content: string
  }[]
  tags: string[]
  companies: string[]
  acceptanceRate: number
}

export interface TestResult {
  input: string
  expected: string
  output: string
  passed: boolean
  executionTime: number
}

export interface RunCodeResponse {
  results: TestResult[]
  allPassed: boolean
  passedCount: number
  totalCount: number
}

export interface AIReview {
  score: number
  timeComplexity: string
  spaceComplexity: string
  strengths: string[]
  improvements: string[]
  optimizedApproach: string
  overallFeedback: string
}

export interface Submission {
  id: string
  status: 'accepted' | 'wrong_answer' | 'runtime_error' | 'pending'
  aiReview: AIReview
  language: string
  createdAt: string
}