import api from './api'

export const problemsService = {
  async getProblems(params?: {
    difficulty?: string
    tag?: string
    company?: string
    search?: string
    page?: number
  }) {
    const response = await api.get('/problems', { params })
    return response.data
  },

  async getProblemBySlug(slug: string) {
    const response = await api.get(`/problems/${slug}`)
    return response.data
  },

  async getHint(problemId: string, level: number) {
    const response = await api.get(`/problems/${problemId}/hint`, {
      params: { level },
    })
    return response.data
  },

  async runCode(payload: {
    code: string
    language: string
    problemId: string
  }) {
    const response = await api.post('/code/run', payload)
    return response.data
  },
}