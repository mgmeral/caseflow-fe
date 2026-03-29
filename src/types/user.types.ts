import type { UserRole } from './common.types'

/** Frontend view model for a group type loaded from GET /api/group-types */
export interface GroupType {
  id: string
  code: string
  name: string
}

/** Frontend view model for a permission definition from GET /api/roles/permissions */
export interface PermissionDef {
  code: string
  label: string
  description?: string
  category?: string
}

/** Frontend view model for a role summary from GET /api/roles */
export interface RoleSummaryRecord {
  id: string
  code: string
  name: string
  ticketScope: 'ALL' | 'OWN_GROUPS' | 'OWN_AND_OWN_GROUPS' | 'ASSIGNED_ONLY'
  isActive: boolean
  permissionCount: number
  userCount?: number
}

/** Frontend view model for a role detail from GET /api/roles/{id} */
export interface RoleRecord {
  id: string
  code: string
  name: string
  description?: string
  ticketScope: 'ALL' | 'OWN_GROUPS' | 'OWN_AND_OWN_GROUPS' | 'ASSIGNED_ONLY'
  isActive: boolean
  permissions: string[]
  userCount?: number
}

export interface User {
  id: string
  username?: string
  firstName: string
  lastName: string
  fullName: string
  email: string
  /** Legacy normalized role — used for UI display only; do NOT use for auth checks */
  role: UserRole
  /** Backend role record id */
  roleId?: string
  /** Backend role code (dynamic — e.g. "SENIOR_AGENT") */
  roleCode?: string
  /** Human-readable role name for display */
  roleName?: string
  /**
   * Permission codes granted to this user.
   * Source of truth for all capability/authorization checks in the UI.
   */
  permissionCodes: string[]
  /** Ticket visibility scope */
  ticketScope: 'ALL' | 'GROUP' | 'OWN'
  groupIds: string[]
  groupNames: string[]
  adminLevel: number
  isActive: boolean
  lastLoginAt: string | null
  openTicketCount: number
  avatarColor: string
}

export interface Group {
  id: string
  name: string
  groupTypeId: string
  groupTypeCode: string
  groupTypeName: string
  description: string
  isActive: boolean
  memberCount: number
  /** Backend-provided member user IDs as strings */
  memberIds: string[]
  /** Returned by GET /api/groups/{id} only */
  createdAt?: string
}

export interface TicketTemplate {
  id: string
  name: string
  subject: string
  content: string
  type: 'public_reply' | 'internal_note'
  groupId: string | null
  language: 'tr' | 'en'
  isActive: boolean
}
