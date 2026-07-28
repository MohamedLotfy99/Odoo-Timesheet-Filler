import type { HistoryEntry } from '../../shared/types'
import { apiJson } from '../../utils/apiUrl'

export const historyApi = {
  list: (): Promise<HistoryEntry[]> => apiJson('/api/history'),
  update: (input: { id: string; description: string; duration: string; date: string }): Promise<HistoryEntry> =>
    apiJson(`/api/history/${input.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ description: input.description, duration: input.duration, date: input.date })
    }),
  delete: (id: string): Promise<void> => apiJson(`/api/history/${id}`, { method: 'DELETE' })
}
