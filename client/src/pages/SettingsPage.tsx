import { useEffect, useState, type ReactElement } from 'react'
import type { AppSettings, Theme } from '../shared/types'
import { DEFAULT_SETTINGS, DEFAULT_TRANSCRIPTION_PROMPT } from '../shared/defaults'
import { settingsApi } from '../features/settings/settingsApi'
import { applyTheme } from '../utils/theme'

export function SettingsPage(): ReactElement {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [loaded, setLoaded] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    settingsApi.get().then((s) => {
      setSettings(s)
      setLoaded(true)
    })
  }, [])

  function handleThemeChange(theme: Theme): void {
    setSettings((s) => ({ ...s, theme }))
    applyTheme(theme)
  }

  async function handleSave(): Promise<void> {
    await settingsApi.set(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!loaded) {
    return (
      <div className="page">
        <p className="notice">Loading settings…</p>
      </div>
    )
  }

  const { transcription } = settings

  return (
    <div className="page">
      <section>
        <h3>Appearance</h3>
        <label>
          Theme
          <select value={settings.theme} onChange={(e) => handleThemeChange(e.target.value as Theme)}>
            <option value="system">Match system</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
      </section>
      <section>
        <h3>Voice dictation</h3>
        <label>
          Transcription provider
          <select
            value={transcription.provider}
            onChange={(e) =>
              setSettings((s) => ({
                ...s,
                transcription: { ...s.transcription, provider: e.target.value as 'webSpeech' | 'gemini' }
              }))
            }
          >
            <option value="webSpeech">Web Speech (description only, browser-native)</option>
            <option value="gemini">Gemini (description + date + duration, handles mixed Arabic/English)</option>
          </select>
        </label>
        {transcription.provider === 'gemini' && (
          <>
            <label>
              Gemini API key
              <input
                type="password"
                value={transcription.geminiApiKey}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    transcription: { ...s.transcription, geminiApiKey: e.target.value }
                  }))
                }
              />
              <span className="notice">
                Leave blank to use the server's shared key, if configured. Get a free personal key at{' '}
                <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">
                  aistudio.google.com/apikey
                </a>{' '}
                — sign in with a Google account, click "Create API key".
              </span>
            </label>
            <label>
              Gemini model
              <input
                value={transcription.geminiModel}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    transcription: { ...s.transcription, geminiModel: e.target.value }
                  }))
                }
              />
            </label>
            <label>
              Transcription prompt
              <textarea
                value={transcription.promptTemplate}
                rows={5}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    transcription: { ...s.transcription, promptTemplate: e.target.value }
                  }))
                }
              />
            </label>
            <button
              type="button"
              className="btn-secondary"
              onClick={() =>
                setSettings((s) => ({
                  ...s,
                  transcription: { ...s.transcription, promptTemplate: DEFAULT_TRANSCRIPTION_PROMPT }
                }))
              }
            >
              Reset prompt to default
            </button>
          </>
        )}
        <div className="button-row">
          <button type="button" onClick={handleSave}>
            Save
          </button>
          {saved && <span className="notice">Saved.</span>}
        </div>
      </section>
    </div>
  )
}
