import type { TimesheetRowInput } from '../../shared/types'
import { parseDuration } from '../../shared/duration'

const CSV_HEADERS = ['name', 'project_id', 'task_id', 'unit_amount', 'date', 'employee_id']

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

/** Builds a CSV for Odoo's import wizard. `project_id`/`task_id` are intentionally left blank —
 * the user assigns those manually after importing. `employee_id` is the employee's display name so
 * Odoo's importer can auto-match the many2one field by name text. */
export function buildTimesheetCsv(rows: TimesheetRowInput[], employeeDisplayName: string): BuildCsvResult {
  const errors: { id: string; error: string }[] = []
  const lines = [toCsvRow(CSV_HEADERS)]

  for (const row of rows) {
    try {
      const unitAmount = parseDuration(row.duration)
      lines.push(
        toCsvRow([row.description, '', '', String(unitAmount), row.date, employeeDisplayName])
      )
    } catch (err) {
      errors.push({ id: row.id, error: err instanceof Error ? err.message : 'Unknown error.' })
    }
  }

  return { csv: lines.join('\r\n') + '\r\n', errors }
}
