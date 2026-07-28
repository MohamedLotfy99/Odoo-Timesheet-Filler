import { pool } from './pool'
import { SCHEMA_SQL } from './schema'

/** Runs the schema on boot. Every statement uses `CREATE TABLE/INDEX IF NOT EXISTS`, so re-running
 * this on every server start (or Lambda cold start) is idempotent and needs no separate
 * migration-tracking table. */
export async function runMigrations(): Promise<void> {
  await pool.query(SCHEMA_SQL)
}
