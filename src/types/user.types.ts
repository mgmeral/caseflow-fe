import type { UserRole } from './common.types'

/** Frontend view model for a group type loaded from GET /api/group-types */
export interface GroupType {
  id: string
  code: string
  name: string
}

export interface User {
  id: string
  firstName: string
  lastName: string
  fullName: string
  email: string
  role: UserRole
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
