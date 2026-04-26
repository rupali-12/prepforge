import { Router } from 'express'
import {
  getProblems,
  getProblemBySlug,
  getHint,
  createProblem,
} from '../controllers/problems.controller'
import { protect, adminOnly } from '../middlewares/auth.middleware'

const router = Router()

router.get('/', protect, getProblems)
router.get('/:slug', protect, getProblemBySlug)
router.get('/:id/hint', protect, getHint)
router.post('/', protect, adminOnly, createProblem)

export default router