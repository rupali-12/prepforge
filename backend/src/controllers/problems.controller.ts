import { Request, Response } from 'express'
import Problem from '../models/Problem.model'
import { AuthRequest } from '../middlewares/auth.middleware'

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
    const { level } = req.query

    const hintLevel = parseInt(level as string) || 1

    const problem = await Problem.findById(id).select('hints')
    if (!problem) {
      res.status(404).json({ success: false, message: 'Problem not found' })
      return
    }

    const hint = problem.hints.find((h) => h.level === hintLevel)
    if (!hint) {
      res.status(404).json({ success: false, message: 'Hint not found' })
      return
    }

    res.status(200).json({ success: true, data: { hint } })
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