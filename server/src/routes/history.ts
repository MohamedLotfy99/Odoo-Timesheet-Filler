import { Router } from 'express'
import { requireSession } from '../middleware/requireSession'
import { getById, listForSession, remove, update } from '../services/history/store'

export const historyRouter = Router()

historyRouter.get('/', requireSession, async (req, res) => {
  const { session } = req.odoo!
  res.json(await listForSession(session.db, session.username))
})

historyRouter.patch('/:id', requireSession, async (req, res) => {
  const { session } = req.odoo!
  try {
    const existing = await getById(req.params.id)
    if (existing.db !== session.db || existing.username !== session.username) {
      res.status(404).json({ message: 'History entry not found.' })
      return
    }
    const { description, duration, date } = req.body ?? {}
    const updated = await update(req.params.id, { description, duration, date })
    res.json(updated)
  } catch (err) {
    res.status(404).json({ message: err instanceof Error ? err.message : 'History entry not found.' })
  }
})

historyRouter.delete('/:id', requireSession, async (req, res) => {
  const { session } = req.odoo!
  try {
    const existing = await getById(req.params.id)
    if (existing.db !== session.db || existing.username !== session.username) {
      res.status(404).json({ message: 'History entry not found.' })
      return
    }
    await remove(req.params.id)
    res.json({ ok: true })
  } catch (err) {
    res.status(404).json({ message: err instanceof Error ? err.message : 'History entry not found.' })
  }
})
