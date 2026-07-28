import { randomUUID } from 'crypto'
import { Router } from 'express'
import type { OdooCredentials } from '../shared/types'
import { OdooClient, clientFromCredentials } from '../services/odoo/client'
import { pool } from '../db/pool'
import { encrypt } from '../lib/crypto'
import { requireSession, SESSION_COOKIE_NAME } from '../middleware/requireSession'

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000
const isProduction = process.env.NODE_ENV === 'production'
/** Set COOKIE_CROSS_SITE=true only when the client and server are on different domains
 * (e.g. separate Render services) — same-origin deploys (e.g. Netlify function + static
 * site on one domain) should leave this unset so the cookie can stay 'lax'. */
const isCrossSite = process.env.COOKIE_CROSS_SITE === 'true'

export const authRouter = Router()

async function fetchEmployeeId(client: OdooClient, uid: number): Promise<number> {
  const rows = await client.searchRead<{ id: number }>(
    'hr.employee',
    [['user_id', '=', uid]],
    ['id'],
    { limit: 1 }
  )
  if (!rows.length) {
    throw new Error('No hr.employee record found for this user — cannot log timesheets.')
  }
  return rows[0].id
}

authRouter.post('/login', async (req, res) => {
  const creds = req.body as Partial<OdooCredentials>
  if (!creds.url || !creds.db || !creds.username || !creds.secret) {
    res.status(400).json({ message: 'url, db, username, and secret are all required.' })
    return
  }

  try {
    const session = await OdooClient.authenticate(creds.url, creds.db, creds.username, creds.secret)
    const client = clientFromCredentials(creds as OdooCredentials, session.uid)
    const employeeId = await fetchEmployeeId(client, session.uid)

    const sessionId = randomUUID()
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS)
    await pool.query(
      `INSERT INTO sessions (id, db, username, uid, encrypted_secret, odoo_url, employee_id, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [sessionId, session.db, session.username, session.uid, encrypt(creds.secret), session.url, employeeId, expiresAt]
    )

    res.cookie(SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: isProduction || isCrossSite,
      sameSite: isCrossSite ? 'none' : 'lax',
      maxAge: SESSION_TTL_MS
    })
    res.json(session)
  } catch (err) {
    res.status(401).json({ message: err instanceof Error ? err.message : 'Login failed.' })
  }
})

authRouter.post('/logout', async (req, res) => {
  const sessionId = req.cookies?.[SESSION_COOKIE_NAME]
  if (sessionId) {
    await pool.query(`DELETE FROM sessions WHERE id = $1`, [sessionId])
  }
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction || isCrossSite,
    sameSite: isCrossSite ? 'none' : 'lax'
  })
  res.json({ ok: true })
})

authRouter.get('/me', requireSession, (req, res) => {
  res.json(req.odoo!.session)
})
