<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { VueMonacoEditor } from '@guolao/vue-monaco-editor'
import { useProblemsStore } from '../../stores/problems.store'
import { problemsService } from '../../services/problems.service'
import type { TestResult, Submission } from '../../types/problem.types'

interface ProblemSubmission {
  _id: string
  status: string
  language: string
  createdAt: string
  executionTime: number
  code: string
  aiReview?: {
    score: number
    timeComplexity: string
    spaceComplexity: string
    overallFeedback: string
  }
}

const route = useRoute()
const store = useProblemsStore()
const language = ref('javascript')
const isRunning = ref(false)
const isSubmitting = ref(false)
const testResults = ref<TestResult[]>([])
const runError = ref('')
const submitError = ref('')
const currentHintLevel = ref(0)
const aiHints = ref<string[]>([])
const activeTab = ref<'description' | 'hints' | 'results' | 'submissions'>('description')
const submission = ref<Submission | null>(null)
const showAIReview = ref(false)
const problemSubmissions = ref<ProblemSubmission[]>([])
const selectedSubmission = ref<ProblemSubmission | null>(null)
const showSubmissionCode = ref(false)

const languages = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'csharp', label: 'C#' },
]

const defaultCode: Record<string, string> = {
  javascript: `// JavaScript Solution
const lines = require('fs').readFileSync(0, 'utf8').trim().split('\\n');

function solve() {
  // Write your solution here

}

solve();`,

  python: `# Python Solution
import sys
input_data = sys.stdin.read().strip().split('\\n')

def solve():
    # Write your solution here
    pass

solve()`,

  java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Write your solution here

    }
}`,

  cpp: `#include <iostream>
#include <vector>
#include <map>
#include <string>
#include <algorithm>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    // Write your solution here

    return 0;
}`,

  c: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main() {
    // Write your solution here

    return 0;
}`,

  typescript: `// TypeScript Solution
const lines = require('fs').readFileSync(0, 'utf8').trim().split('\\n');

function solve(): void {
    // Write your solution here

}

solve();`,

  go: `package main

import (
    "bufio"
    "fmt"
    "os"
)

var reader *bufio.Reader

func main() {
    reader = bufio.NewReader(os.Stdin)

    // Write your solution here
    fmt.Println()
}`,

  rust: `use std::io::{self, Read};

fn main() {
    let mut input = String::new();
    io::stdin().read_to_string(&mut input).unwrap();
    let lines: Vec<&str> = input.trim().split('\\n').collect();

    // Write your solution here
    println!("{}", "result");
}`,

  kotlin: `import java.util.Scanner

fun main() {
    val sc = Scanner(System.\`in\`)

    // Write your solution here

}`,

  csharp: `using System;
using System.Collections.Generic;

class Solution {
    static void Main() {
        var lines = new List<string>();
        string? line;
        while ((line = Console.ReadLine()) != null)
            lines.Add(line);

        // Write your solution here

    }
}`,
}

const monacoLanguage = computed(() => {
  const map: Record<string, string> = {
    javascript: 'javascript',
    python: 'python',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    typescript: 'typescript',
    go: 'go',
    rust: 'rust',
    kotlin: 'kotlin',
    csharp: 'csharp',
  }
  return map[language.value] || language.value
})

const code = ref(defaultCode['javascript'])

const onLanguageChange = (lang: string) => {
  language.value = lang
  code.value = defaultCode[lang] ?? `// Write your ${lang} solution here\n`
}

const problem = computed(() => store.currentProblem)

onMounted(async () => {
  await store.fetchProblemBySlug(route.params.slug as string)
  // fetch after problem loads so we have the ID
  store.currentProblem && fetchProblemSubmissions()
})

// Watch for problem loading then fetch submissions
watch(() => store.currentProblem, async (newProblem) => {
  if (newProblem) {
    await fetchProblemSubmissions()
  }
})

const fetchProblemSubmissions = async () => {
  if (!store.currentProblem) return
  try {
    const response = await problemsService.getSubmissionsByProblem(store.currentProblem._id)
    problemSubmissions.value = response.data.submissions
  } catch {
    // silently fail
  }
}

const difficultyColor = (d: string) => {
  const map: Record<string, string> = {
    easy: 'text-green-600 bg-green-50 border-green-200',
    medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    hard: 'text-red-600 bg-red-50 border-red-200',
  }
  return map[d] ?? ''
}

