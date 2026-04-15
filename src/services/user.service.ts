import type { User, UserProfile } from '@/types/user.types'
import type {
  ChangePasswordRequest,
  CreateUserRequest,
  UpdateUserProfileRequest,
  UpdateUserRequest,
  UserProfileResponse,
} from '@/types/api.types'
import { apiClient } from './api.client'
import { ApiError } from './api.client'
import { normalizeUser, normalizeUserProfile } from './normalizers'

async function withEndpointFallback<T>(requests: Array<() => Promise<T>>): Promise<T> {
  let lastError: unknown = null

  for (const request of requests) {
    try {
      return await request()
    } catch (error) {
      if (error instanceof ApiError && [404, 405].includes(error.status)) {
        lastError = error
        continue
      }
      throw error
    }
  }

  if (lastError) throw lastError
  throw new Error('No compatible user profile endpoint is available.')
}

function createProfilePayload(data: UpdateUserProfileRequest): Record<string, unknown> {
  const firstName = data.firstName?.trim() ?? ''
  const lastName = data.lastName?.trim() ?? ''
  const displayName = data.displayName?.trim() ?? ''
  const fallbackDisplayName = `${firstName} ${lastName}`.trim()

  return {
    displayName: displayName || fallbackDisplayName,
    firstName,
    lastName,
    locale: data.locale,
  }
}

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

  getProfile: async (): Promise<UserProfile> => {
    const raw = await withEndpointFallback<Record<string, unknown>>([
      () => apiClient.get<UserProfileResponse>('/users/me') as unknown as Promise<Record<string, unknown>>,
      () => apiClient.get<UserProfileResponse>('/users/profile') as unknown as Promise<Record<string, unknown>>,
      () => apiClient.get<UserProfileResponse>('/auth/me') as unknown as Promise<Record<string, unknown>>,
    ])

    return normalizeUserProfile(raw)
  },

  updateProfile: async (data: UpdateUserProfileRequest): Promise<UserProfile> => {
    const payload = createProfilePayload(data)

    const raw = await withEndpointFallback<Record<string, unknown> | undefined>([
      () => apiClient.put<Record<string, unknown>>('/users/me', payload),
      () => apiClient.patch<Record<string, unknown>>('/users/me', payload),
      () => apiClient.put<Record<string, unknown>>('/users/profile', payload),
      () => apiClient.patch<Record<string, unknown>>('/users/profile', payload),
    ])

    if (raw && typeof raw === 'object') {
      return normalizeUserProfile(raw)
    }

    return userService.getProfile()
  },

  changePassword: async (data: ChangePasswordRequest): Promise<void> => {
    const payload = {
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    }

    await withEndpointFallback<void>([
      () => apiClient.post<void>('/users/me/change-password', payload),
      () => apiClient.post<void>('/users/change-password', payload),
      () => apiClient.patch<void>('/users/me/password', payload),
      () => apiClient.post<void>('/auth/change-password', payload),
    ])
  },
}
