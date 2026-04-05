/**
 * Domain normalizers for real-mode backend responses.
 *
 * The backend returns lean DTOs that may omit UI-only or computed fields.
 * These functions fill in safe defaults so frontend view models are always complete.
 *
 * Rules:
 *  - Never fabricate business data (IDs, names, roles, etc.)
 *  - Omit or default UI-only fields (avatarColor, openTicketCount, etc.)
 *  - Degrade gracefully: missing lists become [], missing booleans become false/null
 */

import type { User, Group } from '@/types/user.types'
import type { UserRole } from '@/types/common.types'
import type { BackendRole } from '@/types/api.types'
import type { Ticket, TicketAttachment, TicketStatus, TicketPriority, SourceType } from '@/types/ticket.types'

// ---------------------------------------------------------------------------
// Status / priority normalization
// ---------------------------------------------------------------------------

/**
 * Map incoming status values to backend-aligned TicketStatus.
 */
export function normalizeStatus(raw: unknown): TicketStatus {
  switch (String(raw).toUpperCase()) {
    case 'NEW': return 'NEW'
    case 'TRIAGED': return 'TRIAGED'
    case 'ASSIGNED': return 'ASSIGNED'
    case 'IN_PROGRESS': return 'IN_PROGRESS'
    case 'WAITING_CUSTOMER': return 'WAITING_CUSTOMER'
    case 'RESOLVED': return 'RESOLVED'
    case 'CLOSED': return 'CLOSED'
    case 'REOPENED': return 'REOPENED'
    // Legacy FE aliases accepted for compatibility in mixed data paths.
    case 'OPEN': return 'ASSIGNED'
    case 'PENDING': return 'WAITING_CUSTOMER'
    default: return 'NEW'
  }
}

/**
 * Map backend uppercase priority values to FE TicketPriority.
 * Backend: LOW, MEDIUM, HIGH, CRITICAL → FE: low, medium, high, critical
 */
export function normalizePriority(raw: unknown): TicketPriority {
  switch (String(raw).toUpperCase()) {
    case 'LOW': return 'low'
    case 'MEDIUM': return 'medium'
    case 'HIGH': return 'high'
    case 'CRITICAL': return 'critical'
    default: return 'medium'
  }
}

/**
 * Map FE TicketStatus (lowercase) → backend enum (uppercase).
 * Used when building query params or request bodies sent to the backend.
 */
export function toBackendStatus(status: TicketStatus | string): string {
  switch (status) {
    case 'NEW':
    case 'TRIAGED':
    case 'ASSIGNED':
    case 'IN_PROGRESS':
    case 'WAITING_CUSTOMER':
    case 'RESOLVED':
    case 'CLOSED':
    case 'REOPENED':
      return status
    case 'new': return 'NEW'
    case 'open': return 'ASSIGNED'
    case 'in_progress': return 'IN_PROGRESS'
    case 'pending': return 'WAITING_CUSTOMER'
    case 'resolved': return 'RESOLVED'
    case 'closed': return 'CLOSED'
    case 'transferred': return 'ASSIGNED'
    default: return String(status).toUpperCase()
  }
}

/** Map FE TicketPriority (lowercase) → backend enum (uppercase). */
export function toBackendPriority(priority: TicketPriority | string): string {
  return String(priority).toUpperCase()
}

// ---------------------------------------------------------------------------
// Role normalization
// ---------------------------------------------------------------------------

/** Maps backend uppercase role enum to internal frontend UserRole */
export function normalizeRole(role: BackendRole | string | undefined): UserRole {
  switch (role) {
    case 'ADMIN': return 'admin'
    case 'AGENT': return 'agent'
    case 'VIEWER': return 'viewer'
    default: return 'viewer'
  }
}

function normalizeRoleFromMe(raw: Record<string, unknown>): UserRole {
  const roleCode = String(raw.roleCode ?? '').toUpperCase()
  if (roleCode.includes('ADMIN')) return 'admin'
  if (roleCode.includes('VIEW')) return 'viewer'
  if (roleCode) return 'agent'
  return normalizeRole(raw.role as BackendRole | string | undefined)
}

