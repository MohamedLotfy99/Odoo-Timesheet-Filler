import type { AppSettings } from '../../shared/types'
import { apiJson } from '../../utils/apiUrl'

export const settingsApi = {
  get: (): Promise<AppSettings> => apiJson('/api/settings'),
  set: (settings: AppSettings): Promise<void> =>
    apiJson('/api/settings', { method: 'POST', body: JSON.stringify(settings) })
}
