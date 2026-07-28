import { readFile } from 'fs/promises'
import { join } from 'path'
import { pool } from './pool'

/** Runs schema.sql on boot. Every statement uses `CREATE TABLE/INDEX IF NOT EXISTS`, so re-running
 * this on every server start is idempotent and needs no separate migration-tracking table. */
export async function runMigrations(): Promise<void> {
  const schemaPath = join(__dirname, 'schema.sql')
  const sql = await readFile(schemaPath, 'utf-8')
  await pool.query(sql)
}
