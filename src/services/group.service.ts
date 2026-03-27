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

  activate: async (id: string): Promise<Group> => {
    await getMockDelay()
    const idx = _mockGroups.findIndex((g) => g.id === id)
    if (idx === -1) throw new Error('Group not found')
    _mockGroups[idx] = { ..._mockGroups[idx], isActive: true }
    return { ..._mockGroups[idx] }
  },

  deactivate: async (id: string): Promise<Group> => {
    await getMockDelay()
    const idx = _mockGroups.findIndex((g) => g.id === id)
    if (idx === -1) throw new Error('Group not found')
    _mockGroups[idx] = { ..._mockGroups[idx], isActive: false }
    return { ..._mockGroups[idx] }
  },
}

// Backend may return a plain array or paginated shape (pagination deferred)
type GroupListResponse = Group[] | { data: Group[] }

const realService = {
  getAll: async (): Promise<Group[]> => {
    const res = await apiClient.get<GroupListResponse>('/groups')
    return Array.isArray(res) ? res : res.data
  },

  getById: (id: string) => apiClient.get<Group | null>(`/groups/${id}`),

  create: (data: Omit<Group, 'id' | 'openTicketCount'>) =>
    apiClient.post<Group>('/groups', data),

  update: (id: string, data: Partial<Group>) =>
    apiClient.put<Group>(`/groups/${id}`, data),

  activate: (id: string) =>
    apiClient.patch<Group>(`/groups/${id}/activate`, {}),

  deactivate: (id: string) =>
    apiClient.patch<Group>(`/groups/${id}/deactivate`, {}),
}

export const groupService = USE_MOCKS ? mockService : realService
