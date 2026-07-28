import type { HistoryEntry } from '../../shared/types'
import { pool } from '../../db/pool'

interface HistoryRow {
  id: string
  db: string
  username: string
  odoo_record_id: number
  task_url: string
  task_name: string
  description: string
  duration: string
  date: string
  created_at: Date
  missing_in_odoo: boolean
}

function toEntry(row: HistoryRow): HistoryEntry {
  return {
    id: row.id,
    db: row.db,
    username: row.username,
    odooRecordId: row.odoo_record_id,
    taskUrl: row.task_url,
    taskName: row.task_name,
    description: row.description,
    duration: row.duration,
    date: row.date,
    createdAt: row.created_at.toISOString(),
    missingInOdoo: row.missing_in_odoo
  }
}

export async function listForSession(db: string, username: string): Promise<HistoryEntry[]> {
  const { rows } = await pool.query<HistoryRow>(
    `SELECT * FROM history WHERE db = $1 AND username = $2 ORDER BY created_at DESC`,
    [db, username]
  )
  return rows.map(toEntry)
}

export async function add(entry: HistoryEntry): Promise<void> {
  await pool.query(
    `INSERT INTO history (id, db, username, odoo_record_id, task_url, task_name, description, duration, date, created_at, missing_in_odoo)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      entry.id,
      entry.db,
      entry.username,
      entry.odooRecordId,
      entry.taskUrl,
      entry.taskName,
      entry.description,
      entry.duration,
      entry.date,
      entry.createdAt,
      entry.missingInOdoo ?? false
    ]
  )
}

export async function update(id: string, patch: Partial<HistoryEntry>): Promise<HistoryEntry> {
  const existing = await getById(id)
  const merged: HistoryEntry = { ...existing, ...patch }
  await pool.query(
    `UPDATE history SET description = $2, duration = $3, date = $4, missing_in_odoo = $5 WHERE id = $1`,
    [id, merged.description, merged.duration, merged.date, merged.missingInOdoo ?? false]
  )
  return merged
}

export async function remove(id: string): Promise<void> {
  await pool.query(`DELETE FROM history WHERE id = $1`, [id])
}

export async function getById(id: string): Promise<HistoryEntry> {
  const { rows } = await pool.query<HistoryRow>(`SELECT * FROM history WHERE id = $1`, [id])
  if (!rows.length) {
    throw new Error(`History entry ${id} not found.`)
  }
  return toEntry(rows[0])
}