function normalizeTicketScope(raw: unknown): User['ticketScope'] {
  switch (String(raw ?? '').toUpperCase()) {
    case 'ALL':
      return 'ALL'
    case 'OWN_GROUPS':
      return 'OWN_GROUPS'
    case 'OWN_AND_OWN_GROUPS':
      return 'OWN_AND_OWN_GROUPS'
    case 'ASSIGNED_ONLY':
      return 'ASSIGNED_ONLY'
    default:
      return 'ASSIGNED_ONLY'
  }
}

function normalizeTicketAttachment(raw: Record<string, unknown>): TicketAttachment {
  return {
    id: String(raw.id ?? ''),
    ticketId: raw.ticketId != null ? String(raw.ticketId) : null,
    emailId: raw.emailId != null ? String(raw.emailId) : null,
    fileName: String(raw.fileName ?? ''),
    contentType: raw.contentType ? String(raw.contentType) : null,
    size: typeof raw.size === 'number' ? raw.size : null,
    previewSupported: typeof raw.previewSupported === 'boolean' ? raw.previewSupported : null,
    previewUrl: raw.previewUrl ? String(raw.previewUrl) : raw.downloadPath ? String(raw.downloadPath) : raw.downloadUrl ? String(raw.downloadUrl) : null,
    openUrl: raw.openUrl ? String(raw.openUrl) : raw.downloadUrl ? String(raw.downloadUrl) : raw.downloadPath ? String(raw.downloadPath) : null,
    downloadUrl: raw.downloadPath ? String(raw.downloadPath) : raw.downloadUrl ? String(raw.downloadUrl) : null,
    uploadedAt: raw.uploadedAt ? String(raw.uploadedAt) : null,
  }
}

function normalizeTicketTag(raw: unknown) {
  if (typeof raw === 'string') {
    return {
      id: raw,
      code: raw,
      name: raw,
      color: null,
      isActive: true,
    }
  }

  const record = raw as Record<string, unknown>
  const id = String(record.id ?? record.code ?? record.name ?? '')
  const code = String(record.code ?? record.name ?? id)
  const name = String(record.name ?? record.code ?? id)

  return {
    id,
    code,
    name,
    color: record.color ? String(record.color) : null,
    isActive: record.isActive !== false,
  }
}

// ---------------------------------------------------------------------------
// Avatar color derivation (UI-only, deterministic from ID)
// ---------------------------------------------------------------------------

const AVATAR_PALETTE = [
  '#4f46e5', '#0891b2', '#16a34a', '#d97706',
  '#dc2626', '#7c3aed', '#0d9488', '#c2410c',
]

export function deriveAvatarColor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length]
}

// ---------------------------------------------------------------------------
// User normalizer
// ---------------------------------------------------------------------------

/**
 * Normalizes a raw backend User-like object into the frontend User view model.
 * Fields not provided by the backend are set to safe defaults.
 */
export function normalizeUser(raw: Record<string, unknown>): User {
  const id = String(raw.id ?? '')
  // Backend returns fullName; firstName/lastName may be absent — derive from fullName
  const fullName = String(raw.fullName ?? `${raw.firstName ?? ''} ${raw.lastName ?? ''}`.trim())
  const nameParts = fullName.trim().split(' ')
  const firstName = String(raw.firstName ?? nameParts[0] ?? '')
  const lastName = String(raw.lastName ?? nameParts.slice(1).join(' ') ?? '')
  return {
    id,
    username: raw.username ? String(raw.username) : undefined,
    firstName,
    lastName,
    fullName,
    email: String(raw.email ?? ''),
    role: normalizeRoleFromMe(raw),
    roleId: raw.roleId != null ? String(raw.roleId) : undefined,
    roleCode: raw.roleCode ? String(raw.roleCode) : undefined,
    roleName: raw.roleName ? String(raw.roleName) : undefined,
    permissionCodes: Array.isArray(raw.permissionCodes) ? (raw.permissionCodes as string[]) : [],
    ticketScope: normalizeTicketScope(raw.ticketScope),
    groupIds: Array.isArray(raw.groupIds) ? (raw.groupIds as (string | number)[]).map(String) : [],
    groupNames: Array.isArray(raw.groupNames) ? (raw.groupNames as string[]) : [],
    adminLevel: 0,
    isActive: raw.isActive === true,
    lastLoginAt: raw.lastLoginAt ? String(raw.lastLoginAt) : null,
    openTicketCount: typeof raw.openTicketCount === 'number' ? raw.openTicketCount : 0,
    avatarColor: deriveAvatarColor(id),
  }
}

