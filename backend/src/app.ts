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
import sessionsRoutes from './routes/sessions.routes'
import { setupInterviewSocket } from './sockets/interview.socket'

const app = express()
const httpServer = createServer(app)

// ── CORS ─────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      process.env.FRONTEND_URL,
      'http://localhost:5173',
      'http://localhost:4173',
      'https://prepforge-git-main-rupali12s-projects.vercel.app',
      'https://prepforge-m1whx516u-rupali12s-projects.vercel.app'
    ].filter(Boolean) as string[]

    if (!origin || allowed.includes(origin)) {
      callback(null, true)
    } else {
      console.warn(`CORS blocked for origin: ${origin}`)
      callback(new Error(`CORS blocked: ${origin}`))
    }
  },
  credentials: true,
}))

// ── Socket.io ─────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: [
      'http://localhost:5173',
      process.env.FRONTEND_URL || 'https://prepforge-ivory.vercel.app',
      'https://prepforge-git-main-rupali12s-projects.vercel.app',
      'https://prepforge-m1whx516u-rupali12s-projects.vercel.app'
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  },
})

const PORT = process.env.PORT || 5000

// ── Database ──────────────────────────────────────────
connectDB()

// ── Middlewares ───────────────────────────────────────
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ── Routes ────────────────────────────────────────────
app.use('/api/auth', authRoutes)
app.use('/api/problems', problemsRoutes)
app.use('/api/code', codeRoutes)
app.use('/api/submissions', submissionsRoutes)
app.use('/api/sessions', sessionsRoutes)

// ── Health check ──────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'PrepForge backend is running!',
    env: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  })
})

// ── 404 handler ───────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` })
})

// ── Socket.io setup ───────────────────────────────────
setupInterviewSocket(io)

// ── Start server ──────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`Environment: ${process.env.NODE_ENV}`)
  console.log(`Client URL: ${process.env.FRONTEND_URL}`)
  console.log('Socket.io ready')
})