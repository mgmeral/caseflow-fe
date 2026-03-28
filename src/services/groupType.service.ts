import type { GroupType } from '@/types/user.types'
import { apiClient } from './api.client'
import { USE_MOCKS } from '@/lib/env'
import { mockGroupTypes, getMockDelay } from '@/mock'

// Local mutable copy for mock mode so created types persist within the session
let _mockGroupTypes = [...mockGroupTypes]

const mockService = {
  getAll: async (): Promise<GroupType[]> => {
    await getMockDelay()
    return [..._mockGroupTypes]
  },

  create: async (data: { code: string; name: string; description?: string }): Promise<GroupType> => {
    await getMockDelay()
    const newType: GroupType = {
      id: String(Date.now()),
      code: data.code.toUpperCase().trim(),
      name: data.name.trim(),
    }
    _mockGroupTypes = [..._mockGroupTypes, newType]
    return { ...newType }
  },
}

const realService = {
  /** GET /api/group-types → GroupType[] */
  getAll: async (): Promise<GroupType[]> => {
    const res = await apiClient.get<{ id: number | string; code: string; name: string }[]>('/group-types')
    return res.map((item) => ({
      id: String(item.id),
      code: item.code,
      name: item.name,
    }))
  },

  /** POST /api/group-types → GroupType */
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

export const groupTypeService = USE_MOCKS ? mockService : realService
