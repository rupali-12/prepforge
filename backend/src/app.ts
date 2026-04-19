import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import connectDB from './config/db'
import authRoutes from './routes/auth.routes'
const app = express()
const PORT = process.env.PORT || 5000

// Connect Database
connectDB()

// Middlewares
app.use(cors({ origin: process.env.CLIENT_URL }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/api/auth', authRoutes)

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'PrepForge backend is running!',
    timestamp: new Date().toISOString(),
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})