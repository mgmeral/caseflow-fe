import type { RoleRecord, RoleSummaryRecord, PermissionDef } from '@/types/user.types'
import type { CreateRoleRequest, RoleDetailResponse, RoleResponse, RoleTicketScope, UpdateRoleRequest } from '@/types/api.types'
import { apiClient } from './api.client'
import { USE_MOCKS } from '@/lib/env'
import { mockRoles, mockPermissionDefs, getMockDelay } from '@/mock'

let _mockRoles = [...mockRoles]

function toArrayPayload(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw
  if (!raw || typeof raw !== 'object') return []
  const obj = raw as Record<string, unknown>
  if (Array.isArray(obj.items)) return obj.items
  if (Array.isArray(obj.content)) return obj.content
  if (Array.isArray(obj.data)) return obj.data
  if (Array.isArray(obj.results)) return obj.results
  return []
}

function normalizePermissionCode(raw: unknown): string {
  if (typeof raw === 'string') return raw
  if (!raw || typeof raw !== 'object') return ''

  const src = raw as Record<string, unknown>
  const nestedPermission = src.permission && typeof src.permission === 'object'
    ? (src.permission as Record<string, unknown>)
    : null
  const nestedDefinition = src.definition && typeof src.definition === 'object'
    ? (src.definition as Record<string, unknown>)
    : null

  return String(
    src.code ??
    src.permissionCode ??
    src.permission ??
    src.name ??
    nestedPermission?.code ??
    nestedPermission?.permissionCode ??
    nestedPermission?.name ??
    nestedDefinition?.code ??
    nestedDefinition?.permissionCode ??
    nestedDefinition?.name ??
    '',
  )
}

function normalizePermissionCodes(raw: unknown): string[] {
  const values = toArrayPayload(raw)
  const codes = values
    .map(normalizePermissionCode)
    .filter((code) => code.length > 0)

  return Array.from(new Set(codes))
}

const mockService = {
  getAll: async (): Promise<RoleSummaryRecord[]> => {
    await getMockDelay()
    return _mockRoles.map((role) => ({
      id: role.id,
      code: role.code,
      name: role.name,
      ticketScope: role.ticketScope,
      isActive: role.isActive,
      permissionCount: role.permissions.length,
      userCount: role.userCount,
    }))
  },

  getPermissions: async (): Promise<PermissionDef[]> => {
    await getMockDelay()
    return [...mockPermissionDefs]
  },

  getById: async (id: string): Promise<RoleRecord> => {
    await getMockDelay()
    const role = _mockRoles.find((item) => item.id === id)
    if (!role) throw new Error('Role not found')
    return { ...role, permissions: [...role.permissions] }
  },

  create: async (data: CreateRoleRequest): Promise<RoleRecord> => {
    await getMockDelay()
    const role: RoleRecord = {
      id: `r-${Date.now()}`,
      code: data.code.trim(),
      name: data.name.trim(),
      description: data.description?.trim(),
      ticketScope: data.ticketScope,
      isActive: true,
      permissions: [...data.permissions],
    }
    _mockRoles = [..._mockRoles, role]
    return { ...role }
  },

  update: async (id: string, data: UpdateRoleRequest): Promise<RoleRecord> => {
    await getMockDelay()
    const idx = _mockRoles.findIndex((r) => r.id === id)
    if (idx === -1) throw new Error('Role not found')
    _mockRoles[idx] = {
      ..._mockRoles[idx],
      code: data.code.trim(),
      name: data.name.trim(),
      description: data.description?.trim(),
      ticketScope: data.ticketScope,
      permissions: [...data.permissions],
    }
    return { ..._mockRoles[idx] }
  },

  activate: async (id: string): Promise<RoleRecord> => {
    await getMockDelay()
    const idx = _mockRoles.findIndex((r) => r.id === id)
    if (idx === -1) throw new Error('Role not found')
    _mockRoles[idx] = { ..._mockRoles[idx], isActive: true }
    return { ..._mockRoles[idx] }
  },

  deactivate: async (id: string): Promise<RoleRecord> => {
    await getMockDelay()
    const idx = _mockRoles.findIndex((r) => r.id === id)
    if (idx === -1) throw new Error('Role not found')
    _mockRoles[idx] = { ..._mockRoles[idx], isActive: false }
    return { ..._mockRoles[idx] }
  },

  delete: async (id: string): Promise<void> => {
    await getMockDelay()
    _mockRoles = _mockRoles.filter((r) => r.id !== id)
  },
}

function normalizeRole(raw: unknown): RoleRecord {
  const src = (raw && typeof raw === 'object') ? (raw as Record<string, unknown>) : {}
  const ticketScopeRaw = String(src.ticketScope ?? 'ASSIGNED_ONLY')
  const ticketScope: RoleTicketScope =
    ticketScopeRaw === 'ALL' ||
    ticketScopeRaw === 'OWN_GROUPS' ||
    ticketScopeRaw === 'OWN_AND_OWN_GROUPS' ||
    ticketScopeRaw === 'ASSIGNED_ONLY'
      ? ticketScopeRaw
      : 'ASSIGNED_ONLY'

  return {
    id: String(src.id ?? ''),
    code: String(src.code ?? ''),
    name: String(src.name ?? ''),
    description: src.description ? String(src.description) : undefined,
    ticketScope,
    isActive: src.isActive !== false,
    permissions: normalizePermissionCodes(src.permissions ?? src.permissionCodes ?? []),
    userCount: typeof src.userCount === 'number' ? src.userCount : undefined,
  }
}

