import { Request, Response } from 'express'
import Session from '../models/Session.model'
import Problem from '../models/Problem.model'
import { AuthRequest } from '../middlewares/auth.middleware'

// POST /api/sessions/start
export const startSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { problemId, duration, language } = req.body
    const userId = req.user?.userId

    if (!problemId) {
      res.status(400).json({ success: false, message: 'problemId is required' })
      return
    }

    const problem = await Problem.findById(problemId)
    if (!problem) {
      res.status(404).json({ success: false, message: 'Problem not found' })
      return
    }

    // Check if user has an active session
    const activeSession = await Session.findOne({ userId, status: 'active' })
    if (activeSession) {
      // Abandon old session
      await Session.findByIdAndUpdate(activeSession._id, { status: 'abandoned' })
    }

    const session = await Session.create({
      userId,
      problemId,
      duration: duration || 30,
      language: language || 'javascript',
      status: 'active',
      startedAt: new Date(),
    })

    res.status(201).json({
      success: true,
      data: { session: { id: session._id, duration: session.duration, language: session.language } },
    })
  } catch (error) {
    console.error('Start session error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// GET /api/sessions/me
export const getMySessions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sessions = await Session.find({ userId: req.user?.userId })
      .populate('problemId', 'title slug difficulty')
      .sort({ createdAt: -1 })
      .limit(20)

    res.status(200).json({ success: true, data: { sessions } })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// GET /api/sessions/:id
export const getSessionById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const session = await Session.findOne({
      _id: req.params.id,
      userId: req.user?.userId,
    }).populate('problemId', 'title slug difficulty description')

    if (!session) {
      res.status(404).json({ success: false, message: 'Session not found' })
      return
    }

    res.status(200).json({ success: true, data: { session } })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}