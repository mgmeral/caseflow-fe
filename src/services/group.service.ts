import type { Group } from '@/types/user.types'
import { apiClient } from './api.client'
import { USE_MOCKS } from '@/lib/env'
import { mockGroups, getMockDelay } from '@/mock'

let _mockGroups = [...mockGroups]

const mockService = {
  getAll: async (): Promise<Group[]> => {
    await getMockDelay()
    return [..._mockGroups]
  },

  getById: async (id: string): Promise<Group | null> => {
    await getMockDelay()
    return _mockGroups.find((g) => g.id === id) ?? null
  },

  create: async (data: Omit<Group, 'id' | 'openTicketCount'>): Promise<Group> => {
    await getMockDelay()
    const newGroup: Group = { ...data, id: `g-${Date.now()}`, openTicketCount: 0 }
    _mockGroups.push(newGroup)
    return { ...newGroup }
  },

  update: async (id: string, data: Partial<Group>): Promise<Group> => {
    await getMockDelay()
    const idx = _mockGroups.findIndex((g) => g.id === id)
    if (idx === -1) throw new Error('Group not found')
    _mockGroups[idx] = { ..._mockGroups[idx], ...data }
    return { ..._mockGroups[idx] }
  },

  delete: async (id: string): Promise<void> => {
    await getMockDelay()
    _mockGroups = _mockGroups.filter((g) => g.id !== id)
  },
}

const realService = {
  getAll: () => apiClient.get<Group[]>('/groups'),
  getById: (id: string) => apiClient.get<Group | null>(`/groups/${id}`),
  create: (data: Omit<Group, 'id' | 'openTicketCount'>) => apiClient.post<Group>('/groups', data),
  update: (id: string, data: Partial<Group>) => apiClient.put<Group>(`/groups/${id}`, data),
  delete: (id: string) => apiClient.delete<void>(`/groups/${id}`),
}

export const groupService = USE_MOCKS ? mockService : realService
