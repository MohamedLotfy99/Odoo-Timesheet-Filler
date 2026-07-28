import type { TimesheetRowInput } from '../../shared/types'
import { apiFetch } from '../../utils/apiUrl'

export interface ExportCsvError {
  id: string
  error: string
}

export interface ExportCsvResult {
  blob: Blob
  errors: ExportCsvError[]
}

export const csvApi = {
  exportCsv: async (rows: TimesheetRowInput[]): Promise<ExportCsvResult> => {
    const res = await apiFetch('/api/timesheets/export-csv', {
      method: 'POST',
      body: JSON.stringify({ rows })
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({ message: res.statusText }))
      throw new Error(body.message ?? 'CSV export failed.')
    }
    const errorsHeader = res.headers.get('X-Export-Errors')
    const errors: ExportCsvError[] = errorsHeader ? JSON.parse(decodeURIComponent(errorsHeader)) : []
    const blob = await res.blob()
    return { blob, errors }
  },

  downloadBlob: (blob: Blob, filename: string): void => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }
}
