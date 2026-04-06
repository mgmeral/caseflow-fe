import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'

const mockAuthState = vi.hoisted(() => ({
  currentUser: null as { permissionCodes?: string[]; role?: string; roleCode?: string; roleName?: string } | null,
}))

vi.mock('@/store/auth.store', () => ({
  useAuthStore: (selector?: (s: typeof mockAuthState) => unknown) =>
    selector ? selector(mockAuthState) : mockAuthState,
}))

const { usePermissions } = await import('@/hooks/usePermissions')

describe('usePermissions', () => {
  it('returns all false when user has no permissions', () => {
    mockAuthState.currentUser = { permissionCodes: [] }
    const { result } = renderHook(() => usePermissions())

    expect(result.current.canViewAdminPool).toBe(false)
    expect(result.current.canManageRoles).toBe(false)
    expect(result.current.canAssignTickets).toBe(false)
    expect(result.current.canChangeStatus).toBe(false)
    expect(result.current.canManageIntegrationConfig).toBe(false)
    expect(result.current.canManageScheduledEmail).toBe(false)
  })

  it('enables flags by permission code membership', () => {
    mockAuthState.currentUser = {
      permissionCodes: ['ADMIN_POOL_VIEW', 'ROLE_MANAGE', 'TICKET_STATUS_CHANGE', 'REPORT_VIEW', 'INTEGRATION_CONFIG_MANAGE', 'SCHEDULED_EMAIL_MANAGE'],
      roleCode: 'SUPERVISOR',
      roleName: 'Supervisor',
    }

    const { result } = renderHook(() => usePermissions())

    expect(result.current.canViewAdminPool).toBe(true)
    expect(result.current.canManageRoles).toBe(true)
    expect(result.current.canChangeStatus).toBe(true)
    expect(result.current.canViewReports).toBe(true)
    expect(result.current.canManageIntegrationConfig).toBe(true)
    expect(result.current.canManageScheduledEmail).toBe(true)
    expect(result.current.canManageUsers).toBe(false)
    expect(result.current.roleCode).toBe('SUPERVISOR')
    expect(result.current.roleName).toBe('Supervisor')
  })

  it('accepts legacy aliased integration permissions for backward compatibility', () => {
    mockAuthState.currentUser = {
      permissionCodes: ['PERM_INTEGRATION_CONFIG_MANAGE', 'PERM_SCHEDULED_EMAIL_MANAGE'],
    }

    const { result } = renderHook(() => usePermissions())

    expect(result.current.canManageIntegrationConfig).toBe(true)
    expect(result.current.canManageScheduledEmail).toBe(true)
  })
})
