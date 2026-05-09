import api from './api'

export const interviewService = {
  async startSession(payload: {
    problemId: string
    duration: number
    language: string
  }) {
    const response = await api.post('/sessions/start', payload)
    return response.data
  },

  async getMySessions() {
    const response = await api.get('/sessions/me')
    return response.data
  },

  async getSession(id: string) {
    const response = await api.get(`/sessions/${id}`)
    return response.data
  },
}