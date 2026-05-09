import { Router } from 'express'
import { startSession, getMySessions, getSessionById } from '../controllers/sessions.controller'
import { protect } from '../middlewares/auth.middleware'

const router = Router()

router.post('/start', protect, startSession)
router.get('/me', protect, getMySessions)
router.get('/:id', protect, getSessionById)

export default router