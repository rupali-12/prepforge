import { Request, Response } from 'express'
import Problem from '../models/Problem.model'
import { AuthRequest } from '../middlewares/auth.middleware'
import { generateAIHint } from '../services/ai.service'

// GET /api/problems
export const getProblems = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      difficulty,
      tag,
      company,
      search,
      page = '1',
      limit = '20',
    } = req.query

    const filter: any = { isActive: true }

    if (difficulty) filter.difficulty = difficulty
    if (tag) filter.tags = { $in: [tag] }
    if (company) filter.companies = { $in: [company] }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search as string, 'i')] } },
      ]
    }

    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const skip = (pageNum - 1) * limitNum

    const [problems, total] = await Promise.all([
      Problem.find(filter)
        .select('-solution -testCases -hints')
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limitNum),
      Problem.countDocuments(filter),
    ])

    res.status(200).json({
      success: true,
      data: {
        problems,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    })
  } catch (error) {
    console.error('Get problems error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// GET /api/problems/:slug
export const getProblemBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const problem = await Problem.findOne({
      slug: req.params.slug,
      isActive: true,
    }).select('-solution -testCases')

    if (!problem) {
      res.status(404).json({ success: false, message: 'Problem not found' })
      return
    }

    res.status(200).json({ success: true, data: { problem } })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// GET /api/problems/:id/hint
export const getHint = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { level, code } = req.query

    const hintLevel = parseInt(level as string) || 1

    if (hintLevel < 1 || hintLevel > 3) {
      res.status(400).json({ success: false, message: 'Hint level must be 1, 2, or 3' })
      return
    }

    const problem = await Problem.findById(id).select('title description hints')
    if (!problem) {
      res.status(404).json({ success: false, message: 'Problem not found' })
      return
    }

    console.log(`Generating AI hint level ${hintLevel} for: ${problem.title}`)

    // Try AI hint first
    try {
      const aiHintContent = await generateAIHint(
        problem.title,
        problem.description,
        (code as string) || '',
        hintLevel
      )

      res.status(200).json({
        success: true,
        data: {
          hint: {
            level: hintLevel,
            content: aiHintContent,
            isAI: true,
          },
        },
      })
    } catch (aiError) {
      // Fallback to static hints if AI fails
      console.log('AI hint failed, falling back to static hint')
      const staticHint = problem.hints.find((h) => h.level === hintLevel)

      if (!staticHint) {
        res.status(404).json({ success: false, message: 'Hint not found' })
        return
      }

      res.status(200).json({
        success: true,
        data: {
          hint: {
            level: hintLevel,
            content: staticHint.content,
            isAI: false,
          },
        },
      })
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// POST /api/problems (Admin only)
export const createProblem = async (req: Request, res: Response): Promise<void> => {
  try {
    const problem = await Problem.create(req.body)
    res.status(201).json({ success: true, data: { problem } })
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message })
  }
}