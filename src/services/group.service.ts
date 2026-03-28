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

  create: async (data: { name: string; groupTypeId?: number; description?: string; userIds?: number[] }): Promise<Group> => {
    await getMockDelay()
    const userIds: string[] = Array.isArray(data.userIds) ? data.userIds.map(String) : []
    const newGroup: Group = {
      id: `g-${Date.now()}`,
      name: data.name,
      groupTypeId: String(data.groupTypeId ?? ''),
      groupTypeCode: '',
      groupTypeName: '',
      description: data.description ?? '',
      isActive: true,
      memberCount: userIds.length,
      memberIds: userIds,
    }
    _mockGroups.push(newGroup)
    return { ...newGroup }
  },

  update: async (id: string, data: { name?: string; groupTypeId?: number; description?: string; userIds?: number[] }): Promise<Group> => {
    await getMockDelay()
    const idx = _mockGroups.findIndex((g) => g.id === id)
    if (idx === -1) throw new Error('Group not found')
    const userIds: string[] | undefined = Array.isArray(data.userIds) ? data.userIds.map(String) : undefined
    _mockGroups[idx] = {
      ..._mockGroups[idx],
      ...(data.name ? { name: data.name } : {}),
      ...(data.groupTypeId !== undefined ? { groupTypeId: String(data.groupTypeId) } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(userIds !== undefined ? { memberIds: userIds, memberCount: userIds.length } : {}),
    }
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

// Spec: GET /api/groups returns bare array { id, name, type, isActive }[]
const realService = {
  getAll: async (): Promise<Group[]> => {
    const res = await apiClient.get<Record<string, unknown>[]>('/groups')
    return res.map(normalizeGroup)
  },

  getById: async (id: string): Promise<Group | null> => {
    const raw = await apiClient.get<Record<string, unknown> | null>(`/groups/${id}`)
    return raw ? normalizeGroup(raw) : null
  },

  /**
   * POST /api/groups
   * Body: { name, groupTypeId, description?, userIds? }
   */
  create: async (data: { name: string; groupTypeId: number; description?: string; userIds?: number[] }): Promise<Group> => {
    const raw = await apiClient.post<Record<string, unknown>>('/groups', {
      name: data.name,
      groupTypeId: data.groupTypeId,
      ...(data.description ? { description: data.description } : {}),
      ...(data.userIds?.length ? { userIds: data.userIds } : {}),
    })
    return normalizeGroup(raw)
  },

  /**
   * PUT /api/groups/{id}
   * Body: { name, groupTypeId, description?, userIds? }
   */
  update: async (id: string, data: { name?: string; groupTypeId?: number; description?: string; userIds?: number[] }): Promise<Group> => {
    const raw = await apiClient.put<Record<string, unknown>>(`/groups/${id}`, {
      name: data.name,
      groupTypeId: data.groupTypeId,
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.userIds !== undefined ? { userIds: data.userIds } : {}),
    })
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
