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

describe('usePermissions – email platform permissions', () => {
  it('grants email config view with EMAIL_CONFIG_VIEW', () => {
    mockAuthState.currentUser = { permissionCodes: ['EMAIL_CONFIG_VIEW'] }
    const { result } = renderHook(() => usePermissions())

    expect(result.current.canViewEmailConfig).toBe(true)
    expect(result.current.canManageEmailConfig).toBe(false)
    expect(result.current.canAccessEmailAdmin).toBe(true)
  })

  it('grants email config manage (implies view) with EMAIL_CONFIG_MANAGE', () => {
    mockAuthState.currentUser = { permissionCodes: ['EMAIL_CONFIG_MANAGE'] }
    const { result } = renderHook(() => usePermissions())

    expect(result.current.canViewEmailConfig).toBe(true)
    expect(result.current.canManageEmailConfig).toBe(true)
    expect(result.current.canAccessEmailAdmin).toBe(true)
  })

  it('grants ingress event view via EMAIL_OPERATIONS_VIEW', () => {
    mockAuthState.currentUser = { permissionCodes: ['EMAIL_OPERATIONS_VIEW'] }
    const { result } = renderHook(() => usePermissions())

    expect(result.current.canViewIngressEvents).toBe(true)
    expect(result.current.canManageIngressEvents).toBe(false)
    expect(result.current.canAccessEmailAdmin).toBe(true)
  })

  it('grants ingress event manage (implies view) via EMAIL_OPERATIONS_MANAGE', () => {
    mockAuthState.currentUser = { permissionCodes: ['EMAIL_OPERATIONS_MANAGE'] }
    const { result } = renderHook(() => usePermissions())

    expect(result.current.canViewIngressEvents).toBe(true)
    expect(result.current.canManageIngressEvents).toBe(true)
    expect(result.current.canAccessEmailAdmin).toBe(true)
  })

  it('grants ticket email view via TICKET_EMAIL_VIEW', () => {
    mockAuthState.currentUser = { permissionCodes: ['TICKET_EMAIL_VIEW'] }
    const { result } = renderHook(() => usePermissions())

    expect(result.current.canViewTicketEmail).toBe(true)
    expect(result.current.canSendTicketEmailReply).toBe(false)
  })

  it('grants ticket email reply via TICKET_EMAIL_REPLY_SEND', () => {
    mockAuthState.currentUser = { permissionCodes: ['TICKET_EMAIL_REPLY_SEND'] }
    const { result } = renderHook(() => usePermissions())

    expect(result.current.canSendTicketEmailReply).toBe(true)
    expect(result.current.canViewTicketEmail).toBe(false)
  })

  it('grants public reply with CUSTOMER_REPLY_SEND', () => {
    mockAuthState.currentUser = { permissionCodes: ['CUSTOMER_REPLY_SEND'] }
    const { result } = renderHook(() => usePermissions())

    expect(result.current.canAddPublicReply).toBe(true)
  })

  it('returns all email flags false when no permissions', () => {
    mockAuthState.currentUser = { permissionCodes: [] }
    const { result } = renderHook(() => usePermissions())

    expect(result.current.canViewEmailConfig).toBe(false)
    expect(result.current.canManageEmailConfig).toBe(false)
    expect(result.current.canViewIngressEvents).toBe(false)
    expect(result.current.canManageIngressEvents).toBe(false)
    expect(result.current.canViewTicketEmail).toBe(false)
    expect(result.current.canSendTicketEmailReply).toBe(false)
    expect(result.current.canAccessEmailAdmin).toBe(false)
  })

  it('canAccessEmailAdmin is true with any email admin permission', () => {
    for (const code of ['EMAIL_CONFIG_VIEW', 'EMAIL_CONFIG_MANAGE', 'EMAIL_OPERATIONS_VIEW', 'EMAIL_OPERATIONS_MANAGE']) {
      mockAuthState.currentUser = { permissionCodes: [code] }
      const { result } = renderHook(() => usePermissions())
      expect(result.current.canAccessEmailAdmin).toBe(true)
    }
  })
})
