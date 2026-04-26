import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import connectDB from './config/db'
import authRoutes from './routes/auth.routes'
import problemsRoutes from './routes/problems.routes'
import codeRoutes from './routes/code.routes'

const app = express()
const PORT = process.env.PORT || 5000

connectDB()

app.use(cors({ origin: process.env.CLIENT_URL }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/api/auth', authRoutes)
app.use('/api/problems', problemsRoutes)
app.use('/api/code', codeRoutes)

app.get('/health', (req, res) => {
  res.json({ status: 'PrepForge backend is running!', timestamp: new Date().toISOString() })
})

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})