// ── Run Code ─────────────────────────────
const runCode = async () => {
  if (!problem.value) return

  if (!code.value?.trim()) {
    runError.value = 'Please write some code before running'
    activeTab.value = 'results'
    return
  }

  isRunning.value = true
  runError.value = ''
  testResults.value = []
  activeTab.value = 'results'

  try {
    const response = await problemsService.runCode({
      code: code.value || '',
      language: language.value,
      problemId: problem.value._id,
    })
    testResults.value = response.data.results
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } } }
    runError.value = error.response?.data?.message ?? 'Code execution failed. Please try again.'
  } finally {
    isRunning.value = false
  }
}

// ── Submit Code ───────────────────────────
const submitCode = async () => {
  if (!problem.value) return

  if (!code.value?.trim()) {
    submitError.value = 'Please write some code before submitting'
    activeTab.value = 'results'
    return
  }

  if (testResults.value.length === 0) {
    submitError.value = 'Please run your code first before submitting'
    activeTab.value = 'results'
    return
  }

  isSubmitting.value = true
  submitError.value = ''
  showAIReview.value = false

  try {
    const response = await problemsService.submitCode({
      code: code.value || '',
      language: language.value,
      problemId: problem.value._id,
      testResults: testResults.value,
      allPassed: allPassed.value,
    })

    submission.value = response.data.submission
    showAIReview.value = true
    activeTab.value = 'results'
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } } }
    submitError.value = error.response?.data?.message ?? 'Submission failed. Please try again.'
    activeTab.value = 'results'
  } finally {
    isSubmitting.value = false
  }
}

// ── Get AI Hint ───────────────────────────
const isLoadingHint = ref(false)

const getHint = async () => {
  if (!problem.value || currentHintLevel.value >= 3) return
  const nextLevel = currentHintLevel.value + 1

  isLoadingHint.value = true
  activeTab.value = 'hints'

  try {
    const response = await problemsService.getHint(
      problem.value._id,
      nextLevel,
      code.value || ''
    )
    aiHints.value.push(response.data.hint.content)
    currentHintLevel.value = nextLevel
  } catch {
    // fallback to static hint from problem data
    const staticHint = problem.value.hints?.find(h => h.level === nextLevel)
    if (staticHint) {
      aiHints.value.push(staticHint.content)
      currentHintLevel.value = nextLevel
    }
  } finally {
    isLoadingHint.value = false
  }
}

const passedCount = computed(() => testResults.value.filter((r) => r.passed).length)
const allPassed = computed(
  () => testResults.value.length > 0 && passedCount.value === testResults.value.length
)

const editorOptions = {
  fontSize: 14,
  fontFamily: 'Fira Code, Cascadia Code, Consolas, monospace',
  fontLigatures: true,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  automaticLayout: true,
  tabSize: 2,
  wordWrap: 'on' as const,
  padding: { top: 20, bottom: 20 },
  lineNumbers: 'on' as const,
  renderLineHighlight: 'line' as const,
  cursorBlinking: 'smooth' as const,
  cursorStyle: 'line' as const,
  smoothScrolling: true,
  formatOnPaste: true,
  formatOnType: true,
  suggest: { showKeywords: true },
  quickSuggestions: true,
  bracketPairColorization: { enabled: true },
  guides: { bracketPairs: true },
}
</script>

