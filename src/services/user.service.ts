import type { User } from '@/types/user.types'
import type { CreateUserRequest, UpdateUserRequest } from '@/types/api.types'
import { apiClient } from './api.client'
import { USE_MOCKS } from '@/lib/env'
import { mockUsers, mockRoles, getMockDelay } from '@/mock'
import { normalizeUser } from './normalizers'

let _mockUsers = [...mockUsers]

function legacyRoleFromCode(code?: string): User['role'] {
  if (code === 'ADMIN') return 'admin'
  if (code === 'VIEWER') return 'viewer'
  return 'agent'
}

const mockService = {
  getAll: async (): Promise<User[]> => {
    await getMockDelay()
    return [..._mockUsers]
  },

  getById: async (id: string): Promise<User | null> => {
    await getMockDelay()
    return _mockUsers.find((u) => u.id === id) ?? null
  },

  create: async (data: CreateUserRequest): Promise<User> => {
    await getMockDelay()
    const role = mockRoles.find((r) => r.id === String(data.roleId))
    const fullName = data.fullName.trim()
    const parts = fullName.split(' ')
    const firstName = parts[0] ?? ''
    const lastName = parts.slice(1).join(' ')
    const newUser: User = {
      id: `u-${Date.now()}`,
      username: data.username,
      firstName,
      lastName,
      fullName,
      email: data.email,
      role: legacyRoleFromCode(role?.code),
      roleId: role?.id,
      roleCode: role?.code,
      roleName: role?.name,
      permissionCodes: role?.permissions ?? [],
      ticketScope: role?.ticketScope === 'ALL' ? 'ALL' : role?.ticketScope === 'OWN_GROUPS' ? 'GROUP' : 'OWN',
      groupIds: data.groupIds?.map(String) ?? [],
      groupNames: [],
      adminLevel: 0,
      isActive: data.isActive ?? true,
      lastLoginAt: null,
      openTicketCount: 0,
      avatarColor: '#4f46e5',
    }
    _mockUsers.push(newUser)
    return { ...newUser }
  },

  update: async (id: string, data: UpdateUserRequest): Promise<User> => {
    await getMockDelay()
    const idx = _mockUsers.findIndex((u) => u.id === id)
    if (idx === -1) throw new Error('User not found')
    const role = mockRoles.find((r) => r.id === String(data.roleId))
    const fullName = data.fullName.trim()
    const parts = fullName.split(' ')
    _mockUsers[idx] = {
      ..._mockUsers[idx],
      username: data.username,
      firstName: parts[0] ?? '',
      lastName: parts.slice(1).join(' '),
      fullName,
      email: data.email,
      role: legacyRoleFromCode(role?.code),
      roleId: role?.id,
      roleCode: role?.code,
      roleName: role?.name,
      permissionCodes: role?.permissions ?? _mockUsers[idx].permissionCodes,
      ticketScope: role?.ticketScope === 'ALL' ? 'ALL' : role?.ticketScope === 'OWN_GROUPS' ? 'GROUP' : 'OWN',
      groupIds: data.groupIds?.map(String) ?? _mockUsers[idx].groupIds,
      isActive: data.isActive,
    }
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

  /** POST /api/users */
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

  /** PUT /api/users/{id} */
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
    const raw = await apiClient.patch<Record<string, unknown>>(`/users/${id}/activate`, {})
    return normalizeUser(raw)
  },

  deactivate: async (id: string): Promise<User> => {
    const raw = await apiClient.patch<Record<string, unknown>>(`/users/${id}/deactivate`, {})
    return normalizeUser(raw)
  },
}

export const userService = USE_MOCKS ? mockService : realService
