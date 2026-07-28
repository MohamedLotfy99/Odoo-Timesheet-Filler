import { useEffect, useState, type ReactElement } from 'react'
import { authApi } from './features/auth/authApi'
import { useAuthStore } from './features/auth/useAuthStore'
import { settingsApi } from './features/settings/settingsApi'
import { applyTheme } from './utils/theme'
import { LoginPage } from './pages/LoginPage'
import { TimesheetRowsPage } from './pages/TimesheetRowsPage'
import { HistoryPage } from './pages/HistoryPage'
import { SettingsPage } from './pages/SettingsPage'

type Tab = 'rows' | 'history' | 'settings'

const TABS: { tab: Tab; label: string }[] = [
  { tab: 'rows', label: 'New' },
  { tab: 'history', label: 'History' },
  { tab: 'settings', label: 'Settings' }
]

export default function App(): ReactElement {
  const session = useAuthStore((s) => s.session)
  const setSession = useAuthStore((s) => s.setSession)
  const [tab, setTab] = useState<Tab>('rows')

  useEffect(() => {
    settingsApi.get().then((s) => applyTheme(s.theme))
  }, [])

  if (!session) {
    return <LoginPage />
  }

  async function handleLogout(): Promise<void> {
    await authApi.logout()
    setSession(null)
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Timesheet Generator</h1>
        <nav className="tab-nav">
          {TABS.map((t) => (
            <button
              key={t.tab}
              className="btn-ghost"
              aria-current={tab === t.tab}
              onClick={() => setTab(t.tab)}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <div className="app-user">
          <span className="app-user-name">{session.username}</span>
          <button className="btn-ghost" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>
      <main className="app-content">
        {tab === 'rows' && <TimesheetRowsPage />}
        {tab === 'history' && <HistoryPage />}
        {tab === 'settings' && <SettingsPage />}
      </main>
    </div>
  )
}
