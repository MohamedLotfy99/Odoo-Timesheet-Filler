import { Router } from 'express'
import type { TimesheetRowInput } from '../shared/types'
import { requireSession } from '../middleware/requireSession'
import { submitTimesheetRows } from '../services/odoo/timesheetEntries'
import { buildTimesheetCsv } from '../services/csv/exportCsv'

export const timesheetsRouter = Router()

timesheetsRouter.post('/submit-rows', requireSession, async (req, res) => {
  const rows = req.body?.rows as TimesheetRowInput[] | undefined
  if (!Array.isArray(rows)) {
    res.status(400).json({ message: 'rows must be an array.' })
    return
  }

  const { client, employeeId, session } = req.odoo!
  const createdAt = new Date().toISOString()
  const results = await submitTimesheetRows(client, employeeId, session, rows, createdAt)
  res.json(results)
})

timesheetsRouter.post('/export-csv', requireSession, async (req, res) => {
  const rows = req.body?.rows as TimesheetRowInput[] | undefined
  const projectId = Number(req.body?.projectId)
  const taskId = req.body?.taskId ? Number(req.body.taskId) : null
  if (!Array.isArray(rows)) {
    res.status(400).json({ message: 'rows must be an array.' })
    return
  }
  if (!projectId) {
    res.status(400).json({ message: 'projectId is required.' })
    return
  }

  const { employeeId } = req.odoo!
  const employeeDisplayName = await fetchEmployeeDisplayName(req.odoo!.client, employeeId)

  const { csv, errors } = buildTimesheetCsv(rows, employeeDisplayName, projectId, taskId)

  if (errors.length && !rows.some((r) => !errors.some((e) => e.id === r.id))) {
    res.status(400).json({ message: 'All rows failed to export.', errors })
    return
  }

  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', 'attachment; filename="timesheet.csv"')
  res.setHeader('X-Export-Errors', encodeURIComponent(JSON.stringify(errors)))
  res.send(csv)
})

async function fetchEmployeeDisplayName(
  client: import('../services/odoo/client').OdooClient,
  employeeId: number
): Promise<string> {
  const rows = await client.executeKw<{ id: number; name: string }[]>('hr.employee', 'read', [
    [employeeId],
    ['name']
  ])
  return rows[0]?.name ?? ''
}
