import 'dotenv/config'
import { app } from './app'
import { runMigrations } from './db/migrate'

const PORT = Number(process.env.PORT ?? 3001)

async function main(): Promise<void> {
  await runMigrations()
  app.listen(PORT, () => {
    console.log(`Timesheet Generator server listening on port ${PORT}`)
  })
}

main().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
