export interface OdooCredentials {
  url: string
  db: string
  username: string
  /** Either the account password or an Odoo API key — Odoo's external API accepts both. */
  secret: string
}

export interface OdooSession {
  url: string
  db: string
  username: string
  uid: number
}

export interface TimesheetRowInput {
  id: string
  url: string
  description: string
  duration: string // HH:MM
  date: string // YYYY-MM-DD
}

export interface TimesheetRowResult {
  id: string
  success: boolean
  error?: string
  taskName?: string
}

export interface HistoryEntry {
  id: string
  db: string
  username: string
  odooRecordId: number
  taskUrl: string
  taskName: string
  description: string
  duration: string // HH:MM
  date: string // YYYY-MM-DD
  createdAt: string // ISO timestamp
  missingInOdoo?: boolean
}

export interface TranscriptionSettings {
  provider: 'webSpeech' | 'gemini'
  geminiApiKey: string
  geminiModel: string
  promptTemplate: string
}

export type Theme = 'system' | 'light' | 'dark'

export interface AppSettings {
  transcription: TranscriptionSettings
  theme: Theme
}

/** Structured output from Gemini when a recording is transcribed with date/duration extraction. */
export interface VoiceExtraction {
  description: string
  date: string | null
  duration: string | null
}
