import type { TimesheetRowInput } from '../../shared/types'
import { parseDuration } from '../../shared/duration'

const CSV_HEADERS = ['name', 'project_id/.id', 'task_id/.id', 'unit_amount', 'date', 'employee_id']

function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function toCsvRow(fields: string[]): string {
  return fields.map(escapeCsvField).join(',')
}

export interface BuildCsvResult {
  csv: string
  errors: { id: string; error: string }[]
}

/** Builds a CSV for Odoo's import wizard. `project_id`/`task_id` use Odoo's `/.id` column-header
 * convention (import by literal database id, chosen per row in the UI) rather than display-name
 * matching — a blank project_id fails Odoo's timesheet-user create rule before the user ever gets a
 * chance to fill it in manually post-import, so each row must carry a real project id already.
 * `employee_id` stays a plain display name since it's not gated by the same rule. */
export function buildTimesheetCsv(rows: TimesheetRowInput[], employeeDisplayName: string): BuildCsvResult {
  const errors: { id: string; error: string }[] = []
  const lines = [toCsvRow(CSV_HEADERS)]

  for (const row of rows) {
    if (!row.projectId) {
      errors.push({ id: row.id, error: 'Project is required.' })
      continue
    }
    try {
      const unitAmount = parseDuration(row.duration)
      lines.push(
        toCsvRow([
          row.description,
          String(row.projectId),
          row.taskId ? String(row.taskId) : '',
          String(unitAmount),
          row.date,
          employeeDisplayName
        ])
      )
    } catch (err) {
      errors.push({ id: row.id, error: err instanceof Error ? err.message : 'Unknown error.' })
    }
  }

  return { csv: lines.join('\r\n') + '\r\n', errors }
}
