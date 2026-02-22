import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import mongoose from 'mongoose'

dotenv.config()

const PORT = Number(process.env.PORT ?? 3001)
const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/maintain'

mongoose.set('strictQuery', true)

const app = express()

app.use(
  cors({
    origin: ['http://127.0.0.1:5173', 'http://localhost:5173'],
  }),
)
app.use(express.json())

app.get('/api/health', (_req, res) => {
  const state = mongoose.connection.readyState
  res.json({
    ok: true,
    db: {
      state,
      connected: state === 1,
    },
  })
})

app.listen(PORT, () => {
  console.log(`Backend listening on http://127.0.0.1:${PORT}`)
})

mongoose.connect(MONGODB_URI).then(
  () => {
    console.log('MongoDB connected')
  },
  (err) => {
    console.error('MongoDB connection error:', err)
  },
)

