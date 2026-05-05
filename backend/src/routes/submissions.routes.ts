import { Router } from 'express'
import {
  submitSolution,
  getUserSubmissions,
  getSubmissionById,
  getSubmissionsByProblem,
} from '../controllers/submissions.controller'
import { protect } from '../middlewares/auth.middleware'

const router = Router()

router.post('/submit', protect, submitSolution)
router.get('/me', protect, getUserSubmissions)
router.get('/:id', protect, getSubmissionById)
router.get('/problem/:problemId', protect, getSubmissionsByProblem)

export default router