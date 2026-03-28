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

// Spec: GET /api/users returns bare array { id, username, fullName, role, isActive }[]
const realService = {
  getAll: async (): Promise<User[]> => {
    const res = await apiClient.get<Record<string, unknown>[]>('/users')
    return res.map(normalizeUser)
  },

  getById: async (id: string): Promise<User | null> => {
    const raw = await apiClient.get<Record<string, unknown> | null>(`/users/${id}`)
    return raw ? normalizeUser(raw) : null
  },

  /**
   * POST /api/users
   * Spec body: { username, email, fullName, password, role, groupIds?, isActive? }
   * Accepts any User-like object; only spec-required fields are forwarded.
   */
  create: async (data: Partial<User> & { username?: string; password?: string; email?: string; fullName?: string; role?: string }): Promise<User> => {
    const body: Record<string, unknown> = {
      username: data.username ?? data.email ?? '',
      email: data.email ?? '',
      fullName: data.fullName ?? `${(data as Record<string, unknown>).firstName ?? ''} ${(data as Record<string, unknown>).lastName ?? ''}`.trim(),
      password: data.password ?? '',
      role: String(data.role ?? 'AGENT').toUpperCase(),
    }
    if (data.groupIds?.length) body.groupIds = data.groupIds.map(Number)
    if (data.isActive !== undefined) body.isActive = data.isActive
    const raw = await apiClient.post<Record<string, unknown>>('/users', body)
    return normalizeUser(raw)
  },

  /**
   * PUT /api/users/{id}
   * Spec body: { email, fullName, role, isActive, groupIds?, password? }
   * Accepts any User-like partial; only spec-required fields are forwarded.
   */
  update: async (id: string, data: Partial<User> & { password?: string; email?: string; fullName?: string; role?: string }): Promise<User> => {
    const body: Record<string, unknown> = {
      email: data.email ?? '',
      fullName: data.fullName ?? `${(data as Record<string, unknown>).firstName ?? ''} ${(data as Record<string, unknown>).lastName ?? ''}`.trim(),
      role: String(data.role ?? 'AGENT').toUpperCase(),
      isActive: data.isActive ?? true,
    }
    if (data.groupIds?.length) body.groupIds = data.groupIds.map(Number)
    if (data.password) body.password = data.password
    const raw = await apiClient.put<Record<string, unknown>>(`/users/${id}`, body)
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
