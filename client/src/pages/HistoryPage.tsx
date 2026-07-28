import { useEffect, useState, type ReactElement } from 'react'
import type { HistoryEntry } from '../shared/types'
import { historyApi } from '../features/history/historyApi'

interface EditDraft {
  description: string
  duration: string
  date: string
}

export function HistoryPage(): ReactElement {
  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState<string | null>(null)
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<EditDraft>({ description: '', duration: '', date: '' })
  const [savingId, setSavingId] = useState<string | null>(null)

  useEffect(() => {
    void load()
  }, [])

  async function load(): Promise<void> {
    setLoading(true)
    setPageError(null)
    try {
      setEntries(await historyApi.list())
    } catch (err) {
      setPageError(err instanceof Error ? err.message : 'Failed to load history.')
    } finally {
      setLoading(false)
    }
  }

  function startEdit(entry: HistoryEntry): void {
    setEditingId(entry.id)
    setDraft({ description: entry.description, duration: entry.duration, date: entry.date })
    setRowErrors((prev) => ({ ...prev, [entry.id]: '' }))
  }

  function cancelEdit(): void {
    setEditingId(null)
  }

  async function saveEdit(id: string): Promise<void> {
    setSavingId(id)
    try {
      const updated = await historyApi.update({ id, ...draft })
      setEntries((prev) => prev.map((e) => (e.id === id ? updated : e)))
      setEditingId(null)
    } catch (err) {
      setRowErrors((prev) => ({ ...prev, [id]: err instanceof Error ? err.message : 'Update failed.' }))
    } finally {
      setSavingId(null)
    }
  }

  async function handleDelete(entry: HistoryEntry): Promise<void> {
    if (!confirm(`Delete this timesheet entry${entry.missingInOdoo ? '' : ' from Odoo'}?`)) return
    try {
      await historyApi.delete(entry.id)
      setEntries((prev) => prev.filter((e) => e.id !== entry.id))
    } catch (err) {
      setRowErrors((prev) => ({
        ...prev,
        [entry.id]: err instanceof Error ? err.message : 'Delete failed.'
      }))
    }
  }

  if (loading) {
    return (
      <div className="page">
        <p className="notice">Loading history…</p>
      </div>
    )
  }

  return (
    <div className="page">
      <section>
        <h3>Timesheet history</h3>
        {pageError && <p className="error">{pageError}</p>}
        {entries.length === 0 && <p className="empty-state">No timesheets logged yet.</p>}
        <div className="row-list">
          {entries.map((entry) => {
            const isEditing = editingId === entry.id
            return (
              <div
                key={entry.id}
                className={`history-entry${entry.missingInOdoo ? ' history-entry-missing' : ''}`}
              >
                <div className="history-entry-header">
                  <strong>{entry.taskName}</strong>
                  {entry.missingInOdoo && <span className="notice">No longer exists in Odoo</span>}
                </div>
                {isEditing ? (
                  <>
                    <label>
                      Description
                      <textarea
                        value={draft.description}
                        rows={2}
                        onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                      />
                    </label>
                    <label className="duration-field">
                      Duration
                      <input
                        value={draft.duration}
                        onChange={(e) => setDraft((d) => ({ ...d, duration: e.target.value }))}
                        placeholder="01:20"
                      />
                    </label>
                    <label className="date-field">
                      Date
                      <input
                        type="date"
                        value={draft.date}
                        onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
                      />
                    </label>
                    <div className="button-row">
                      <button type="button" onClick={() => saveEdit(entry.id)} disabled={savingId === entry.id}>
                        {savingId === entry.id ? 'Saving…' : 'Save'}
                      </button>
                      <button type="button" className="btn-secondary" onClick={cancelEdit}>
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p>{entry.description}</p>
                    <p className="notice">
                      {entry.duration} · {entry.date}
                    </p>
                    <div className="button-row">
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => startEdit(entry)}
                        disabled={entry.missingInOdoo}
                      >
                        Edit
                      </button>
                      <button type="button" className="btn-secondary" onClick={() => handleDelete(entry)}>
                        Delete
                      </button>
                    </div>
                  </>
                )}
                {rowErrors[entry.id] && <p className="error">{rowErrors[entry.id]}</p>}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
