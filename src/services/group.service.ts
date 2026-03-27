import type { Group } from '@/types/user.types'
import { apiClient } from './api.client'
import { USE_MOCKS } from '@/lib/env'
import { mockGroups, getMockDelay } from '@/mock'
import { normalizeGroup } from './normalizers'

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

// Backend may return a plain array, PagedResponse { items }, or legacy { data }
type GroupListResponse = Record<string, unknown>[] | { items: Record<string, unknown>[] } | { data: Record<string, unknown>[] }

function extractGroupList(res: GroupListResponse): Group[] {
  const raws = Array.isArray(res) ? res : ('items' in res ? res.items : res.data)
  return raws.map(normalizeGroup)
}

const realService = {
  getAll: async (): Promise<Group[]> => {
    const res = await apiClient.get<GroupListResponse>('/groups')
    return extractGroupList(res)
  },

  getById: async (id: string): Promise<Group | null> => {
    const raw = await apiClient.get<Record<string, unknown> | null>(`/groups/${id}`)
    return raw ? normalizeGroup(raw) : null
  },

  create: async (data: Omit<Group, 'id' | 'openTicketCount'>): Promise<Group> => {
    const raw = await apiClient.post<Record<string, unknown>>('/groups', data)
    return normalizeGroup(raw)
  },

  update: async (id: string, data: Partial<Group>): Promise<Group> => {
    const raw = await apiClient.put<Record<string, unknown>>(`/groups/${id}`, data)
    return normalizeGroup(raw)
  },

  activate: async (id: string): Promise<Group> => {
    const raw = await apiClient.patch<Record<string, unknown>>(`/groups/${id}/activate`, {})
    return normalizeGroup(raw)
  },

  deactivate: async (id: string): Promise<Group> => {
    const raw = await apiClient.patch<Record<string, unknown>>(`/groups/${id}/deactivate`, {})
    return normalizeGroup(raw)
  },
}

export const groupService = USE_MOCKS ? mockService : realService
