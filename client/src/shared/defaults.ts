import type { AppSettings } from './types'

export const DEFAULT_TRANSCRIPTION_PROMPT =
  'Transcribe this audio, then translate the full result into English. The speaker may mix Arabic ' +
  'and English words in the same sentence — understand the complete meaning regardless of language, ' +
  'and write a complete English description of what was said. Do not include any Arabic script or ' +
  'words in the output — English only. Output only the description text, no commentary.'

export const DEFAULT_SETTINGS: AppSettings = {
  transcription: {
    provider: 'gemini',
    geminiApiKey: '',
    geminiModel: 'gemini-3.6-flash',
    promptTemplate: DEFAULT_TRANSCRIPTION_PROMPT
  },
  theme: 'system'
}
