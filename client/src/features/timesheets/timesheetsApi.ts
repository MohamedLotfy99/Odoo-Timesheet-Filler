import type { TimesheetRowInput, TimesheetRowResult } from '../../shared/types'
import { apiJson } from '../../utils/apiUrl'

export const timesheetsApi = {
  submitRows: (rows: TimesheetRowInput[]): Promise<TimesheetRowResult[]> =>
    apiJson('/api/timesheets/submit-rows', { method: 'POST', body: JSON.stringify({ rows }) })
}
