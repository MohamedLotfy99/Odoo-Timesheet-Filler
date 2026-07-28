import type { OdooCredentials, OdooSession } from '../../shared/types'
import { apiJson } from '../../utils/apiUrl'

export const authApi = {
  login: (creds: OdooCredentials): Promise<OdooSession> =>
    apiJson('/api/auth/login', { method: 'POST', body: JSON.stringify(creds) }),
  logout: (): Promise<void> => apiJson('/api/auth/logout', { method: 'POST' }),
  restoreSession: async (): Promise<OdooSession | null> => {
    try {
      return await apiJson<OdooSession>('/api/auth/me')
    } catch {
      return null
    }
  }
}
