import { GoogleGenerativeAI } from '@google/generative-ai'

const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not set in .env')
  return new GoogleGenerativeAI(apiKey)
}

const getModel = () => {
  const genAI = getGenAI()
  return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Retry wrapper — retries once after 40 seconds if rate limited
export const generateWithRetry = async (prompt: string, retries = 1): Promise<string> => {
  try {
    const model = getModel()
    const result = await model.generateContent(prompt)
    const response = await result.response
    return response.text().trim()
  } catch (error: unknown) {
    const err = error as { message?: string }
    const isRateLimit =
      err.message?.includes('429') ||
      err.message?.includes('quota') ||
      err.message?.includes('Too Many Requests')

    if (isRateLimit && retries > 0) {
      console.log('Rate limited — waiting 40 seconds before retry...')
      await sleep(40000)
      return generateWithRetry(prompt, retries - 1)
    }

    throw error
  }
}

// ─────────────────────────────────────────
// Generate AI Hint
// ─────────────────────────────────────────
export const generateAIHint = async (
  problemTitle: string,
  problemDescription: string,
  userCode: string,
  hintLevel: number
): Promise<string> => {
  const levelInstructions: Record<number, string> = {
    1: 'Give a very vague hint — just point them in a general direction. Do NOT mention any algorithm or data structure name. Maximum 2 sentences.',
    2: 'Give a moderate hint — you can mention the algorithm or data structure name but do NOT explain how to implement it. Maximum 3 sentences.',
    3: 'Give a detailed hint — explain the approach step by step but do NOT write any code. Maximum 5 sentences.',
  }

  const prompt = `You are a coding interview coach helping a student solve a problem.

Problem: ${problemTitle}
Description: ${problemDescription}

Student's current code:
\`\`\`
${userCode || 'No code written yet'}
\`\`\`

Hint Level ${hintLevel}/3: ${levelInstructions[hintLevel]}

Rules:
- NEVER give the complete solution
- NEVER write actual code
- Be encouraging and supportive
- Focus on thinking process

Provide only the hint text, no extra formatting:`

  return generateWithRetry(prompt)
}

// ─────────────────────────────────────────
// AI Code Review
// ─────────────────────────────────────────
export interface AIReview {
  score: number
  timeComplexity: string
  spaceComplexity: string
  strengths: string[]
  improvements: string[]
  optimizedApproach: string
  overallFeedback: string
}

export const reviewCode = async (
  problemTitle: string,
  problemDescription: string,
  code: string,
  language: string,
  testsPassed: boolean
): Promise<AIReview> => {
  const prompt = `You are a senior software engineer reviewing code for a technical interview.

Problem: ${problemTitle}
Description: ${problemDescription}

Candidate's ${language} solution:
\`\`\`${language}
${code}
\`\`\`

Tests passed: ${testsPassed ? 'Yes' : 'No'}

Respond with ONLY a valid JSON object (no markdown, no backticks):
{
  "score": <number 0-100>,
  "timeComplexity": "<e.g. O(n)>",
  "spaceComplexity": "<e.g. O(1)>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>"],
  "optimizedApproach": "<one paragraph>",
  "overallFeedback": "<2-3 sentences>"
}`

  try {
    const text = await generateWithRetry(prompt)
    const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim()
    return JSON.parse(cleaned) as AIReview
  } catch (error: unknown) {
    const err = error as { message?: string }

    // If rate limited — return a meaningful fallback instead of crashing
    if (err.message?.includes('429') || err.message?.includes('quota')) {
      console.log('AI review rate limited — returning fallback review')
      return {
        score: testsPassed ? 75 : 40,
        timeComplexity: 'Analyze manually',
        spaceComplexity: 'Analyze manually',
        strengths: [
          testsPassed ? 'All test cases passed successfully' : 'Code submitted',
          'Solution compiles and runs without errors',
        ],
        improvements: [
          'Consider analyzing time and space complexity',
          'Add comments to explain your approach',
          'Think about edge cases',
        ],
        optimizedApproach:
          'AI review is temporarily unavailable due to rate limits. Please try submitting again in a few minutes for detailed feedback.',
        overallFeedback:
          testsPassed
            ? 'Great job passing all test cases! AI detailed review will be available shortly.'
            : 'Keep working on your solution. AI feedback will be available shortly.',
      }
    }

    // JSON parse failed — return fallback
    return {
      score: testsPassed ? 70 : 30,
      timeComplexity: 'Unable to determine',
      spaceComplexity: 'Unable to determine',
      strengths: ['Code submitted successfully'],
      improvements: ['Consider edge cases', 'Add comments to explain your approach'],
      optimizedApproach: 'Review your solution for potential optimizations.',
      overallFeedback: 'Good attempt! Keep practicing to improve your solution quality.',
    }
  }
}

// ─────────────────────────────────────────
// Mock Interview Response
// ─────────────────────────────────────────
export const generateInterviewResponse = async (
  problemTitle: string,
  problemDescription: string,
  conversationHistory: { role: string; content: string }[],
  userMessage: string,
  userCode: string
): Promise<string> => {
  const historyText = conversationHistory
    .slice(-8)
    .map((m) => `${m.role === 'user' ? 'Candidate' : 'Interviewer'}: ${m.content}`)
    .join('\n\n')

  const prompt = `You are a senior software engineer at Google conducting a live technical interview.

Problem: ${problemTitle}
${problemDescription}

Current candidate code:
\`\`\`
${userCode || 'No code written yet'}
\`\`\`

Recent conversation:
${historyText || 'Interview just started'}

Candidate just said: "${userMessage}"

Respond as the interviewer in 1-3 sentences. Be conversational, ask follow-up questions, probe their thinking. Do NOT give away the solution. Vary your responses based on what they said.`

  try {
    console.log('Calling Gemini for interview response...')
    const text = await generateWithRetry(prompt)
    console.log('Gemini interview response:', text.substring(0, 100))
    return text
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('generateInterviewResponse failed:', err.message)

    // Varied fallback responses so it doesn't feel robotic
    const fallbacks = [
      "Interesting! Can you explain the time complexity of that approach?",
      "Good thinking. What data structure are you planning to use and why?",
      "Walk me through how your solution handles edge cases.",
      "That makes sense. How would you optimize this if the input was very large?",
      "I see your approach. Can you talk me through the space complexity?",
      "Good. Now can you start writing some code for that approach?",
      "What happens if the input array is empty? Have you considered that?",
    ]
    return fallbacks[Math.floor(Math.random() * fallbacks.length)]
  }
}