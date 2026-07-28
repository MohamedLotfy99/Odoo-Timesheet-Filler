import { useCallback, useRef, useState } from 'react'
import type { TranscriptionSettings, VoiceExtraction } from '../../shared/types'
import { apiJson } from '../../utils/apiUrl'

export type RecorderStatus = 'idle' | 'recording' | 'transcribing'

interface UseRecorderOptions {
  provider: TranscriptionSettings['provider']
  /** Web Speech only ever produces plain text (browser API can't structure-extract); Gemini produces
   * a full description/date/duration extraction. */
  onResult: (result: string | VoiceExtraction) => void
}

interface UseRecorderResult {
  status: RecorderStatus
  error: string | null
  supported: boolean
  toggle: () => void
}

function getSpeechRecognitionCtor(): (new () => any) | null {
  const w = window as any
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      resolve(result.slice(result.indexOf(',') + 1))
    }
    reader.onerror = () => reject(new Error('Failed to read recorded audio.'))
    reader.readAsDataURL(blob)
  })
}

function speechErrorMessage(errorCode: string): string {
  if (errorCode === 'not-allowed' || errorCode === 'service-not-allowed') {
    return 'Microphone access denied.'
  }
  return `Speech recognition error: ${errorCode}`
}

/** Drives either browser-native SpeechRecognition or a MediaRecorder + Gemini API round trip,
 * behind one start/stop interface, depending on the configured transcription provider. */
export function useRecorder({ provider, onResult }: UseRecorderOptions): UseRecorderResult {
  const [status, setStatus] = useState<RecorderStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const recognitionRef = useRef<any>(null)
  const finalTranscriptRef = useRef('')

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const speechSupported = provider !== 'webSpeech' || getSpeechRecognitionCtor() !== null

  const startWebSpeech = useCallback((): void => {
    const Ctor = getSpeechRecognitionCtor()
    if (!Ctor) {
      setError('Speech recognition is not supported in this browser.')
      return
    }
    setError(null)
    finalTranscriptRef.current = ''
    const recognition = new Ctor()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalTranscriptRef.current += `${result[0].transcript} `
        }
      }
    }
    recognition.onerror = (event: any) => {
      setError(speechErrorMessage(event.error))
      setStatus('idle')
    }
    recognition.onend = () => {
      const text = finalTranscriptRef.current.trim()
      if (text) onResult(text)
      setStatus('idle')
    }
    recognitionRef.current = recognition
    recognition.start()
    setStatus('recording')
  }, [onResult])

  const stopWebSpeech = useCallback((): void => {
    recognitionRef.current?.stop()
  }, [])

  const startGemini = useCallback(async (): Promise<void> => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' })
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = async () => {
        streamRef.current?.getTracks().forEach((track) => track.stop())
        streamRef.current = null
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setStatus('transcribing')
        try {
          const audioBase64 = await blobToBase64(blob)
          const extraction = await apiJson<VoiceExtraction>('/api/voice/transcribe', {
            method: 'POST',
            body: JSON.stringify({ audioBase64, mimeType: 'audio/webm' })
          })
          onResult(extraction)
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Transcription failed.')
        } finally {
          setStatus('idle')
        }
      }
      mediaRecorderRef.current = recorder
      recorder.start()
      setStatus('recording')
    } catch {
      setError('Microphone access denied.')
      setStatus('idle')
    }
  }, [onResult])

  const stopGemini = useCallback((): void => {
    mediaRecorderRef.current?.stop()
  }, [])

  const toggle = useCallback((): void => {
    if (status === 'transcribing') return
    if (status === 'recording') {
      if (provider === 'webSpeech') stopWebSpeech()
      else stopGemini()
      return
    }
    if (provider === 'webSpeech') startWebSpeech()
    else void startGemini()
  }, [provider, status, startWebSpeech, stopWebSpeech, startGemini, stopGemini])

  return { status, error, supported: speechSupported, toggle }
}
