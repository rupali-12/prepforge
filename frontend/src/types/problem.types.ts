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