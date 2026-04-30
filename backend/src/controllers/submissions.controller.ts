import { Request, Response } from 'express'
import Problem from '../models/Problem.model'
import Submission from '../models/Submission.model'
import User from '../models/User.model'
import { reviewCode } from '../services/ai.service'
import { AuthRequest } from '../middlewares/auth.middleware'

// POST /api/submissions/submit
export const submitSolution = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { code, language, problemId, testResults, allPassed } = req.body
    const userId = req.user?.userId

    if (!code || !language || !problemId) {
      res.status(400).json({ success: false, message: 'Code, language and problemId are required' })
      return
    }

    const problem = await Problem.findById(problemId)
    if (!problem) {
      res.status(404).json({ success: false, message: 'Problem not found' })
      return
    }

    console.log(`Submitting solution for: ${problem.title} by user: ${userId}`)
    console.log('Getting AI code review...')

    // Get AI code review
    const aiReview = await reviewCode(
      problem.title,
      problem.description,
      code,
      language,
      allPassed
    )

    console.log('AI Review score:', aiReview.score)

    // Determine status
    const status = allPassed ? 'accepted' : 'wrong_answer'

    // Save submission to DB
    const submission = await Submission.create({
      userId,
      problemId,
      code,
      language,
      status,
      testResults: testResults || [],
      aiReview,
      executionTime: 0,
    })

    // Update user stats if accepted
    if (allPassed && userId) {
      await User.findByIdAndUpdate(userId, {
        $inc: { 'stats.problemsSolved': 1 },
        $set: { 'stats.lastActiveDate': new Date() },
      })
      console.log('User stats updated — problems solved incremented')
    }

    res.status(201).json({
      success: true,
      message: allPassed ? 'Solution accepted! 🎉' : 'Some test cases failed',
      data: {
        submission: {
          id: submission._id,
          status,
          aiReview,
          language,
          createdAt: submission.createdAt,
        },
      },
    })
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('Submit solution error:', err.message)
    res.status(500).json({ success: false, message: 'Submission failed' })
  }
}

// GET /api/submissions/me
export const getUserSubmissions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId

    const submissions = await Submission.find({ userId })
      .populate('problemId', 'title slug difficulty')
      .sort({ createdAt: -1 })
      .limit(50)

    res.status(200).json({
      success: true,
      data: { submissions },
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// GET /api/submissions/:id
export const getSubmissionById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const submission = await Submission.findOne({
      _id: req.params.id,
      userId: req.user?.userId,
    }).populate('problemId', 'title slug difficulty')

    if (!submission) {
      res.status(404).json({ success: false, message: 'Submission not found' })
      return
    }

    res.status(200).json({ success: true, data: { submission } })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}