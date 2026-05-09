<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { InterviewResult, InterviewScores } from '../../types/interview.types'

const route = useRoute()
const router = useRouter()

const result = computed<InterviewResult | null>(() => {
  try {
    return route.query.result ? JSON.parse(route.query.result as string) : null
  } catch {
    return null
  }
})

const verdictConfig = computed(() => {
  const v = result.value?.verdict
  if (v === 'Hire') return {
    color: 'text-green-400',
    bg: 'bg-green-900/30',
    border: 'border-green-700',
    icon: '🎉',
    message: 'Outstanding performance! You demonstrated strong problem-solving skills.'
  }
  if (v === 'Consider') return {
    color: 'text-yellow-400',
    bg: 'bg-yellow-900/30',
    border: 'border-yellow-700',
    icon: '🤔',
    message: 'Good effort! With a bit more practice you\'ll be interview-ready.'
  }
  return {
    color: 'text-red-400',
    bg: 'bg-red-900/30',
    border: 'border-red-700',
    icon: '💪',
    message: 'Keep practicing! Every interview is a learning opportunity.'
  }
})

const scoreColor = (score: number) => {
  if (score >= 80) return 'text-green-400'
  if (score >= 60) return 'text-yellow-400'
  return 'text-red-400'
}

const scoreBarColor = (score: number) => {
  if (score >= 80) return '#22c55e'
  if (score >= 60) return '#eab308'
  return '#ef4444'
}

const dimensions: { key: keyof InterviewScores; label: string; icon: string }[] = [
  { key: 'problemUnderstanding', label: 'Problem Understanding', icon: '🧠' },
  { key: 'approachQuality',      label: 'Approach Quality',      icon: '🗺️' },
  { key: 'codeQuality',          label: 'Code Quality',          icon: '💻' },
  { key: 'communication',        label: 'Communication',         icon: '💬' },
]
</script>

