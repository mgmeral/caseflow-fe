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
  it('grants mailbox management with MAILBOX_MANAGE', () => {
    mockAuthState.currentUser = { permissionCodes: ['MAILBOX_MANAGE'] }
    const { result } = renderHook(() => usePermissions())

    expect(result.current.canManageMailboxes).toBe(true)
    expect(result.current.canAccessEmailAdmin).toBe(true)
    expect(result.current.canManageCustomerEmail).toBe(false)
  })

  it('grants customer email management with CUSTOMER_EMAIL_MANAGE', () => {
    mockAuthState.currentUser = { permissionCodes: ['CUSTOMER_EMAIL_MANAGE'] }
    const { result } = renderHook(() => usePermissions())

    expect(result.current.canManageCustomerEmail).toBe(true)
    expect(result.current.canAccessEmailAdmin).toBe(true)
    expect(result.current.canManageMailboxes).toBe(false)
  })

  it('grants ingress event view via INGRESS_EVENT_VIEW', () => {
    mockAuthState.currentUser = { permissionCodes: ['INGRESS_EVENT_VIEW'] }
    const { result } = renderHook(() => usePermissions())

    expect(result.current.canViewIngressEvents).toBe(true)
    expect(result.current.canManageIngressEvents).toBe(false)
    expect(result.current.canAccessEmailAdmin).toBe(true)
  })

  it('grants ingress event manage (implies view)', () => {
    mockAuthState.currentUser = { permissionCodes: ['INGRESS_EVENT_MANAGE'] }
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

  it('grants ticket email view and reply via REPLY_PUBLIC (backward compat)', () => {
    mockAuthState.currentUser = { permissionCodes: ['REPLY_PUBLIC'] }
    const { result } = renderHook(() => usePermissions())

    expect(result.current.canViewTicketEmail).toBe(true)
    expect(result.current.canSendTicketEmailReply).toBe(true)
    expect(result.current.canAddPublicReply).toBe(true)
  })

  it('grants ticket email reply via TICKET_EMAIL_REPLY', () => {
    mockAuthState.currentUser = { permissionCodes: ['TICKET_EMAIL_REPLY'] }
    const { result } = renderHook(() => usePermissions())

    expect(result.current.canSendTicketEmailReply).toBe(true)
    expect(result.current.canViewTicketEmail).toBe(true)
  })

  it('returns all email flags false when no permissions', () => {
    mockAuthState.currentUser = { permissionCodes: [] }
    const { result } = renderHook(() => usePermissions())

    expect(result.current.canManageMailboxes).toBe(false)
    expect(result.current.canManageCustomerEmail).toBe(false)
    expect(result.current.canViewIngressEvents).toBe(false)
    expect(result.current.canManageIngressEvents).toBe(false)
    expect(result.current.canViewTicketEmail).toBe(false)
    expect(result.current.canSendTicketEmailReply).toBe(false)
    expect(result.current.canAccessEmailAdmin).toBe(false)
  })

  it('canAccessEmailAdmin is true with any email admin permission', () => {
    for (const code of ['MAILBOX_MANAGE', 'CUSTOMER_EMAIL_MANAGE', 'INGRESS_EVENT_VIEW', 'INGRESS_EVENT_MANAGE']) {
      mockAuthState.currentUser = { permissionCodes: [code] }
      const { result } = renderHook(() => usePermissions())
      expect(result.current.canAccessEmailAdmin).toBe(true)
    }
  })
})
