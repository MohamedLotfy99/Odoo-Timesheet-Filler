import express from 'express'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import { authRouter } from './routes/auth'
import { timesheetsRouter } from './routes/timesheets'
import { voiceRouter } from './routes/voice'
import { settingsRouter } from './routes/settings'
import { historyRouter } from './routes/history'
import { odooRouter } from './routes/odoo'

export const app = express()

app.use(helmet())
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
    credentials: true
  })
)
app.use(cookieParser())
app.use(express.json({ limit: '50mb' }))

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

app.use('/api/auth', authRouter)
app.use('/api/timesheets', timesheetsRouter)
app.use('/api/voice', voiceRouter)
app.use('/api/settings', settingsRouter)
app.use('/api/history', historyRouter)
app.use('/api/odoo', odooRouter)
