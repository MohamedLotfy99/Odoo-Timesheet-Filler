import { useCallback, type ReactElement } from 'react'
import type { TimesheetRowInput, TranscriptionSettings, VoiceExtraction } from '../../shared/types'
import { useRecorder } from './useRecorder'

interface TimesheetRowProps {
  row: TimesheetRowInput
  status: 'idle' | 'pending' | 'success' | 'error'
  resultMessage?: string
  transcriptionProvider: TranscriptionSettings['provider']
  showTaskUrl: boolean
  onChange: (patch: Partial<TimesheetRowInput>) => void
  onRemove: () => void
}

export function TimesheetRow({
  row,
  status,
  resultMessage,
  transcriptionProvider,
  showTaskUrl,
  onChange,
  onRemove
}: TimesheetRowProps): ReactElement {
  const handleResult = useCallback(
    (result: string | VoiceExtraction) => {
      if (typeof result === 'string') {
        onChange({ description: row.description ? `${row.description} ${result}` : result })
        return
      }
      onChange({
        description: row.description ? `${row.description} ${result.description}` : result.description,
        ...(result.date ? { date: result.date } : {}),
        ...(result.duration ? { duration: result.duration } : {})
      })
    },
    [onChange, row.description]
  )

  const recorder = useRecorder({ provider: transcriptionProvider, onResult: handleResult })

  return (
    <div className={`timesheet-row timesheet-row-${status}${showTaskUrl ? '' : ' timesheet-row-no-url'}`}>
      {showTaskUrl && (
        <label>
          Task URL
          <input
            value={row.url}
            onChange={(e) => onChange({ url: e.target.value })}
            placeholder="https://.../web#id=123&model=project.task&view_type=form"
          />
        </label>
      )}
      <label>
        Description
        <div className="description-field">
          <textarea
            value={row.description}
            onChange={(e) => onChange({ description: e.target.value })}
            rows={2}
            placeholder="What did you work on?"
          />
          <button
            type="button"
            className={`mic-button mic-button-${recorder.status}`}
            onClick={recorder.toggle}
            disabled={!recorder.supported || recorder.status === 'transcribing'}
            title={
              !recorder.supported
                ? 'Not supported — switch to Gemini in Settings.'
                : recorder.status === 'recording'
                  ? 'Stop recording'
                  : 'Record description'
            }
          >
            {recorder.status === 'transcribing' ? '⏳' : recorder.status === 'recording' ? '⏺' : '🎤'}
          </button>
        </div>
        {recorder.error && <span className="error mic-error">{recorder.error}</span>}
      </label>
      <label className="duration-field">
        Duration
        <input value={row.duration} onChange={(e) => onChange({ duration: e.target.value })} placeholder="01:20" />
      </label>
      <label className="date-field">
        Date
        <input type="date" value={row.date} onChange={(e) => onChange({ date: e.target.value })} />
      </label>
      <button type="button" className="btn-ghost row-remove" onClick={onRemove}>
        ✕
      </button>
      {status === 'pending' && <span className="row-status notice">Submitting…</span>}
      {status === 'success' && <span className="row-status success">✓ Logged to {resultMessage}</span>}
      {status === 'error' && <span className="row-status error">{resultMessage}</span>}
    </div>
  )
}
