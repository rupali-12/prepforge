<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { VueMonacoEditor } from '@guolao/vue-monaco-editor'
import { useProblemsStore } from '../../stores/problems.store'
import { problemsService } from '../../services/problems.service'
import type { TestResult } from '../../types/problem.types'

const route = useRoute()
const store = useProblemsStore()

const language = ref('javascript')
const isRunning = ref(false)
const testResults = ref<TestResult[]>([])
const runError = ref('')
const currentHintLevel = ref(0)
const activeTab = ref<'description' | 'hints' | 'results'>('description')

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
// Input is available via stdin
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

// Monaco language mapping
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

// Initialize code with default
const code = ref(defaultCode['javascript'])

// When language changes — update code to default for that language
const onLanguageChange = (lang: string) => {
  language.value = lang
  code.value = defaultCode[lang] ?? `// Write your ${lang} solution here\n`
}

const problem = computed(() => store.currentProblem)

onMounted(async () => {
  await store.fetchProblemBySlug(route.params.slug as string)
})

const difficultyColor = (d: string) => {
  const map: Record<string, string> = {
    easy: 'text-green-600 bg-green-50 border-green-200',
    medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    hard: 'text-red-600 bg-red-50 border-red-200',
  }
  return map[d] ?? ''
}

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

const getHint = async () => {
  if (!problem.value || currentHintLevel.value >= 3) return
  const nextLevel = currentHintLevel.value + 1
  try {
    await problemsService.getHint(problem.value._id, nextLevel)
    currentHintLevel.value = nextLevel
    activeTab.value = 'hints'
  } catch {
    activeTab.value = 'hints'
  }
}

const passedCount = computed(() => testResults.value.filter((r) => r.passed).length)
const allPassed = computed(() => testResults.value.length > 0 && passedCount.value === testResults.value.length)