// ---------------------------------------------------------------------------
// Ticket normalizer
// ---------------------------------------------------------------------------

/**
 * Normalizes a raw backend ticket response (summary or detail) into the frontend Ticket view model.
 * Backend summary endpoints omit many UI fields — these get safe defaults so the UI never crashes.
 */
export function normalizeTicket(raw: Record<string, unknown>): Ticket {
  const updatedAt = String(raw.updatedAt ?? new Date().toISOString())
  // Backend returns assignedGroupId / assignedGroupName (spec field names)
  const groupId = String(raw.assignedGroupId ?? raw.groupId ?? '')
  const groupName = String(raw.assignedGroupName ?? raw.groupName ?? '')
  return {
    id: String(raw.id ?? ''),
    publicId: raw.publicId != null
      ? String(raw.publicId)
      : raw.ticketPublicId != null
        ? String(raw.ticketPublicId)
        : null,
    ticketNo: String(raw.ticketNo ?? ''),
    subject: String(raw.subject ?? ''),
    customerId: String(raw.customerId ?? ''),
    customerName: String(raw.customerName ?? ''),
    groupId,
    groupName,
    assignedUserId: raw.assignedUserId != null ? String(raw.assignedUserId) : null,
    assignedUserName: raw.assignedUserName ? String(raw.assignedUserName) : null,
    status: normalizeStatus(raw.status),
    priority: normalizePriority(raw.priority),
    sourceType: (raw.sourceType as SourceType) ?? 'manual',
    isUnread: raw.isUnread === true,
    isTransferred: raw.isTransferred === true,
    transferredFromGroup: raw.transferredFromGroup ? String(raw.transferredFromGroup) : null,
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    updatedAt,
    lastActionAt: raw.lastActionAt ? String(raw.lastActionAt) : updatedAt,
    lastActionSummary: String(raw.lastActionSummary ?? ''),
    openDurationMinutes: typeof raw.openDurationMinutes === 'number' ? raw.openDurationMinutes : 0,
    slaDeadlineAt: raw.slaDeadlineAt ? String(raw.slaDeadlineAt) : null,
    slaBreached: raw.slaBreached === true,
    messageCount: typeof raw.messageCount === 'number' ? raw.messageCount : 0,
    internalNoteCount: typeof raw.internalNoteCount === 'number' ? raw.internalNoteCount : 0,
    tags: Array.isArray(raw.tags) ? raw.tags.map(normalizeTicketTag) : [],
    ...(Array.isArray(raw.allowedTransitions)
      ? {
          allowedTransitions: (raw.allowedTransitions as unknown[])
            .map((value) => normalizeStatus(value))
            .filter((value, index, list) => list.indexOf(value) === index),
        }
      : {}),
    attachments: Array.isArray(raw.attachments)
      ? (raw.attachments as Record<string, unknown>[]).map(normalizeTicketAttachment)
      : [],
  }
}

// ---------------------------------------------------------------------------
// Group normalizer
// ---------------------------------------------------------------------------

/**
 * Normalizes a raw backend Group-like object into the frontend Group view model.
 * Fields not provided by the backend (templates, transferableToGroupIds) default to [].
 */
export function normalizeGroup(raw: Record<string, unknown>): Group {
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    groupTypeId: String(raw.groupTypeId ?? ''),
    groupTypeCode: String(raw.groupTypeCode ?? ''),
    groupTypeName: String(raw.groupTypeName ?? ''),
    description: String(raw.description ?? ''),
    isActive: raw.isActive !== false,
    memberCount: typeof raw.memberCount === 'number' ? raw.memberCount : 0,
    memberIds: Array.isArray(raw.memberIds) ? (raw.memberIds as (string | number)[]).map(String) : [],
    ...(raw.createdAt ? { createdAt: String(raw.createdAt) } : {}),
  }
}
