import { Router } from 'express'
import { requireSession } from '../middleware/requireSession'
import { GeminiTranscriptionProvider } from '../services/ai/geminiTranscription'
import { get as getSettings } from '../services/settings/store'
import { DEFAULT_TRANSCRIPTION_PROMPT } from '../shared/defaults'

export const voiceRouter = Router()

function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

voiceRouter.post('/transcribe', requireSession, async (req, res) => {
  const { audioBase64, mimeType } = req.body ?? {}
  if (!audioBase64 || !mimeType) {
    res.status(400).json({ message: 'audioBase64 and mimeType are required.' })
    return
  }

  const { session } = req.odoo!
  const settings = await getSettings(session.db, session.username)
  const promptText = settings.transcription.promptTemplate || DEFAULT_TRANSCRIPTION_PROMPT
  const model = settings.transcription.geminiModel || 'gemini-3.6-flash'
  const today = todayIso()

  const personalKey = settings.transcription.geminiApiKey
  const sharedKey = process.env.GEMINI_API_KEY

  let lastError: Error | null = null

  if (personalKey) {
    try {
      const provider = new GeminiTranscriptionProvider(personalKey, model)
      const result = await provider.transcribeStructured(audioBase64, mimeType, today, promptText)
      res.json(result)
      return
    } catch (err) {
      lastError = err instanceof Error ? err : new Error('Transcription failed.')
    }
  }

  if (sharedKey) {
    try {
      const provider = new GeminiTranscriptionProvider(sharedKey, model)
      const result = await provider.transcribeStructured(audioBase64, mimeType, today, promptText)
      res.json(result)
      return
    } catch (err) {
      lastError = err instanceof Error ? err : new Error('Transcription failed.')
    }
  }

  if (!personalKey && !sharedKey) {
    res.status(400).json({ message: 'No Gemini API key configured (personal or shared).' })
    return
  }

  res.status(502).json({ message: lastError?.message ?? 'Gemini transcription failed.' })
})
