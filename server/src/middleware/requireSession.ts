import type { NextFunction, Request, Response } from 'express'
import { pool } from '../db/pool'
import { decrypt } from '../lib/crypto'
import { OdooClient } from '../services/odoo/client'

export interface RequestOdooContext {
  client: OdooClient
  employeeId: number
  session: { url: string; db: string; username: string; uid: number }
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      odoo?: RequestOdooContext
    }
  }
}

interface SessionRow {
  id: string
  db: string
  username: string
  uid: number
  encrypted_secret: string
  odoo_url: string
  employee_id: number
  expires_at: Date
}

export const SESSION_COOKIE_NAME = 'ts_session'

export async function requireSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  const sessionId = req.cookies?.[SESSION_COOKIE_NAME]
  if (!sessionId) {
    res.status(401).json({ message: 'Not logged in.' })
    return
  }

  const { rows } = await pool.query<SessionRow>(`SELECT * FROM sessions WHERE id = $1`, [sessionId])
  const row = rows[0]
  if (!row || row.expires_at.getTime() < Date.now()) {
    res.status(401).json({ message: 'Session expired — please log in again.' })
    return
  }

  const secret = decrypt(row.encrypted_secret)
  const client = new OdooClient(row.odoo_url, row.db, row.uid, secret)

  req.odoo = {
    client,
    employeeId: row.employee_id,
    session: { url: row.odoo_url, db: row.db, username: row.username, uid: row.uid }
  }
  next()
}
