import { describe, expect, it } from 'vitest'
import { buildStructuredRequestBody, buildTranscriptionRequestBody } from './geminiTranscription'
import { DEFAULT_TRANSCRIPTION_PROMPT } from '../../shared/defaults'

describe('buildTranscriptionRequestBody', () => {
  it('embeds the mime type and base64 audio as inline_data', () => {
    const body = buildTranscriptionRequestBody('ZmFrZS1hdWRpbw==', 'audio/webm', DEFAULT_TRANSCRIPTION_PROMPT) as any
    const parts = body.contents[0].parts
    expect(parts[0].inline_data).toEqual({ mime_type: 'audio/webm', data: 'ZmFrZS1hdWRpbw==' })
  })

  it('passes the given prompt text through as the second part', () => {
    const body = buildTranscriptionRequestBody('abc', 'audio/webm', 'Custom prompt text') as any
    expect(body.contents[0].parts[1].text).toBe('Custom prompt text')
  })
})

describe('DEFAULT_TRANSCRIPTION_PROMPT', () => {
  it('instructs Gemini to translate mixed-language speech into English only', () => {
    expect(DEFAULT_TRANSCRIPTION_PROMPT).toMatch(/Arabic/)
    expect(DEFAULT_TRANSCRIPTION_PROMPT).toMatch(/English/)
    expect(DEFAULT_TRANSCRIPTION_PROMPT).toMatch(/translate/i)
  })
})

describe('buildStructuredRequestBody', () => {
  it('embeds the mime type and base64 audio as inline_data', () => {
    const body = buildStructuredRequestBody('ZmFrZS1hdWRpbw==', 'audio/webm', '2026-07-28', DEFAULT_TRANSCRIPTION_PROMPT) as any
    const parts = body.contents[0].parts
    expect(parts[0].inline_data).toEqual({ mime_type: 'audio/webm', data: 'ZmFrZS1hdWRpbw==' })
  })

  it("injects today's date into the prompt text", () => {
    const body = buildStructuredRequestBody('abc', 'audio/webm', '2026-07-28', 'Custom prompt') as any
    expect(body.contents[0].parts[1].text).toContain('2026-07-28')
  })

  it('forces a JSON response with a description/date/duration schema', () => {
    const body = buildStructuredRequestBody('abc', 'audio/webm', '2026-07-28', 'Custom prompt') as any
    expect(body.generationConfig.responseMimeType).toBe('application/json')
    expect(body.generationConfig.responseSchema.properties.description).toBeDefined()
    expect(body.generationConfig.responseSchema.properties.date).toBeDefined()
    expect(body.generationConfig.responseSchema.properties.duration).toBeDefined()
  })
})
