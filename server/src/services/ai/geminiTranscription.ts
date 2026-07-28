import type { VoiceExtraction } from '../../shared/types'

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[]
  error?: { message?: string }
}

export function buildTranscriptionRequestBody(audioBase64: string, mimeType: string, promptText: string): object {
  return {
    contents: [
      {
        parts: [{ inline_data: { mime_type: mimeType, data: audioBase64 } }, { text: promptText }]
      }
    ]
  }
}

const STRUCTURED_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    description: { type: 'STRING' },
    date: { type: 'STRING', nullable: true },
    duration: { type: 'STRING', nullable: true }
  },
  required: ['description']
}

/** Builds the structured-extraction request body: same audio inline_data part as plain transcription,
 * plus a prompt (with today's date baked in so relative phrases like "yesterday" resolve to an
 * absolute date) and a `responseSchema` forcing Gemini to return JSON for description/date/duration. */
export function buildStructuredRequestBody(
  audioBase64: string,
  mimeType: string,
  todayIso: string,
  promptText: string
): object {
  const instructions =
    `${promptText}\n\n` +
    `Today's date is ${todayIso} (YYYY-MM-DD). Additionally extract, if mentioned in the recording:\n` +
    `- "date": the date the work was done, resolved to an absolute YYYY-MM-DD using today's date as ` +
    `the reference point for relative phrases ("yesterday", "last Monday", "two days ago"). Null if not mentioned.\n` +
    `- "duration": the amount of time spent, normalized to "HH:MM" (e.g. "an hour twenty" -> "01:20", ` +
    `"half an hour" -> "00:30"). Null if not mentioned.\n` +
    `Return only the JSON object described by the response schema.`

  return {
    contents: [
      {
        parts: [{ inline_data: { mime_type: mimeType, data: audioBase64 } }, { text: instructions }]
      }
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: STRUCTURED_RESPONSE_SCHEMA
    }
  }
}

/** Sends recorded audio to Gemini for transcription — same request pattern as ai/gemini.ts's
 * text generation, but with an inline_data audio part instead of a text-only prompt. */
export class GeminiTranscriptionProvider {
  constructor(
    private readonly apiKey: string,
    private readonly model: string
  ) {}

  async transcribe(audioBase64: string, mimeType: string, promptText: string): Promise<string> {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildTranscriptionRequestBody(audioBase64, mimeType, promptText))
      }
    )

    const body = (await res.json()) as GeminiResponse

    if (!res.ok || body.error) {
      throw new Error(`Gemini transcription failed: ${body.error?.message ?? res.statusText}`)
    }

    const text = body.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) {
      throw new Error('Gemini returned an empty transcript.')
    }
    return text.trim()
  }

  async transcribeStructured(
    audioBase64: string,
    mimeType: string,
    todayIso: string,
    promptText: string
  ): Promise<VoiceExtraction> {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildStructuredRequestBody(audioBase64, mimeType, todayIso, promptText))
      }
    )

    const body = (await res.json()) as GeminiResponse

    if (!res.ok || body.error) {
      throw new Error(`Gemini transcription failed: ${body.error?.message ?? res.statusText}`)
    }

    const text = body.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) {
      throw new Error('Gemini returned an empty transcript.')
    }

    let parsed: Partial<VoiceExtraction>
    try {
      parsed = JSON.parse(text) as Partial<VoiceExtraction>
    } catch {
      throw new Error('Gemini returned malformed JSON for structured transcription.')
    }
    if (!parsed.description) {
      throw new Error('Gemini returned an empty description.')
    }

    return {
      description: parsed.description.trim(),
      date: parsed.date ?? null,
      duration: parsed.duration ?? null
    }
  }
}
