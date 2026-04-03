import type { User } from '@/types/user.types'
import type { CreateUserRequest, UpdateUserRequest } from '@/types/api.types'
import { apiClient } from './api.client'
import { normalizeUser } from './normalizers'

export const userService = {
  getAll: async (): Promise<User[]> => {
    const res = await apiClient.get<Record<string, unknown>[]>('/users')
    return res.map(normalizeUser)
  },

  getById: async (id: string): Promise<User | null> => {
    const raw = await apiClient.get<Record<string, unknown> | null>(`/users/${id}`)
    return raw ? normalizeUser(raw) : null
  },

  create: async (data: CreateUserRequest): Promise<User> => {
    const body: Record<string, unknown> = {
      username: data.username,
      email: data.email,
      fullName: data.fullName,
      password: data.password,
      roleId: data.roleId,
      groupIds: data.groupIds ?? [],
      isActive: data.isActive ?? true,
    }
    const raw = await apiClient.post<Record<string, unknown>>('/users', body)
    return normalizeUser(raw)
  },

  update: async (id: string, data: UpdateUserRequest): Promise<User> => {
    const body: Record<string, unknown> = {
      username: data.username,
      email: data.email,
      fullName: data.fullName,
      roleId: data.roleId,
      isActive: data.isActive,
      groupIds: data.groupIds ?? [],
    }
    if (data.password) body.password = data.password
    const raw = await apiClient.put<Record<string, unknown>>(`/users/${id}`, body)
    return normalizeUser(raw)
  },

  activate: async (id: string): Promise<User> => {
    const raw = await apiClient.patch<Record<string, unknown> | undefined>(`/users/${id}/activate`, {})
    if (raw && typeof raw === 'object') return normalizeUser(raw)
    const refreshed = await apiClient.get<Record<string, unknown>>(`/users/${id}`)
    return normalizeUser(refreshed)
  },

  deactivate: async (id: string): Promise<User> => {
    const raw = await apiClient.patch<Record<string, unknown> | undefined>(`/users/${id}/deactivate`, {})
    if (raw && typeof raw === 'object') return normalizeUser(raw)
    const refreshed = await apiClient.get<Record<string, unknown>>(`/users/${id}`)
    return normalizeUser(refreshed)
  },
}
