import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server } from 'socket.io'
import connectDB from './config/db'
import authRoutes from './routes/auth.routes'
import problemsRoutes from './routes/problems.routes'
import codeRoutes from './routes/code.routes'
import submissionsRoutes from './routes/submissions.routes'
import { setupInterviewSocket } from './sockets/interview.socket'
import sessionsRoutes from './routes/sessions.routes'

const app = express()
const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
})

const PORT = process.env.PORT || 5000

connectDB()

app.use(cors({ origin: process.env.CLIENT_URL }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/api/auth', authRoutes)
app.use('/api/problems', problemsRoutes)
app.use('/api/code', codeRoutes)
app.use('/api/submissions', submissionsRoutes)
app.use('/api/sessions', sessionsRoutes)

app.get('/health', (req, res) => {
  res.json({ status: 'PrepForge backend is running!', timestamp: new Date().toISOString() })
})

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` })
})

// Setup Socket.io
setupInterviewSocket(io)

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`Socket.io ready`)
})