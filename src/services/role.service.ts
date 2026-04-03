import type { RoleRecord, RoleSummaryRecord, PermissionDef } from '@/types/user.types'
import type { CreateRoleRequest, RoleDetailResponse, RoleResponse, RoleTicketScope, UpdateRoleRequest } from '@/types/api.types'
import { apiClient } from './api.client'

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

export const roleService = {
  getAll: async (): Promise<RoleSummaryRecord[]> => {
    const res = await apiClient.get<RoleResponse[] | unknown>('/roles')
    return toArrayPayload(res).map(normalizeRoleSummary)
  },

  getById: async (id: string): Promise<RoleRecord> => {
    const res = await apiClient.get<RoleDetailResponse | unknown>(`/roles/${id}`)
    return normalizeRole(res)
  },

  getPermissions: async (): Promise<PermissionDef[]> => {
    const res = await apiClient.get<unknown>('/roles/permissions')
    return toArrayPayload(res).map(normalizePermDef).filter((p) => p.code.length > 0)
  },

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

  activate: async (id: string): Promise<RoleRecord> => {
    const raw = await apiClient.patch<Record<string, unknown> | undefined>(`/roles/${id}/activate`, {})
    if (raw && typeof raw === 'object') return normalizeRole(raw)
    const refreshed = await apiClient.get<RoleDetailResponse | unknown>(`/roles/${id}`)
    return normalizeRole(refreshed)
  },

  deactivate: async (id: string): Promise<RoleRecord> => {
    const raw = await apiClient.patch<Record<string, unknown> | undefined>(`/roles/${id}/deactivate`, {})
    if (raw && typeof raw === 'object') return normalizeRole(raw)
    const refreshed = await apiClient.get<RoleDetailResponse | unknown>(`/roles/${id}`)
    return normalizeRole(refreshed)
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete<void>(`/roles/${id}`)
  },
}
