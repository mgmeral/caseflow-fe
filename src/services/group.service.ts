import type { Group } from '@/types/user.types'
import { apiClient } from './api.client'
import { normalizeGroup } from './normalizers'
import { toArrayPayload } from '@/lib/apiList'

export const groupService = {
  getAll: async (): Promise<Group[]> => {
    const res = await apiClient.get<unknown>('/groups')
    return toArrayPayload(res).map((item) => normalizeGroup(item as Record<string, unknown>))
  },

  getById: async (id: string): Promise<Group | null> => {
    const raw = await apiClient.get<Record<string, unknown> | null>(`/groups/${id}`)
    return raw ? normalizeGroup(raw) : null
  },

  create: async (data: { name: string; groupTypeId: number; description?: string; userIds?: number[] }): Promise<Group> => {
    const raw = await apiClient.post<Record<string, unknown>>('/groups', {
      name: data.name,
      groupTypeId: data.groupTypeId,
      ...(data.description ? { description: data.description } : {}),
      ...(data.userIds?.length ? { userIds: data.userIds } : {}),
    })
    return normalizeGroup(raw)
  },

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
    const raw = await apiClient.patch<Record<string, unknown> | undefined>(`/groups/${id}/activate`, {})
    if (raw && typeof raw === 'object') return normalizeGroup(raw)
    const refreshed = await apiClient.get<Record<string, unknown>>(`/groups/${id}`)
    return normalizeGroup(refreshed)
  },

  deactivate: async (id: string): Promise<Group> => {
    const raw = await apiClient.patch<Record<string, unknown> | undefined>(`/groups/${id}/deactivate`, {})
    if (raw && typeof raw === 'object') return normalizeGroup(raw)
    const refreshed = await apiClient.get<Record<string, unknown>>(`/groups/${id}`)
    return normalizeGroup(refreshed)
  },
}
