import 'dotenv/config'
import serverless from 'serverless-http'
import { app } from '../../src/app'
import { runMigrations } from '../../src/db/migrate'

let migrated: Promise<void> | null = null
const serverlessHandler = serverless(app, { basePath: '/.netlify/functions/api' })

export async function handler(event: unknown, context: unknown): Promise<unknown> {
  migrated ??= runMigrations()
  await migrated
  return serverlessHandler(event as never, context as never)
}