function normalizeRoleSummary(raw: unknown): RoleSummaryRecord {
  const src = (raw && typeof raw === 'object') ? (raw as Record<string, unknown>) : {}
  const ticketScopeRaw = String(src.ticketScope ?? 'ASSIGNED_ONLY')
  const ticketScope: RoleTicketScope =
    ticketScopeRaw === 'ALL' ||
    ticketScopeRaw === 'OWN_GROUPS' ||
    ticketScopeRaw === 'OWN_AND_OWN_GROUPS' ||
    ticketScopeRaw === 'ASSIGNED_ONLY'
      ? ticketScopeRaw
      : 'ASSIGNED_ONLY'

  return {
    id: String(src.id ?? ''),
    code: String(src.code ?? ''),
    name: String(src.name ?? ''),
    ticketScope,
    isActive: src.isActive !== false,
    permissionCount: typeof src.permissionCount === 'number'
      ? src.permissionCount
      : normalizePermissionCodes(src.permissions ?? src.permissionCodes ?? []).length,
    userCount: typeof src.userCount === 'number' ? src.userCount : undefined,
  }
}

function normalizePermDef(raw: unknown): PermissionDef {
  if (typeof raw === 'string') {
    return { code: raw, label: raw }
  }

  const src = (raw && typeof raw === 'object') ? (raw as Record<string, unknown>) : {}
  const nestedPermission = src.permission && typeof src.permission === 'object'
    ? (src.permission as Record<string, unknown>)
    : null
  const nestedDefinition = src.definition && typeof src.definition === 'object'
    ? (src.definition as Record<string, unknown>)
    : null
  const code = String(
    src.code ??
    src.permissionCode ??
    src.permission ??
    src.name ??
    nestedPermission?.code ??
    nestedPermission?.permissionCode ??
    nestedPermission?.name ??
    nestedDefinition?.code ??
    nestedDefinition?.permissionCode ??
    nestedDefinition?.name ??
    '',
  )

  return {
    code,
    label: String(src.label ?? nestedPermission?.label ?? nestedDefinition?.label ?? code),
    description: src.description
      ? String(src.description)
      : nestedPermission?.description
        ? String(nestedPermission.description)
        : nestedDefinition?.description
          ? String(nestedDefinition.description)
          : undefined,
    category: src.category
      ? String(src.category)
      : nestedPermission?.category
        ? String(nestedPermission.category)
        : nestedDefinition?.category
          ? String(nestedDefinition.category)
          : undefined,
  }
}

const realService = {
  /** GET /api/roles */
  getAll: async (): Promise<RoleSummaryRecord[]> => {
    const res = await apiClient.get<RoleResponse[] | unknown>('/roles')
    return toArrayPayload(res).map(normalizeRoleSummary)
  },

  /** GET /api/roles/{id} */
  getById: async (id: string): Promise<RoleRecord> => {
    const res = await apiClient.get<RoleDetailResponse | unknown>(`/roles/${id}`)
    return normalizeRole(res)
  },

  /** GET /api/roles/permissions */
  getPermissions: async (): Promise<PermissionDef[]> => {
    const res = await apiClient.get<unknown>('/roles/permissions')
    return toArrayPayload(res).map(normalizePermDef).filter((p) => p.code.length > 0)
  },

  /** POST /api/roles */
  create: async (data: CreateRoleRequest): Promise<RoleRecord> => {
    const raw = await apiClient.post<Record<string, unknown>>('/roles', {
      code: data.code.trim(),
      name: data.name.trim(),
      ...(data.description?.trim() ? { description: data.description.trim() } : {}),
      ticketScope: data.ticketScope,
      permissions: data.permissions,
    })
    return normalizeRole(raw)
  },

  /** PUT /api/roles/{id} */
  update: async (id: string, data: UpdateRoleRequest): Promise<RoleRecord> => {
    const raw = await apiClient.put<Record<string, unknown>>(`/roles/${id}`, {
      code: data.code.trim(),
      name: data.name.trim(),
      ...(data.description?.trim() ? { description: data.description.trim() } : {}),
      ticketScope: data.ticketScope,
      permissions: data.permissions,
    })
    return normalizeRole(raw)
  },

  /** PATCH /api/roles/{id}/activate */
  activate: async (id: string): Promise<RoleRecord> => {
    const raw = await apiClient.patch<Record<string, unknown>>(`/roles/${id}/activate`, {})
    return normalizeRole(raw)
  },

  /** PATCH /api/roles/{id}/deactivate */
  deactivate: async (id: string): Promise<RoleRecord> => {
    const raw = await apiClient.patch<Record<string, unknown>>(`/roles/${id}/deactivate`, {})
    return normalizeRole(raw)
  },

  /** DELETE /api/roles/{id} */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete<void>(`/roles/${id}`)
  },
}

export const roleService = USE_MOCKS ? mockService : realService
