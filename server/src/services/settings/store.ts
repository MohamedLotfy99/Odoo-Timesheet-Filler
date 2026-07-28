import type { AppSettings } from '../../shared/types'
import { DEFAULT_SETTINGS } from '../../shared/defaults'
import { pool } from '../../db/pool'
import { encrypt, decrypt } from '../../lib/crypto'

interface SettingsRow {
  encrypted_gemini_api_key: string
  provider: 'webSpeech' | 'gemini'
  gemini_model: string
  prompt_template: string
  theme: 'system' | 'light' | 'dark'
}

export async function get(db: string, username: string): Promise<AppSettings> {
  const { rows } = await pool.query<SettingsRow>(
    `SELECT * FROM user_settings WHERE db = $1 AND username = $2`,
    [db, username]
  )
  if (!rows.length) {
    return DEFAULT_SETTINGS
  }
  const row = rows[0]
  return {
    theme: row.theme,
    transcription: {
      provider: row.provider,
      geminiApiKey: row.encrypted_gemini_api_key ? decrypt(row.encrypted_gemini_api_key) : '',
      geminiModel: row.gemini_model,
      promptTemplate: row.prompt_template
    }
  }
}

export async function set(db: string, username: string, settings: AppSettings): Promise<void> {
  const encryptedKey = settings.transcription.geminiApiKey ? encrypt(settings.transcription.geminiApiKey) : ''
  await pool.query(
    `INSERT INTO user_settings (db, username, encrypted_gemini_api_key, provider, gemini_model, prompt_template, theme)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (db, username) DO UPDATE SET
       encrypted_gemini_api_key = EXCLUDED.encrypted_gemini_api_key,
       provider = EXCLUDED.provider,
       gemini_model = EXCLUDED.gemini_model,
       prompt_template = EXCLUDED.prompt_template,
       theme = EXCLUDED.theme`,
    [
      db,
      username,
      encryptedKey,
      settings.transcription.provider,
      settings.transcription.geminiModel,
      settings.transcription.promptTemplate,
      settings.theme
    ]
  )
}
