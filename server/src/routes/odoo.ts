import { Router } from 'express'
import { requireSession } from '../middleware/requireSession'

export const odooRouter = Router()

odooRouter.get('/projects', requireSession, async (req, res) => {
  const rows = await req.odoo!.client.searchRead<{ id: number; name: string }>(
    'project.project',
    [['allow_timesheets', '=', true]],
    ['id', 'name'],
    { order: 'name' }
  )
  res.json(rows)
})

odooRouter.get('/tasks', requireSession, async (req, res) => {
  const projectId = Number(req.query.project_id)
  if (!projectId) {
    res.status(400).json({ message: 'project_id query param is required.' })
    return
  }
  const rows = await req.odoo!.client.searchRead<{ id: number; name: string }>(
    'project.task',
    [['project_id', '=', projectId]],
    ['id', 'name'],
    { order: 'name' }
  )
  res.json(rows)
})
