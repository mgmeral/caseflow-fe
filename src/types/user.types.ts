import type { UserRole } from './common.types'

/** Matches backend GroupType enum — exact string values are backend-defined */
export type GroupType = string

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
  description: string
  memberIds: string[]
  memberNames: string[]
  defaultTemplateIds: string[]
  transferableToGroupIds: string[]
  isActive: boolean
  openTicketCount: number
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
