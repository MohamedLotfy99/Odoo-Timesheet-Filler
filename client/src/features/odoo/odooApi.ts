import { apiJson } from '../../utils/apiUrl'

export interface OdooOption {
  id: number
  name: string
}

export const odooApi = {
  listProjects: (): Promise<OdooOption[]> => apiJson('/api/odoo/projects'),
  listTasks: (projectId: number): Promise<OdooOption[]> =>
    apiJson(`/api/odoo/tasks?project_id=${projectId}`)
}