// Editor options — exactly like LeetCode
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
    <!-- Top navbar — dark like LeetCode -->
    <nav class="flex items-center justify-between px-4 py-2.5 border-b flex-shrink-0"
      style="background:#1a1a1a; border-color:#333;">
      <div class="flex items-center gap-4">
        <router-link to="/problems"
          class="text-sm text-gray-400 hover:text-white transition flex items-center gap-1">
          ← Problems
        </router-link>
        <div class="w-px h-4 bg-gray-700"></div>
        <span v-if="problem" class="text-sm font-medium text-white">{{ problem.title }}</span>
        <span v-if="problem"
          :class="['text-xs font-medium px-2 py-0.5 rounded-full capitalize', difficultyColor(problem.difficulty)]">
          {{ problem.difficulty }}
        </span>
      </div>

      <div class="flex items-center gap-3">
        <!-- Language selector -->
        <select
          :value="language"
          @change="onLanguageChange(($event.target as HTMLSelectElement).value)"
          class="text-sm rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
          style="background:#2d2d2d; border: 1px solid #444;"
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

        <!-- Hint button -->
        <button
          @click="getHint"
          :disabled="currentHintLevel >= 3"
          class="text-sm px-3 py-1.5 rounded transition disabled:opacity-40"
          style="background:#2d2d2d; border:1px solid #ca8a04; color:#fbbf24;"
        >
          💡 Hint {{ currentHintLevel }}/3
        </button>

        <!-- Run Code button — green like LeetCode -->
        <button
          @click="runCode"
          :disabled="isRunning"
          class="text-sm font-semibold px-5 py-1.5 rounded transition flex items-center gap-2 disabled:opacity-60"
          style="background:#1a7f4b; color:white;"
        >
          <svg v-if="!isRunning" xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
          <span v-if="isRunning" class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          {{ isRunning ? 'Running...' : 'Run Code' }}
        </button>
      </div>
    </nav>

    <!-- Main split layout -->
    <div class="flex flex-1 overflow-hidden">

      <!-- LEFT PANEL: Problem description -->
      <div class="flex flex-col border-r overflow-hidden"
        style="width:42%; background:#ffffff; border-color:#e5e7eb;">

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
                : 'border-transparent text-gray-500 hover:text-gray-700'
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
        </div>

        <!-- Tab content -->
        <div class="flex-1 overflow-y-auto p-5">

          <!-- Loading -->
          <div v-if="store.isLoading" class="animate-pulse space-y-4">
            <div class="h-6 bg-gray-200 rounded w-2/3"></div>
            <div class="h-4 bg-gray-100 rounded w-1/4"></div>
            <div class="h-4 bg-gray-100 rounded w-full mt-4"></div>
            <div class="h-4 bg-gray-100 rounded w-full"></div>
            <div class="h-4 bg-gray-100 rounded w-3/4"></div>
          </div>

          <!-- DESCRIPTION -->
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
                <li v-for="c in problem.constraints" :key="c"
                  class="flex items-start gap-2 text-sm text-gray-600">
                  <span class="text-gray-400 mt-0.5 flex-shrink-0">•</span>
                  <code class="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">{{ c }}</code>
                </li>
              </ul>
            </div>

            <div class="flex flex-wrap gap-1.5">
              <span v-for="tag in problem.tags" :key="tag"
                class="text-xs px-2.5 py-1 rounded-full border"
                style="background:#eff6ff; color:#1d4ed8; border-color:#bfdbfe;">
                {{ tag }}
              </span>
            </div>
          </div>

          <!-- HINTS -->
          <div v-else-if="activeTab === 'hints'">
            <div v-if="currentHintLevel === 0" class="text-center py-16">
              <div class="text-5xl mb-4">💡</div>
              <p class="text-gray-500 text-sm mb-6">
                Stuck? Hints will guide you without giving away the answer.
              </p>
              <button @click="getHint"
                class="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 text-sm font-medium px-6 py-2.5 rounded-lg transition">
                Reveal First Hint
              </button>
            </div>

            <div v-else class="space-y-3">
              <div v-for="level in currentHintLevel" :key="level"
                class="rounded-lg p-4 border"
                style="background:#fffbeb; border-color:#fde68a;">
                <p class="text-xs font-semibold text-yellow-700 mb-2">Hint {{ level }} of 3</p>
                <p class="text-sm text-gray-700 leading-relaxed">
                  {{ problem?.hints?.find(h => h.level === level)?.content }}
                </p>
              </div>

              <button v-if="currentHintLevel < 3" @click="getHint"
                class="w-full py-2.5 rounded-lg text-sm transition border"
                style="background:#fffbeb; border-color:#fde68a; color:#92400e;">
                Reveal Hint {{ currentHintLevel + 1 }}
              </button>
              <p v-else class="text-center text-xs text-gray-400 py-2">
                All hints revealed — you've got this! 💪
              </p>
            </div>
          </div>

          <!-- RESULTS -->
          <div v-else-if="activeTab === 'results'">
            <!-- Running spinner -->
            <div v-if="isRunning" class="text-center py-16">
              <div class="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p class="text-sm text-gray-500">Executing your code...</p>
              <p class="text-xs text-gray-400 mt-1">This may take a few seconds</p>
            </div>

            <!-- Error -->
            <div v-else-if="runError"
              class="rounded-lg p-4 border text-sm"
              style="background:#fef2f2; border-color:#fecaca; color:#991b1b;">
              <p class="font-semibold mb-1">❌ Execution Error</p>
              <p>{{ runError }}</p>
            </div>

            <!-- Results -->
            <div v-else-if="testResults.length > 0" class="space-y-3">
              <!-- Summary banner -->
              <div :class="['rounded-lg p-4 border font-medium text-sm',
                allPassed
                  ? 'border-green-200 text-green-800'
                  : 'border-red-200 text-red-800']"
                :style="allPassed ? 'background:#f0fdf4' : 'background:#fef2f2'">
                <p class="text-base font-semibold">
                  {{ allPassed ? '✅ Accepted' : '❌ Wrong Answer' }}
                </p>
                <p class="text-xs mt-1 font-normal opacity-80">
                  {{ passedCount }} / {{ testResults.length }} test cases passed
                </p>
              </div>

              <!-- Each test case -->
              <div v-for="(result, i) in testResults" :key="i"
                class="rounded-lg border overflow-hidden">
                <!-- Test case header -->
                <div :class="['flex items-center justify-between px-4 py-2.5 text-xs font-semibold',
                  result.passed ? 'text-green-700' : 'text-red-700']"
                  :style="result.passed ? 'background:#f0fdf4; border-bottom:1px solid #bbf7d0' : 'background:#fef2f2; border-bottom:1px solid #fecaca'">
                  <span>{{ result.passed ? '✓ Test Case ' + (i + 1) + ' Passed' : '✗ Test Case ' + (i + 1) + ' Failed' }}</span>
                  <span class="font-normal text-gray-400">{{ result.executionTime }}s</span>
                </div>
                <!-- Test case details -->
                <div class="p-4 space-y-2 font-mono text-xs" style="background:#f9fafb;">
                  <div>
                    <span class="text-gray-500 font-sans font-medium">Input</span>
                    <div class="mt-1 bg-white rounded px-3 py-2 border border-gray-200 text-gray-700">{{ result.input }}</div>
                  </div>
                  <div>
                    <span class="text-gray-500 font-sans font-medium">Expected Output</span>
                    <div class="mt-1 bg-white rounded px-3 py-2 border border-gray-200 text-gray-700">{{ result.expected }}</div>
                  </div>
                  <div>
                    <span class="font-sans font-medium" :class="result.passed ? 'text-green-600' : 'text-red-600'">
                      Your Output
                    </span>
                    <div class="mt-1 rounded px-3 py-2 border text-gray-700"
                      :style="result.passed ? 'background:#f0fdf4; border-color:#bbf7d0' : 'background:#fef2f2; border-color:#fecaca'">
                      {{ result.output }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Empty state -->
            <div v-else class="text-center py-16">
              <div class="text-4xl mb-4">▶</div>
              <p class="text-sm text-gray-500">Click "Run Code" to test your solution</p>
              <p class="text-xs text-gray-400 mt-1">Results will appear here</p>
            </div>
          </div>

        </div>
      </div>

      <!-- RIGHT PANEL: Monaco Editor — full dark like LeetCode -->
      <div class="flex-1 flex flex-col overflow-hidden" style="background:#1e1e1e;">
        <!-- Editor toolbar -->
        <div class="flex items-center justify-between px-4 py-2 flex-shrink-0"
          style="background:#2d2d2d; border-bottom:1px solid #3d3d3d;">
          <span class="text-xs text-gray-400">
            {{ languages.find(l => l.value === language)?.label }} Solution
          </span>
          <button
            @click="code = defaultCode[language] ?? ''"
            class="text-xs text-gray-500 hover:text-gray-300 transition"
          >
            Reset to template
          </button>
        </div>

        <!-- Monaco Editor -->
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