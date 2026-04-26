import { Router } from 'express'
import { runCode } from '../controllers/code.controller'
import { protect } from '../middlewares/auth.middleware'

const router = Router()

router.post('/run', protect, runCode)

export default router