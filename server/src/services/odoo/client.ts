import type { OdooCredentials, OdooSession } from '../../shared/types'

interface JsonRpcError {
  code: number
  message: string
  data?: { message?: string; name?: string }
}

/** Thin JSON-RPC client for Odoo's external API (`/jsonrpc`). Accepts a password or an API key
 * interchangeably — Odoo's `common.authenticate` / `execute_kw` treat both the same way. */
export class OdooClient {
  constructor(
    private readonly url: string,
    private readonly db: string,
    private readonly uid: number,
    private readonly secret: string
  ) {}

  static async authenticate(url: string, db: string, login: string, secret: string): Promise<OdooSession> {
    const uid = await OdooClient.call<number | false>(url, 'common', 'authenticate', [
      db,
      login,
      secret,
      {}
    ])
    if (!uid) {
      throw new Error('Login failed: check the Odoo URL, database, username, and password/API key.')
    }
    return { url, db, username: login, uid }
  }

  async searchRead<T>(
    model: string,
    domain: unknown[],
    fields: string[],
    opts: { order?: string; limit?: number } = {}
  ): Promise<T[]> {
    return this.executeKw<T[]>(model, 'search_read', [domain, fields], opts)
  }

  async executeKw<T>(model: string, method: string, args: unknown[], kwargs: Record<string, unknown> = {}): Promise<T> {
    return OdooClient.call<T>(this.url, 'object', 'execute_kw', [
      this.db,
      this.uid,
      this.secret,
      model,
      method,
      args,
      kwargs
    ])
  }

  private static async call<T>(url: string, service: string, method: string, args: unknown[]): Promise<T> {
    const endpoint = `${url.replace(/\/+$/, '')}/jsonrpc`

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'call',
        params: { service, method, args },
        id: Math.floor(Math.random() * 1_000_000)
      })
    })

    const rawText = await res.text()

    if (!res.ok) {
      throw new Error(`Odoo request failed: HTTP ${res.status}`)
    }

    let body: { result?: T; error?: JsonRpcError }
    try {
      body = JSON.parse(rawText)
    } catch {
      throw new Error(
        `Odoo returned a non-JSON response (likely wrong URL, redirected to login page, or blocked by a proxy). Status ${res.status}, content-type ${res.headers.get('content-type')}.`
      )
    }
    if (body.error) {
      const message = body.error.data?.message ?? body.error.message
      throw new Error(`Odoo error: ${message}`)
    }
    return body.result as T
  }
}

export function clientFromCredentials(creds: OdooCredentials, uid: number): OdooClient {
  return new OdooClient(creds.url, creds.db, uid, creds.secret)
}
