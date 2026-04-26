import { defineStore } from 'pinia'
import { ref } from 'vue'
import { problemsService } from '../services/problems.service'
import type { Problem } from '../types/problem.types'

export const useProblemsStore = defineStore('problems', () => {
  const problems = ref<Problem[]>([])
  const currentProblem = ref<Problem | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref({ total: 0, page: 1, limit: 20, totalPages: 1 })

  const filters = ref({
    difficulty: '',
    tag: '',
    company: '',
    search: '',
  })

  async function fetchProblems(page = 1) {
    isLoading.value = true
    error.value = null
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const params: any = { page }
      if (filters.value.difficulty) params.difficulty = filters.value.difficulty
      if (filters.value.tag) params.tag = filters.value.tag
      if (filters.value.company) params.company = filters.value.company
      if (filters.value.search) params.search = filters.value.search

      const response = await problemsService.getProblems(params)
      problems.value = response.data.problems
      pagination.value = response.data.pagination
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to load problems'
    } finally {
      isLoading.value = false
    }
  }

  async function fetchProblemBySlug(slug: string) {
    isLoading.value = true
    error.value = null
    try {
      const response = await problemsService.getProblemBySlug(slug)
      currentProblem.value = response.data.problem
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Problem not found'
    } finally {
      isLoading.value = false
    }
  }

  function setFilter(key: keyof typeof filters.value, value: string) {
    filters.value[key] = value
  }

  function clearFilters() {
    filters.value = { difficulty: '', tag: '', company: '', search: '' }
  }

  return {
    problems,
    currentProblem,
    isLoading,
    error,
    pagination,
    filters,
    fetchProblems,
    fetchProblemBySlug,
    setFilter,
    clearFilters,
  }
})