import { Request, Response } from 'express'
import axios from 'axios'
import Problem from '../models/Problem.model'

const JDOODLE_URL = 'https://api.jdoodle.com/v1/execute'

const LANGUAGE_MAP: Record<string, { language: string; versionIndex: string }> = {
  javascript: { language: 'nodejs',      versionIndex: '4' },
  python:     { language: 'python3',     versionIndex: '4' },
  java:       { language: 'java',        versionIndex: '4' },
  cpp:        { language: 'cpp17',       versionIndex: '1' },
  c:          { language: 'c',           versionIndex: '5' },
  typescript: { language: 'typescript',  versionIndex: '1' },
  go:         { language: 'go',          versionIndex: '4' },
  rust:       { language: 'rust',        versionIndex: '4' },
  ruby:       { language: 'ruby',        versionIndex: '4' },
  kotlin:     { language: 'kotlin',      versionIndex: '3' },
  swift:      { language: 'swift',       versionIndex: '4' },
  php:        { language: 'php',         versionIndex: '4' },
  csharp:     { language: 'csharp',      versionIndex: '4' },
}

interface JDoodleResponse {
  output: string
  statusCode: number
  memory: string
  cpuTime: string
  error?: string
}

interface ExecuteError {
  message?: string
  response?: {
    data?: unknown
    status?: number
  }
}

const executeCode = async (
  language: string,
  versionIndex: string,
  code: string,
  stdin: string
): Promise<{ stdout: string; stderr: string; cpuTime: string }> => {
  const payload = {
    clientId:     process.env.JDOODLE_CLIENT_ID,
    clientSecret: process.env.JDOODLE_CLIENT_SECRET,
    script:       code,
    stdin:        stdin,
    language:     language,
    versionIndex: versionIndex,
  }

  console.log(`Executing ${language} code...`)

  const response = await axios.post<JDoodleResponse>(JDOODLE_URL, payload, {
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
  })

  const data = response.data
  console.log('JDoodle response:', JSON.stringify(data, null, 2))

  // JDoodle returns statusCode 200 for success, 400+ for errors
  if (data.statusCode !== 200) {
    return {
      stdout: '',
      stderr: data.output || 'Execution failed',
      cpuTime: '0',
    }
  }

  return {
    stdout: data.output?.trim() ?? '',
    stderr: '',
    cpuTime: data.cpuTime ?? '0',
  }
}

// POST /api/code/run
export const runCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, language, problemId } = req.body

    if (!code || !language) {
      res.status(400).json({ success: false, message: 'Code and language are required' })
      return
    }

    const langConfig = LANGUAGE_MAP[language]
    if (!langConfig) {
      res.status(400).json({
        success: false,
        message: `Language "${language}" not supported. Supported: ${Object.keys(LANGUAGE_MAP).join(', ')}`,
      })
      return
    }

    const problem = await Problem.findById(problemId).select('testCases title')
    if (!problem) {
      res.status(404).json({ success: false, message: 'Problem not found' })
      return
    }

    const visibleTestCases = problem.testCases.filter((tc) => !tc.isHidden)
    console.log(`\nRunning ${visibleTestCases.length} test cases for: ${problem.title}`)

    // Run sequentially to respect rate limits
    const results = []

    for (let i = 0; i < visibleTestCases.length; i++) {
      const tc = visibleTestCases[i]

      try {
        console.log(`\n--- Test case ${i + 1} ---`)
        console.log('Input:', tc.input)
        console.log('Expected:', tc.expected)

        const { stdout, stderr, cpuTime } = await executeCode(
          langConfig.language,
          langConfig.versionIndex,
          code,
          tc.input
        )

        console.log('stdout:', stdout)
        console.log('stderr:', stderr)

        const output = stderr ? `Error: ${stderr.split('\n')[0]}` : stdout
        const passed = stdout.trim() === tc.expected.trim()

        console.log('passed:', passed)

        results.push({
          input: tc.input,
          expected: tc.expected,
          output: output || '(no output)',
          passed,
          executionTime: parseFloat(cpuTime) || 0,
        })

      } catch (err: unknown) {
        const error = err as ExecuteError
        console.error(`Test case ${i + 1} error:`, error.message)
        console.error('Details:', error.response?.data)

        results.push({
          input: tc.input,
          expected: tc.expected,
          output: `Execution error: ${error.message ?? 'Unknown'}`,
          passed: false,
          executionTime: 0,
        })
      }
    }

    res.status(200).json({
      success: true,
      data: {
        results,
        allPassed: results.every((r) => r.passed),
        passedCount: results.filter((r) => r.passed).length,
        totalCount: results.length,
      },
    })

  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('Run code error:', err.message)
    res.status(500).json({ success: false, message: 'Code execution failed' })
  }
}