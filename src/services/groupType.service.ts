import type { GroupType } from '@/types/user.types'
import { apiClient } from './api.client'

export const groupTypeService = {
  getAll: async (): Promise<GroupType[]> => {
    const res = await apiClient.get<{ id: number | string; code: string; name: string }[]>('/group-types')
    return res.map((item) => ({
      id: String(item.id),
      code: item.code,
      name: item.name,
    }))
  },

  create: async (data: { code: string; name: string; description?: string }): Promise<GroupType> => {
    const res = await apiClient.post<{ id: number | string; code: string; name: string }>(
      '/group-types',
      {
        code: data.code.toUpperCase().trim(),
        name: data.name.trim(),
        ...(data.description?.trim() ? { description: data.description.trim() } : {}),
      },
    )
    return {
      id: String(res.id),
      code: res.code,
      name: res.name,
    }
  },
}
