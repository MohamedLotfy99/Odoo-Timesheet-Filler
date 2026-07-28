import { Router } from 'express'
import type { AppSettings } from '../shared/types'
import { requireSession } from '../middleware/requireSession'
import { get, set } from '../services/settings/store'

export const settingsRouter = Router()

settingsRouter.get('/', requireSession, async (req, res) => {
  const { session } = req.odoo!
  res.json(await get(session.db, session.username))
})

settingsRouter.post('/', requireSession, async (req, res) => {
  const { session } = req.odoo!
  const settings = req.body as AppSettings
  await set(session.db, session.username, settings)
  res.json({ ok: true })
})
