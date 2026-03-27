import type { User } from '@/types/user.types'
import { apiClient } from './api.client'
import { USE_MOCKS } from '@/lib/env'
import { mockUsers, getMockDelay } from '@/mock'

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

// Backend may return a plain array or paginated shape (pagination deferred)
type UserListResponse = User[] | { data: User[] }

const realService = {
  getAll: async (): Promise<User[]> => {
    const res = await apiClient.get<UserListResponse>('/users')
    return Array.isArray(res) ? res : res.data
  },

  getById: (id: string) => apiClient.get<User | null>(`/users/${id}`),

  create: (data: Omit<User, 'id' | 'openTicketCount'>) =>
    apiClient.post<User>('/users', data),

  update: (id: string, data: Partial<User>) =>
    apiClient.put<User>(`/users/${id}`, data),

  activate: (id: string) =>
    apiClient.patch<User>(`/users/${id}/activate`, {}),

  deactivate: (id: string) =>
    apiClient.patch<User>(`/users/${id}/deactivate`, {}),
}

export const userService = USE_MOCKS ? mockService : realService
