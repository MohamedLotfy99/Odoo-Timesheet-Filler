import { useEffect, useState, type ReactElement } from 'react'
import type { TimesheetRowInput, TimesheetRowResult, TranscriptionSettings } from '../shared/types'
import { timesheetsApi } from '../features/timesheets/timesheetsApi'
import { settingsApi } from '../features/settings/settingsApi'
import { csvApi } from '../features/csv/csvApi'
import { TimesheetRow } from '../features/voice/TimesheetRow'

type Mode = 'submit' | 'csv'

function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function emptyRow(): TimesheetRowInput {
  return { id: crypto.randomUUID(), url: '', description: '', duration: '', date: todayIso() }
}

type RowStatus = 'idle' | 'pending' | 'success' | 'error'

export function TimesheetRowsPage(): ReactElement {
  const [mode, setMode] = useState<Mode>('submit')
  const [rows, setRows] = useState<TimesheetRowInput[]>([emptyRow()])
  const [results, setResults] = useState<Record<string, TimesheetRowResult>>({})
  const [csvErrors, setCsvErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [transcriptionProvider, setTranscriptionProvider] = useState<TranscriptionSettings['provider']>('webSpeech')

  useEffect(() => {
    settingsApi.get().then((s) => setTranscriptionProvider(s.transcription.provider))
  }, [])

  function updateRow(id: string, patch: Partial<TimesheetRowInput>): void {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  function addRow(): void {
    setRows((prev) => [...prev, emptyRow()])
  }

  function removeRow(id: string): void {
    setRows((prev) => prev.filter((r) => r.id !== id))
    setResults((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    setCsvErrors((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  function rowStatus(id: string): RowStatus {
    if (mode === 'csv') return csvErrors[id] ? 'error' : 'idle'
    if (submitting) return 'pending'
    const result = results[id]
    if (!result) return 'idle'
    return result.success ? 'success' : 'error'
  }

  async function handleSubmitRows(): Promise<void> {
    setSubmitting(true)
    setResults({})
    try {
      const outcomes = await timesheetsApi.submitRows(rows)
      setResults(Object.fromEntries(outcomes.map((r) => [r.id, r])))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleExportCsv(): Promise<void> {
    setSubmitting(true)
    setCsvErrors({})
    try {
      const { blob, errors } = await csvApi.exportCsv(rows)
      setCsvErrors(Object.fromEntries(errors.map((e) => [e.id, e.error])))
      csvApi.downloadBlob(blob, `timesheet-${todayIso()}.csv`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page">
      <section>
        <div className="mode-toggle">
          <button
            type="button"
            className={mode === 'submit' ? 'mode-toggle-btn active' : 'mode-toggle-btn'}
            onClick={() => setMode('submit')}
          >
            Submit to Odoo
          </button>
          <button
            type="button"
            className={mode === 'csv' ? 'mode-toggle-btn active' : 'mode-toggle-btn'}
            onClick={() => setMode('csv')}
          >
            Export CSV
          </button>
        </div>
        <h3>Timesheet rows</h3>
        <div className="row-list">
          {rows.map((row) => {
            const status = rowStatus(row.id)
            const result = results[row.id]
            return (
              <TimesheetRow
                key={row.id}
                row={row}
                status={status}
                resultMessage={mode === 'csv' ? csvErrors[row.id] : result?.success ? result.taskName : result?.error}
                transcriptionProvider={transcriptionProvider}
                showTaskUrl={mode === 'submit'}
                onChange={(patch) => updateRow(row.id, patch)}
                onRemove={() => removeRow(row.id)}
              />
            )
          })}
        </div>
        <div className="button-row">
          <button type="button" className="btn-secondary" onClick={addRow}>
            + Add row
          </button>
          {mode === 'submit' ? (
            <button type="button" onClick={handleSubmitRows} disabled={submitting || rows.length === 0}>
              {submitting ? 'Submitting…' : 'Submit all'}
            </button>
          ) : (
            <button type="button" onClick={handleExportCsv} disabled={submitting || rows.length === 0}>
              {submitting ? 'Exporting…' : 'Download CSV'}
            </button>
          )}
        </div>
      </section>
    </div>
  )
}
