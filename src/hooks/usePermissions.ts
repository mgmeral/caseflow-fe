import { useAuthStore } from '@/store/auth.store'

/**
 * Permission codes returned by GET /api/auth/me.
 * All capability checks are driven by these codes — never by role name.
 */
const P = {
  ADMIN_POOL_VIEW: 'ADMIN_POOL_VIEW',
  USER_MANAGE:     'USER_MANAGE',
  ROLE_MANAGE:     'ROLE_MANAGE',
  TICKET_ASSIGN:   'TICKET_ASSIGN',
  TICKET_TRANSFER: 'TICKET_TRANSFER',
  TICKET_CLOSE:    'TICKET_CLOSE',
  TICKET_PRIORITY: 'TICKET_PRIORITY',
  TICKET_STATUS:   'TICKET_STATUS',
  REPLY_PUBLIC:    'REPLY_PUBLIC',
  NOTE_INTERNAL:   'NOTE_INTERNAL',
  REPORT_VIEW:     'REPORT_VIEW',
  REPORT_EXPORT:   'REPORT_EXPORT',
  // Email platform permissions
  MAILBOX_MANAGE:           'MAILBOX_MANAGE',
  CUSTOMER_EMAIL_MANAGE:    'CUSTOMER_EMAIL_MANAGE',
  INGRESS_EVENT_VIEW:       'INGRESS_EVENT_VIEW',
  INGRESS_EVENT_MANAGE:     'INGRESS_EVENT_MANAGE',
  TICKET_EMAIL_VIEW:        'TICKET_EMAIL_VIEW',
  TICKET_EMAIL_REPLY:       'TICKET_EMAIL_REPLY',
} as const

export function usePermissions() {
  const currentUser = useAuthStore((s) => s.currentUser)
  const codes = new Set(currentUser?.permissionCodes ?? [])

  const has = (code: string) => codes.has(code)

  return {
    /** The user's display role code (dynamic — not used for capability checks) */
    roleCode: currentUser?.roleCode ?? currentUser?.role ?? '',
    /** Human-readable role name for display only */
    roleName: currentUser?.roleName ?? currentUser?.role ?? '',

    // ----- Capability checks — source of truth -----
    canManageUsers:     has(P.USER_MANAGE),
    canManageRoles:     has(P.ROLE_MANAGE),
    canManageGroups:    has(P.USER_MANAGE),
    canViewAdminPool:   has(P.ADMIN_POOL_VIEW),
    canAssignTickets:   has(P.TICKET_ASSIGN),
    canTransferTickets: has(P.TICKET_TRANSFER),
    canChangeStatus:    has(P.TICKET_STATUS),
    canCloseTickets:    has(P.TICKET_CLOSE),
    canChangePriority:  has(P.TICKET_PRIORITY),
    canAddPublicReply:  has(P.REPLY_PUBLIC),
    canAddInternalNote: has(P.NOTE_INTERNAL),
    canViewReports:     has(P.REPORT_VIEW),
    canExport:          has(P.REPORT_EXPORT),
    // Email platform — falls back to USER_MANAGE until backend adds dedicated codes
    canManageMailboxes:       has(P.MAILBOX_MANAGE) || has(P.USER_MANAGE),
    canManageCustomerEmail:   has(P.CUSTOMER_EMAIL_MANAGE) || has(P.USER_MANAGE),
    canViewIngressEvents:     has(P.INGRESS_EVENT_VIEW) || has(P.INGRESS_EVENT_MANAGE) || has(P.USER_MANAGE),
    canManageIngressEvents:   has(P.INGRESS_EVENT_MANAGE) || has(P.USER_MANAGE),
    canViewTicketEmail:       has(P.TICKET_EMAIL_VIEW) || has(P.REPLY_PUBLIC) || has(P.TICKET_EMAIL_REPLY),
    canSendTicketEmailReply:  has(P.TICKET_EMAIL_REPLY) || has(P.REPLY_PUBLIC),
    /** Shorthand: can access any email admin screen */
    canAccessEmailAdmin:      has(P.MAILBOX_MANAGE) || has(P.CUSTOMER_EMAIL_MANAGE) || has(P.INGRESS_EVENT_VIEW) || has(P.INGRESS_EVENT_MANAGE) || has(P.USER_MANAGE),
  }
}
