import { useAuthStore } from '@/store/auth.store'

/**
 * Permission codes returned by GET /api/auth/me.
 * All capability checks are driven by these codes — never by role name.
 * Aligned to the final backend permission contract.
 */
const P = {
  USER_MANAGE:               'USER_MANAGE',
  ROLE_MANAGE:               'ROLE_MANAGE',
  GROUP_MANAGE:              'GROUP_MANAGE',
  ADMIN_CONFIG:              'ADMIN_CONFIG',
  TICKET_READ:               'TICKET_READ',
  ADMIN_POOL_VIEW:           'ADMIN_POOL_VIEW',
  TICKET_ASSIGN:             'TICKET_ASSIGN',
  TICKET_TRANSFER:           'TICKET_TRANSFER',
  TICKET_STATUS_CHANGE:      'TICKET_STATUS_CHANGE',
  TICKET_CLOSE:              'TICKET_CLOSE',
  TICKET_PRIORITY_CHANGE:    'TICKET_PRIORITY_CHANGE',
  CUSTOMER_REPLY_SEND:       'CUSTOMER_REPLY_SEND',
  INTERNAL_NOTE_ADD:         'INTERNAL_NOTE_ADD',
  REPORT_VIEW:               'REPORT_VIEW',
  DATA_EXPORT:               'DATA_EXPORT',
  // Email platform permissions
  EMAIL_CONFIG_VIEW:         'EMAIL_CONFIG_VIEW',
  EMAIL_CONFIG_MANAGE:       'EMAIL_CONFIG_MANAGE',
  EMAIL_OPERATIONS_VIEW:     'EMAIL_OPERATIONS_VIEW',
  EMAIL_OPERATIONS_MANAGE:   'EMAIL_OPERATIONS_MANAGE',
  TICKET_EMAIL_VIEW:         'TICKET_EMAIL_VIEW',
  TICKET_EMAIL_REPLY_SEND:   'TICKET_EMAIL_REPLY_SEND',
} as const

export function usePermissions() {
  const currentUser = useAuthStore((s) => s.currentUser)
  const codes = new Set(currentUser?.permissionCodes ?? [])

  const has = (code: string) => codes.has(code)

  return {
    /** The user's display role code (dynamic — not used for capability checks) */
    roleCode: currentUser?.roleCode ?? '',
    /** Human-readable role name for display only */
    roleName: currentUser?.roleName ?? '',

    // ----- Capability checks — source of truth -----
    canManageUsers:     has(P.USER_MANAGE),
    canManageRoles:     has(P.ROLE_MANAGE),
    canManageGroups:    has(P.GROUP_MANAGE),
    canViewAdminPool:   has(P.ADMIN_POOL_VIEW),
    canAssignTickets:   has(P.TICKET_ASSIGN),
    canTransferTickets: has(P.TICKET_TRANSFER),
    canChangeStatus:    has(P.TICKET_STATUS_CHANGE),
    canCloseTickets:    has(P.TICKET_CLOSE),
    canChangePriority:  has(P.TICKET_PRIORITY_CHANGE),
    canAddPublicReply:  has(P.CUSTOMER_REPLY_SEND),
    canAddInternalNote: has(P.INTERNAL_NOTE_ADD),
    canViewReports:     has(P.REPORT_VIEW),
    canExport:          has(P.DATA_EXPORT),
    // Email platform — driven by dedicated permission codes from backend
    canViewEmailConfig:         has(P.EMAIL_CONFIG_VIEW) || has(P.EMAIL_CONFIG_MANAGE),
    canManageEmailConfig:       has(P.EMAIL_CONFIG_MANAGE),
    canViewIngressEvents:       has(P.EMAIL_OPERATIONS_VIEW) || has(P.EMAIL_OPERATIONS_MANAGE),
    canManageIngressEvents:     has(P.EMAIL_OPERATIONS_MANAGE),
    canViewTicketEmail:         has(P.TICKET_EMAIL_VIEW),
    canSendTicketEmailReply:    has(P.TICKET_EMAIL_REPLY_SEND),
    /** Shorthand: can access any email admin/config screen */
    canAccessEmailAdmin:        has(P.EMAIL_CONFIG_VIEW) || has(P.EMAIL_CONFIG_MANAGE) || has(P.EMAIL_OPERATIONS_VIEW) || has(P.EMAIL_OPERATIONS_MANAGE),
  }
}
