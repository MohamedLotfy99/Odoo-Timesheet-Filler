import { randomUUID } from 'crypto'
import type { HistoryEntry, TimesheetRowInput, TimesheetRowResult } from '../../shared/types'
import { parseDuration } from '../../shared/duration'
import type { OdooClient } from './client'
import { parseTaskIdFromUrl } from './taskUrlParser'
import { add as addHistoryEntry } from '../history/store'

interface TaskRow {
  id: number
  name: string
  project_id: [number, string] | false
}

interface SessionInfo {
  db: string
  username: string
}

async function fetchTask(client: OdooClient, taskId: number): Promise<TaskRow> {
  const rows = await client.executeKw<TaskRow[]>('project.task', 'read', [
    [taskId],
    ['id', 'name', 'project_id']
  ])
  if (!rows.length) {
    throw new Error(`No task found with id ${taskId}.`)
  }
  return rows[0]
}

async function processRow(
  client: OdooClient,
  employeeId: number,
  session: SessionInfo,
  row: TimesheetRowInput,
  createdAt: string
): Promise<TimesheetRowResult> {
  const taskId = parseTaskIdFromUrl(row.url)
  const task = await fetchTask(client, taskId)
  const unitAmount = parseDuration(row.duration)

  const createdId = await client.executeKw<number>('account.analytic.line', 'create', [
    {
      name: row.description,
      unit_amount: unitAmount,
      date: row.date,
      task_id: task.id,
      project_id: task.project_id ? task.project_id[0] : false,
      employee_id: employeeId
    }
  ])

  const historyEntry: HistoryEntry = {
    id: randomUUID(),
    db: session.db,
    username: session.username,
    odooRecordId: createdId,
    taskUrl: row.url,
    taskName: task.name,
    description: row.description,
    duration: row.duration,
    date: row.date,
    createdAt
  }
  await addHistoryEntry(historyEntry)

  return { id: row.id, success: true, taskName: task.name }
}

/** Processes rows one at a time (not in parallel) so a failure on one row doesn't affect the rest,
 * and each row's success/failure can be reported independently. */
export async function submitTimesheetRows(
  client: OdooClient,
  employeeId: number,
  session: SessionInfo,
  rows: TimesheetRowInput[],
  createdAt: string
): Promise<TimesheetRowResult[]> {
  const results: TimesheetRowResult[] = []
  for (const row of rows) {
    try {
      results.push(await processRow(client, employeeId, session, row, createdAt))
    } catch (err) {
      results.push({
        id: row.id,
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error.'
      })
    }
  }
  return results
}