<template>
  <div class="h-screen flex flex-col overflow-hidden" style="background:#1e1e1e;">

    <!-- ── Navbar ───────────────────────────────────────── -->
    <nav
      class="flex items-center justify-between px-4 py-2.5 border-b flex-shrink-0"
      style="background:#1a1a1a; border-color:#333;"
    >
      <!-- Left: back + title -->
      <div class="flex items-center gap-4">
        <router-link
          to="/problems"
          class="text-sm text-gray-400 hover:text-white transition"
        >
          ← Problems
        </router-link>
        <div class="w-px h-4 bg-gray-700"></div>
        <span v-if="problem" class="text-sm font-medium text-white">
          {{ problem.title }}
        </span>
        <span
          v-if="problem"
          :class="['text-xs font-medium px-2 py-0.5 rounded-full capitalize border', difficultyColor(problem.difficulty)]"
        >
          {{ problem.difficulty }}
        </span>
      </div>

      <!-- Right: controls -->
      <div class="flex items-center gap-2">
        <!-- Language -->
        <select
          :value="language"
          @change="onLanguageChange(($event.target as HTMLSelectElement).value)"
          class="text-sm rounded px-3 py-1.5 text-white focus:outline-none"
          style="background:#2d2d2d; border:1px solid #444;"
        >
          <option
            v-for="lang in languages"
            :key="lang.value"
            :value="lang.value"
            style="background:#2d2d2d;"
          >
            {{ lang.label }}
          </option>
        </select>

        <!-- Hint -->
        <button
          @click="getHint"
          :disabled="currentHintLevel >= 3 || isLoadingHint"
          class="text-sm px-3 py-1.5 rounded transition disabled:opacity-40 flex items-center gap-1.5"
          style="background:#2d2d2d; border:1px solid #ca8a04; color:#fbbf24;"
        >
          <span v-if="isLoadingHint" class="w-3 h-3 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></span>
          <span v-else>💡</span>
          {{ isLoadingHint ? 'Getting hint...' : `Hint ${currentHintLevel}/3` }}
        </button>

        <!-- Run -->
        <button
          @click="runCode"
          :disabled="isRunning"
          class="text-sm font-semibold px-4 py-1.5 rounded transition flex items-center gap-2 disabled:opacity-60"
          style="background:#1a7f4b; color:white;"
        >
          <span v-if="isRunning" class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
          {{ isRunning ? 'Running...' : 'Run Code' }}
        </button>

        <!-- Submit -->
        <button
          @click="submitCode"
          :disabled="isSubmitting"
          class="text-sm font-semibold px-4 py-1.5 rounded transition flex items-center gap-2 disabled:opacity-60"
          style="background:#0ea5e9; color:white;"
        >
          <span v-if="isSubmitting" class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          <span v-else>↑</span>
          {{ isSubmitting ? 'Submitting...' : 'Submit' }}
        </button>

        
      </div>
    </nav>

    <!-- ── Main Layout ───────────── -->
    <div class="flex flex-1 overflow-hidden">

      <!-- LEFT PANEL -->
      <div
        class="flex flex-col border-r overflow-hidden"
        style="width:42%; background:#ffffff; border-color:#e5e7eb;"
      >
        <!-- Tabs -->
       <div class="flex border-b flex-shrink-0" style="border-color:#e5e7eb;">
  <button
    v-for="tab in ['description', 'hints', 'results']"
    :key="tab"
    @click="activeTab = tab as 'description' | 'hints' | 'results'"
    :class="[
      'px-4 py-3 text-sm font-medium capitalize transition border-b-2',
      activeTab === tab
        ? 'border-blue-600 text-blue-600'
        : 'border-transparent text-gray-500 hover:text-gray-700',
    ]"
  >
    {{ tab }}
    <span
      v-if="tab === 'results' && testResults.length > 0"
      :class="['ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-medium',
        allPassed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700']"
    >
      {{ passedCount }}/{{ testResults.length }}
    </span>
  </button>

  <!-- Submissions tab button -->
  <button
    @click="activeTab = 'submissions'"
    :class="[
      'px-4 py-3 text-sm font-medium transition border-b-2',
      activeTab === 'submissions'
        ? 'border-blue-600 text-blue-600'
        : 'border-transparent text-gray-500 hover:text-gray-700',
    ]"
  >
    Submissions
    <span
      v-if="problemSubmissions.length > 0"
      class="ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600"
    >
      {{ problemSubmissions.length }}
    </span>
  </button>
