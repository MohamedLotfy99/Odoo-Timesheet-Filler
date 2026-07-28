import { useEffect, useState, type FormEvent, type ReactElement } from 'react'
import { authApi } from '../features/auth/authApi'
import { useAuthStore } from '../features/auth/useAuthStore'

function deriveDb(url: string): string {
  try {
    return new URL(url).hostname.split('.')[0]
  } catch {
    return ''
  }
}

export function LoginPage(): ReactElement {
  const status = useAuthStore((s) => s.status)
  const setSession = useAuthStore((s) => s.setSession)

  const [url, setUrl] = useState('https://egy.softspace.ae')
  const [db, setDb] = useState('softspace')
  const [dbTouched, setDbTouched] = useState(false)
  const [username, setUsername] = useState('')
  const [secret, setSecret] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    authApi.restoreSession().then((session) => setSession(session))
  }, [setSession])

  function handleUrlChange(next: string): void {
    setUrl(next)
    if (!dbTouched) setDb(deriveDb(next))
  }

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const session = await authApi.login({ url, db, username, secret })
      setSession(session)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.')
    } finally {
      setSubmitting(false)
    }
  }

  if (status === 'checking') {
    return (
      <div className="login-screen">
        <p className="notice">Checking for a saved session…</p>
      </div>
    )
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-brand">🕒</div>
        <h1>Timesheet Generator</h1>
        <p className="login-subtitle">Sign in with your Odoo account</p>
        <form onSubmit={handleSubmit}>
          <label>
            Odoo URL
            <input value={url} onChange={(e) => handleUrlChange(e.target.value)} required />
          </label>
          <label>
            Database
            <input
              value={db}
              onChange={(e) => {
                setDb(e.target.value)
                setDbTouched(true)
              }}
              required
            />
          </label>
          <label>
            Username
            <input value={username} onChange={(e) => setUsername(e.target.value)} required autoComplete="username" />
          </label>
          <label>
            Password or API key
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>
          {error && <p className="error">{error}</p>}
          <button type="submit" className="login-submit" disabled={submitting}>
            {submitting ? 'Logging in…' : 'Log in'}
          </button>
        </form>
      </div>
    </div>
  )
}
