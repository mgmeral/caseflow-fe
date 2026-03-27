import type { User } from '@/types/user.types'
import { apiClient } from './api.client'
import { USE_MOCKS } from '@/lib/env'
import { mockUsers, getMockDelay } from '@/mock'
import { normalizeUser } from './normalizers'

let _mockUsers = [...mockUsers]

const mockService = {
  getAll: async (): Promise<User[]> => {
    await getMockDelay()
    return [..._mockUsers]
  },

  getById: async (id: string): Promise<User | null> => {
    await getMockDelay()
    return _mockUsers.find((u) => u.id === id) ?? null
  },

  create: async (data: Omit<User, 'id' | 'openTicketCount'>): Promise<User> => {
    await getMockDelay()
    const newUser: User = { ...data, id: `u-${Date.now()}`, openTicketCount: 0 }
    _mockUsers.push(newUser)
    return { ...newUser }
  },

  update: async (id: string, data: Partial<User>): Promise<User> => {
    await getMockDelay()
    const idx = _mockUsers.findIndex((u) => u.id === id)
    if (idx === -1) throw new Error('User not found')
    _mockUsers[idx] = { ..._mockUsers[idx], ...data }
    return { ..._mockUsers[idx] }
  },

  activate: async (id: string): Promise<User> => {
    await getMockDelay()
    const idx = _mockUsers.findIndex((u) => u.id === id)
    if (idx === -1) throw new Error('User not found')
    _mockUsers[idx] = { ..._mockUsers[idx], isActive: true }
    return { ..._mockUsers[idx] }
  },

  deactivate: async (id: string): Promise<User> => {
    await getMockDelay()
    const idx = _mockUsers.findIndex((u) => u.id === id)
    if (idx === -1) throw new Error('User not found')
    _mockUsers[idx] = { ..._mockUsers[idx], isActive: false }
    return { ..._mockUsers[idx] }
  },
}

// Backend may return a plain array, PagedResponse { items }, or legacy { data }
type UserListResponse = Record<string, unknown>[] | { items: Record<string, unknown>[] } | { data: Record<string, unknown>[] }

function extractUserList(res: UserListResponse): User[] {
  const raws = Array.isArray(res) ? res : ('items' in res ? res.items : res.data)
  return raws.map(normalizeUser)
}

const realService = {
  getAll: async (): Promise<User[]> => {
    const res = await apiClient.get<UserListResponse>('/users')
    return extractUserList(res)
  },

  getById: async (id: string): Promise<User | null> => {
    const raw = await apiClient.get<Record<string, unknown> | null>(`/users/${id}`)
    return raw ? normalizeUser(raw) : null
  },

  create: async (data: Omit<User, 'id' | 'openTicketCount'>): Promise<User> => {
    const raw = await apiClient.post<Record<string, unknown>>('/users', data)
    return normalizeUser(raw)
  },

  update: async (id: string, data: Partial<User>): Promise<User> => {
    const raw = await apiClient.put<Record<string, unknown>>(`/users/${id}`, data)
    return normalizeUser(raw)
  },

  activate: async (id: string): Promise<User> => {
    const raw = await apiClient.patch<Record<string, unknown>>(`/users/${id}/activate`, {})
    return normalizeUser(raw)
  },

  deactivate: async (id: string): Promise<User> => {
    const raw = await apiClient.patch<Record<string, unknown>>(`/users/${id}/deactivate`, {})
    return normalizeUser(raw)
  },
}

export const userService = USE_MOCKS ? mockService : realService