</div>

        <!-- Tab body -->
        <div class="flex-1 overflow-y-auto p-5">

          <!-- Loading skeleton -->
          <div v-if="store.isLoading" class="animate-pulse space-y-4">
            <div class="h-6 bg-gray-200 rounded w-2/3"></div>
            <div class="h-4 bg-gray-100 rounded w-1/4"></div>
            <div class="h-4 bg-gray-100 rounded w-full mt-4"></div>
            <div class="h-4 bg-gray-100 rounded w-full"></div>
            <div class="h-4 bg-gray-100 rounded w-3/4"></div>
          </div>

          <!-- ── DESCRIPTION ──────────────────── -->
          <div v-else-if="activeTab === 'description' && problem">
            <p class="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed mb-6">
              {{ problem.description }}
            </p>

            <div class="space-y-3 mb-6">
              <p class="text-sm font-semibold text-gray-900">Examples</p>
              <div
                v-for="(ex, i) in problem.examples"
                :key="i"
                class="rounded-lg p-4 border text-sm"
                style="background:#f8fafc; border-color:#e2e8f0;"
              >
                <p class="text-xs font-semibold text-gray-500 mb-2">Example {{ i + 1 }}</p>
                <div class="font-mono space-y-1">
                  <div class="text-gray-800">
                    <span class="font-semibold">Input: </span>
                    <span class="text-gray-600">{{ ex.input }}</span>
                  </div>
                  <div class="text-gray-800">
                    <span class="font-semibold">Output: </span>
                    <span class="text-gray-600">{{ ex.output }}</span>
                  </div>
                  <div v-if="ex.explanation" class="text-gray-500 text-xs pt-1">
                    <span class="font-semibold">Explanation: </span>{{ ex.explanation }}
                  </div>
                </div>
              </div>
            </div>

            <div class="mb-6">
              <p class="text-sm font-semibold text-gray-900 mb-3">Constraints</p>
              <ul class="space-y-1.5">
                <li
                  v-for="c in problem.constraints"
                  :key="c"
                  class="flex items-start gap-2 text-sm text-gray-600"
                >
                  <span class="text-gray-400 mt-0.5 flex-shrink-0">•</span>
                  <code class="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">{{ c }}</code>
                </li>
              </ul>
            </div>

            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="tag in problem.tags"
                :key="tag"
                class="text-xs px-2.5 py-1 rounded-full border"
                style="background:#eff6ff; color:#1d4ed8; border-color:#bfdbfe;"
              >
                {{ tag }}
              </span>
            </div>
          </div>

          <!-- ── HINTS ────────────────────────── -->
          <div v-else-if="activeTab === 'hints'">
            <!-- No hints yet -->
            <div v-if="currentHintLevel === 0 && !isLoadingHint" class="text-center py-16">
              <div class="text-5xl mb-4">💡</div>
              <p class="text-gray-500 text-sm mb-2">Stuck? Get AI-powered hints.</p>
              <p class="text-gray-400 text-xs mb-6">Hints guide your thinking without giving away the answer.</p>
              <button
                @click="getHint"
                class="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 text-sm font-medium px-6 py-2.5 rounded-lg transition"
              >
                Reveal First Hint
              </button>
            </div>

            <!-- Loading hint -->
            <div v-else-if="isLoadingHint && aiHints.length === 0" class="text-center py-16">
              <div class="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p class="text-sm text-gray-500">AI is generating your hint...</p>
            </div>

            <!-- Hints list -->
            <div v-else class="space-y-3">
              <div
                v-for="(hint, index) in aiHints"
                :key="index"
                class="rounded-lg p-4 border"
                style="background:#fffbeb; border-color:#fde68a;"
              >
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-xs font-semibold text-yellow-700">
                    Hint {{ index + 1 }} of 3
                  </span>
                  <span class="text-xs text-yellow-500 bg-yellow-100 px-1.5 py-0.5 rounded">
                    AI Generated
                  </span>
                </div>
                <p class="text-sm text-gray-700 leading-relaxed">{{ hint }}</p>
              </div>

              <!-- Loading next hint -->
              <div v-if="isLoadingHint" class="rounded-lg p-4 border" style="background:#fffbeb; border-color:#fde68a;">
                <div class="flex items-center gap-2">
                  <div class="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                  <span class="text-sm text-yellow-700">Generating hint {{ currentHintLevel + 1 }}...</span>
                </div>
              </div>

              <!-- Reveal next -->
              <button
                v-if="currentHintLevel < 3 && !isLoadingHint"
                @click="getHint"
                class="w-full py-2.5 rounded-lg text-sm transition border font-medium"
                style="background:#fffbeb; border-color:#fde68a; color:#92400e;"
              >
                Reveal Hint {{ currentHintLevel + 1 }}
              </button>

              <p v-if="currentHintLevel >= 3 && !isLoadingHint" class="text-center text-xs text-gray-400 py-2">
                All hints revealed — you've got this! 💪
              </p>
            </div>
          </div>

          <!-- ── RESULTS ───────────────────────── -->
          <div v-else-if="activeTab === 'results'">

            <!-- Running spinner -->
            <div v-if="isRunning" class="text-center py-16">
              <div class="w-10 h-10 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p class="text-sm text-gray-500">Running your code...</p>
              <p class="text-xs text-gray-400 mt-1">This may take a few seconds</p>
            </div>

            <!-- Submitting spinner -->
            <div v-else-if="isSubmitting" class="text-center py-16">
              <div class="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p class="text-sm text-gray-500">Getting AI code review...</p>
              <p class="text-xs text-gray-400 mt-1">Gemini is analyzing your solution</p>
            </div>

            <!-- Submit error -->
            <div
              v-else-if="submitError"
              class="rounded-lg p-4 border text-sm mb-3"
              style="background:#fef2f2; border-color:#fecaca; color:#991b1b;"
            >
              <p class="font-semibold mb-1">❌ {{ submitError }}</p>
            </div>

            <!-- Run error -->
            <div
              v-else-if="runError"
              class="rounded-lg p-4 border text-sm"
              style="background:#fef2f2; border-color:#fecaca; color:#991b1b;"
            >
              <p class="font-semibold mb-1">❌ Execution Error</p>
              <p>{{ runError }}</p>
            </div>

            <!-- Test results -->
            <div v-else-if="testResults.length > 0" class="space-y-3">

              <!-- Summary -->
              <div
                :class="['rounded-lg p-4 border text-sm font-medium',
                  allPassed ? 'border-green-200 text-green-800' : 'border-red-200 text-red-800']"
                :style="allPassed ? 'background:#f0fdf4' : 'background:#fef2f2'"
              >
                <p class="text-base font-semibold">
                  {{ allPassed ? '✅ All Tests Passed' : '❌ Wrong Answer' }}
                </p>
                <p class="text-xs mt-1 font-normal opacity-80">
                  {{ passedCount }} / {{ testResults.length }} test cases passed
                </p>
                <p v-if="allPassed" class="text-xs mt-1 text-green-600">
                  Click Submit to save your solution and get AI feedback
                </p>
              </div>

              <!-- Individual test cases -->
              <div
                v-for="(result, i) in testResults"
                :key="i"
                class="rounded-lg border overflow-hidden"
              >
                <div
                  :class="['flex items-center justify-between px-4 py-2.5 text-xs font-semibold',
                    result.passed ? 'text-green-700' : 'text-red-700']"
                  :style="result.passed
                    ? 'background:#f0fdf4; border-bottom:1px solid #bbf7d0'
                    : 'background:#fef2f2; border-bottom:1px solid #fecaca'"
                >
                  <span>{{ result.passed ? '✓ Test ' + (i + 1) + ' Passed' : '✗ Test ' + (i + 1) + ' Failed' }}</span>
                  <span class="font-normal text-gray-400">{{ result.executionTime }}s</span>
                </div>
                <div class="p-4 space-y-2 font-mono text-xs" style="background:#f9fafb;">
                  <div>
                    <span class="text-gray-500 font-sans font-medium text-xs">Input</span>
                    <div class="mt-1 bg-white rounded px-3 py-2 border border-gray-200 text-gray-700">
                      {{ result.input }}
                    </div>
                  </div>
                  <div>
                    <span class="text-gray-500 font-sans font-medium text-xs">Expected</span>
                    <div class="mt-1 bg-white rounded px-3 py-2 border border-gray-200 text-gray-700">
                      {{ result.expected }}
                    </div>
                  </div>
                  <div>
                    <span
                      class="font-sans font-medium text-xs"
                      :class="result.passed ? 'text-green-600' : 'text-red-600'"
                    >
                      Your Output
                    </span>
                    <div
                      class="mt-1 rounded px-3 py-2 border text-gray-700"
                      :style="result.passed
                        ? 'background:#f0fdf4; border-color:#bbf7d0'
                        : 'background:#fef2f2; border-color:#fecaca'"
                    >
                      {{ result.output }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- ── AI Review Panel ───────────── -->
              <div v-if="showAIReview && submission?.aiReview" class="rounded-xl border overflow-hidden mt-2">
                <!-- Header -->
                <div
                  class="px-4 py-3 flex items-center justify-between"
                  style="background:#1e1b4b; border-bottom:1px solid #312e81;"
                >
                  <div class="flex items-center gap-2">
                    <span class="text-lg">🤖</span>
                    <span class="text-sm font-semibold text-white">AI Code Review</span>
                    <span class="text-xs text-indigo-300 bg-indigo-900 px-2 py-0.5 rounded-full">
                      Gemini
                    </span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <span class="text-xs text-indigo-300">Score</span>
                    <span
                      :class="['text-xl font-bold',
                        submission.aiReview.score >= 80 ? 'text-green-400' :
                        submission.aiReview.score >= 50 ? 'text-yellow-400' : 'text-red-400']"
                    >
                      {{ submission.aiReview.score }}
                    </span>
                    <span class="text-xs text-indigo-400">/100</span>
                  </div>
                </div>

                <div class="p-4 space-y-4" style="background:#0f0e1a;">
                  <!-- Complexity badges -->
                  <div class="grid grid-cols-2 gap-3">
                    <div class="rounded-lg px-3 py-3 text-center" style="background:#1e1b4b;">
                      <p class="text-xs text-indigo-400 mb-1">Time Complexity</p>
                      <p class="text-sm font-bold text-white font-mono">
                        {{ submission.aiReview.timeComplexity }}
                      </p>
                    </div>
                    <div class="rounded-lg px-3 py-3 text-center" style="background:#1e1b4b;">
                      <p class="text-xs text-indigo-400 mb-1">Space Complexity</p>
                      <p class="text-sm font-bold text-white font-mono">
                        {{ submission.aiReview.spaceComplexity }}
                      </p>
                    </div>
                  </div>

                  <!-- Overall feedback -->
                  <div class="rounded-lg p-3" style="background:#1e1b4b;">
                    <p class="text-xs font-semibold text-indigo-300 mb-1.5">Overall Feedback</p>
                    <p class="text-sm text-gray-300 leading-relaxed">
                      {{ submission.aiReview.overallFeedback }}
                    </p>
                  </div>

                  <!-- Strengths -->
                  <div v-if="submission.aiReview.strengths?.length">
                    <p class="text-xs font-semibold text-green-400 mb-2">✓ Strengths</p>
                    <ul class="space-y-1.5">
                      <li
                        v-for="s in submission.aiReview.strengths"
                        :key="s"
                        class="flex items-start gap-2 text-sm text-gray-300"
                      >
                        <span class="text-green-400 flex-shrink-0 mt-0.5">•</span>
                        {{ s }}
                      </li>
                    </ul>
                  </div>

                  <!-- Improvements -->
                  <div v-if="submission.aiReview.improvements?.length">
                    <p class="text-xs font-semibold text-yellow-400 mb-2">↑ Areas to Improve</p>
                    <ul class="space-y-1.5">
                      <li
                        v-for="imp in submission.aiReview.improvements"
                        :key="imp"
                        class="flex items-start gap-2 text-sm text-gray-300"
                      >
                        <span class="text-yellow-400 flex-shrink-0 mt-0.5">•</span>
                        {{ imp }}
                      </li>
                    </ul>
                  </div>

                  <!-- Optimized approach -->
                  <div v-if="submission.aiReview.optimizedApproach" class="rounded-lg p-3" style="background:#1e1b4b;">
                    <p class="text-xs font-semibold text-blue-400 mb-1.5">💡 Optimized Approach</p>
                    <p class="text-sm text-gray-300 leading-relaxed">
                      {{ submission.aiReview.optimizedApproach }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Empty state -->
            <div v-else class="text-center py-16">
              <div class="text-4xl mb-4">▶</div>
              <p class="text-sm text-gray-500">Click "Run Code" to test your solution</p>
              <p class="text-xs text-gray-400 mt-1">Then "Submit" to get AI feedback</p>
            </div>

          </div>

          <!-- ── SUBMISSIONS TAB ──────────────────── -->
<div v-else-if="activeTab === 'submissions'">
  <!-- Empty state -->
  <div v-if="problemSubmissions.length === 0" class="text-center py-16">
    <div class="text-4xl mb-4">📋</div>
    <p class="text-sm text-gray-500 mb-1">No submissions yet</p>
    <p class="text-xs text-gray-400">Submit your solution to see history here</p>
  </div>

  <!-- Submissions list -->
  <div v-else class="space-y-3">
    <div
      v-for="sub in problemSubmissions"
      :key="sub._id"
      class="rounded-lg border overflow-hidden"
    >
      <!-- Header row -->
      <div
        :class="['flex items-center justify-between px-4 py-3 cursor-pointer',
          sub.status === 'accepted' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200']"
        @click="selectedSubmission = selectedSubmission?._id === sub._id ? null : sub; showSubmissionCode = false"
      >
        <div class="flex items-center gap-3">
          <span :class="['text-xs font-semibold', sub.status === 'accepted' ? 'text-green-700' : 'text-red-700']">
            {{ sub.status === 'accepted' ? '✓ Accepted' : '✗ Wrong Answer' }}
          </span>
          <span class="text-xs text-gray-500 font-mono">{{ sub.language }}</span>
          <span v-if="sub.aiReview?.score" class="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
            AI Score: {{ sub.aiReview.score }}/100
          </span>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-xs text-gray-400">
            {{ new Date(sub.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) }}
          </span>
          <span class="text-xs text-gray-400">{{ selectedSubmission?._id === sub._id ? '▲' : '▼' }}</span>
        </div>
      </div>

      <!-- Expanded detail -->
      <div v-if="selectedSubmission?._id === sub._id" class="border-t" style="border-color:inherit;">

        <!-- AI Review summary -->
        <div v-if="sub.aiReview" class="px-4 py-3 space-y-2" style="background:#f8fafc;">
          <div class="grid grid-cols-2 gap-2">
            <div class="text-center bg-white rounded-lg py-2 border border-gray-200">
              <p class="text-xs text-gray-400">Time</p>
              <p class="text-sm font-bold text-gray-800 font-mono">{{ sub.aiReview.timeComplexity }}</p>
            </div>
            <div class="text-center bg-white rounded-lg py-2 border border-gray-200">
              <p class="text-xs text-gray-400">Space</p>
              <p class="text-sm font-bold text-gray-800 font-mono">{{ sub.aiReview.spaceComplexity }}</p>
            </div>
          </div>
          <p class="text-xs text-gray-600 leading-relaxed bg-white rounded-lg px-3 py-2 border border-gray-200">
            {{ sub.aiReview.overallFeedback }}
          </p>
        </div>

        <!-- View code toggle -->
        <div class="px-4 py-2 border-t border-gray-100 flex justify-between items-center" style="background:#f8fafc;">
          <button
            @click="showSubmissionCode = !showSubmissionCode"
            class="text-xs text-blue-600 hover:underline"
          >
            {{ showSubmissionCode ? 'Hide Code' : 'View Code' }}
          </button>
          <button
            @click="code = sub.code; language = sub.language; activeTab = 'description'"
            class="text-xs text-green-600 hover:underline"
          >
            Load into Editor →
          </button>
        </div>

        <!-- Code viewer -->
        <pre
          v-if="showSubmissionCode"
          class="text-xs font-mono p-4 overflow-x-auto border-t border-gray-100"
          style="background:#1e1e1e; color:#d4d4d4; max-height:200px;"
        >{{ sub.code }}</pre>
      </div>
    </div>
  </div>
</div>
        </div>
      </div>

      <!-- RIGHT PANEL: Monaco Editor -->
      <div class="flex-1 flex flex-col overflow-hidden" style="background:#1e1e1e;">
        <!-- Toolbar -->
        <div
          class="flex items-center justify-between px-4 py-2 flex-shrink-0"
          style="background:#2d2d2d; border-bottom:1px solid #3d3d3d;"
        >
          <span class="text-xs text-gray-400">
            {{ languages.find(l => l.value === language)?.label }} Solution
          </span>
          <button
            @click="code = defaultCode[language] ?? ''"
            class="text-xs text-gray-500 hover:text-gray-300 transition px-2 py-1 rounded hover:bg-gray-700"
          >
            Reset template
          </button>
        </div>

        <!-- Editor -->
        <VueMonacoEditor
          v-model:value="code"
          :language="monacoLanguage"
          theme="vs-dark"
          :options="editorOptions"
          class="flex-1"
          style="min-height: 0;"
        />
      </div>
    </div>
  </div>
</template>