<template>
  <div class="min-h-screen py-12 px-4" style="background:#0a0a0f;">

    <!-- No result fallback -->
    <div v-if="!result" class="text-center py-20">
      <div class="text-5xl mb-4">😕</div>
      <p class="text-gray-400 mb-2 text-lg">No interview result found.</p>
      <p class="text-gray-600 text-sm mb-8">The result may have expired or the link is invalid.</p>
      <router-link
        to="/interview/setup"
        class="inline-block px-6 py-3 rounded-xl text-sm font-semibold text-white transition"
        style="background:linear-gradient(135deg,#1d4ed8,#7c3aed);"
      >
        Start a New Interview
      </router-link>
    </div>

    <!-- Result content -->
    <div v-else class="max-w-2xl mx-auto space-y-5">

      <!-- Back link -->
      <router-link
        to="/problems"
        class="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition mb-2"
      >
        ← Back to Problems
      </router-link>

      <!-- ── Header card ───────────────────────── -->
      <div
        class="rounded-2xl border p-8 text-center"
        style="background:#111827; border-color:#1f2937;"
      >
        <div class="text-6xl mb-4">{{ verdictConfig.icon }}</div>
        <h1 class="text-3xl font-bold text-white mb-3">Interview Complete</h1>

        <!-- Verdict badge -->
        <div
          :class="['inline-block px-8 py-2.5 rounded-full border text-xl font-bold mb-4', verdictConfig.bg, verdictConfig.border, verdictConfig.color]"
        >
          {{ result.verdict }}
        </div>

        <p class="text-gray-400 text-sm max-w-sm mx-auto">
          {{ verdictConfig.message }}
        </p>
      </div>

      <!-- ── Overall score ──────────────────────── -->
      <div
        class="rounded-2xl border p-6"
        style="background:#111827; border-color:#1f2937;"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-400 text-sm mb-1">Overall Score</p>
            <p :class="['text-6xl font-bold leading-none', scoreColor(result.scores.overall)]">
              {{ result.scores.overall }}
            </p>
            <p class="text-gray-600 text-xs mt-1">out of 100</p>
          </div>

          <!-- Circular score visual -->
          <div class="relative w-24 h-24">
            <svg class="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
              <circle cx="48" cy="48" r="40" fill="none" stroke="#1f2937" stroke-width="8"/>
              <circle
                cx="48" cy="48" r="40"
                fill="none"
                :stroke="scoreBarColor(result.scores.overall)"
                stroke-width="8"
                stroke-linecap="round"
                :stroke-dasharray="`${result.scores.overall * 2.51} 251`"
              />
            </svg>
            <div class="absolute inset-0 flex items-center justify-center">
              <span :class="['text-lg font-bold', scoreColor(result.scores.overall)]">
                {{ result.scores.overall }}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Score breakdown ───────────────────── -->
      <div
        class="rounded-2xl border p-6"
        style="background:#111827; border-color:#1f2937;"
      >
        <h3 class="text-white font-semibold mb-5 flex items-center gap-2">
          <span>📊</span> Score Breakdown
        </h3>
        <div class="space-y-5">
          <div
            v-for="dim in dimensions"
            :key="dim.key"
          >
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm text-gray-300 flex items-center gap-2">
                <span>{{ dim.icon }}</span>
                {{ dim.label }}
              </span>
              <span :class="['text-sm font-bold tabular-nums', scoreColor(result.scores[dim.key])]">
                {{ result.scores[dim.key] }}/100
              </span>
            </div>
            <div class="h-2 rounded-full overflow-hidden" style="background:#1f2937;">
              <div
                class="h-full rounded-full transition-all duration-500"
                :style="{
                  width: result.scores[dim.key] + '%',
                  background: scoreBarColor(result.scores[dim.key]),
                }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── AI Summary ─────────────────────────── -->
      <div
        class="rounded-2xl border p-6"
        style="background:#111827; border-color:#1f2937;"
      >
        <h3 class="text-white font-semibold mb-3 flex items-center gap-2">
          <span>🤖</span> AI Assessment
          <span class="text-xs text-indigo-400 bg-indigo-900/40 px-2 py-0.5 rounded-full">Gemini</span>
        </h3>
        <p class="text-gray-300 text-sm leading-relaxed">{{ result.summary }}</p>
      </div>

      <!-- ── Strengths + Improvements ──────────── -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">

        <!-- Strengths -->
        <div
          class="rounded-2xl border p-5"
          style="background:#0d1f0d; border-color:#166534;"
        >
          <h3 class="text-green-400 font-semibold text-sm mb-4 flex items-center gap-2">
            <span>✅</span> Strengths
          </h3>
          <ul class="space-y-2.5">
            <li
              v-for="s in result.strengths"
              :key="s"
              class="flex items-start gap-2.5 text-sm text-gray-300"
            >
              <span class="text-green-400 flex-shrink-0 mt-0.5 font-bold">•</span>
              {{ s }}
            </li>
          </ul>
        </div>

        <!-- Improvements -->
        <div
          class="rounded-2xl border p-5"
          style="background:#1c1500; border-color:#854d0e;"
        >
          <h3 class="text-yellow-400 font-semibold text-sm mb-4 flex items-center gap-2">
            <span>📈</span> Areas to Improve
          </h3>
          <ul class="space-y-2.5">
            <li
              v-for="imp in result.improvements"
              :key="imp"
              class="flex items-start gap-2.5 text-sm text-gray-300"
            >
              <span class="text-yellow-400 flex-shrink-0 mt-0.5 font-bold">•</span>
              {{ imp }}
            </li>
          </ul>
        </div>
      </div>

      <!-- ── Tips based on verdict ─────────────── -->
      <div
        class="rounded-2xl border p-5"
        style="background:#0f0e1a; border-color:#312e81;"
      >
        <h3 class="text-indigo-400 font-semibold text-sm mb-3 flex items-center gap-2">
          <span>💡</span> Next Steps
        </h3>
        <ul class="space-y-2 text-sm text-gray-400">
          <template v-if="result.verdict === 'Hire'">
            <li class="flex gap-2"><span class="text-indigo-400">→</span> Try a harder problem to keep challenging yourself</li>
            <li class="flex gap-2"><span class="text-indigo-400">→</span> Practice system design questions next</li>
            <li class="flex gap-2"><span class="text-indigo-400">→</span> Work on behavioral interview questions</li>
          </template>
          <template v-else-if="result.verdict === 'Consider'">
            <li class="flex gap-2"><span class="text-indigo-400">→</span> Practice explaining your approach before coding</li>
            <li class="flex gap-2"><span class="text-indigo-400">→</span> Focus on the areas marked for improvement above</li>
            <li class="flex gap-2"><span class="text-indigo-400">→</span> Do 2-3 more mock interviews this week</li>
          </template>
          <template v-else>
            <li class="flex gap-2"><span class="text-indigo-400">→</span> Start with easier problems to build confidence</li>
            <li class="flex gap-2"><span class="text-indigo-400">→</span> Practice thinking out loud while solving problems</li>
            <li class="flex gap-2"><span class="text-indigo-400">→</span> Review common patterns: hash maps, two pointers, sliding window</li>
          </template>
        </ul>
      </div>

      <!-- ── Action buttons ────────────────────── -->
      <div class="flex gap-3 pb-8">
        <router-link
          to="/interview/setup"
          class="flex-1 py-3.5 rounded-xl text-sm font-semibold text-white text-center transition"
          style="background:linear-gradient(135deg,#1d4ed8,#7c3aed);"
        >
          🎤 Practice Again
        </router-link>
        <router-link
          to="/problems"
          class="flex-1 py-3.5 rounded-xl text-sm font-semibold text-center border text-gray-300 hover:bg-gray-800 transition"
          style="border-color:#374151;"
        >
          📚 Solve Problems
        </router-link>
        <router-link
          to="/dashboard"
          class="flex-1 py-3.5 rounded-xl text-sm font-semibold text-center border text-gray-300 hover:bg-gray-800 transition"
          style="border-color:#374151;"
        >
          📊 Dashboard
        </router-link>
      </div>

    </div>
  </div>
</template>