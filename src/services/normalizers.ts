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
import type { Ticket, TicketStatus, TicketPriority, SourceType } from '@/types/ticket.types'

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
  return {
    id,
    firstName: String(raw.firstName ?? ''),
    lastName: String(raw.lastName ?? ''),
    fullName: String(raw.fullName ?? `${raw.firstName ?? ''} ${raw.lastName ?? ''}`.trim()),
    email: String(raw.email ?? ''),
    role: normalizeRole(raw.role as BackendRole | string | undefined),
    // Backend may not expose group memberships on list endpoints
    groupIds: Array.isArray(raw.groupIds) ? (raw.groupIds as string[]) : [],
    groupNames: Array.isArray(raw.groupNames) ? (raw.groupNames as string[]) : [],
    // UI-only / computed fields — not from backend
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
  return {
    id: String(raw.id ?? ''),
    ticketNo: String(raw.ticketNo ?? ''),
    subject: String(raw.subject ?? ''),
    customerId: String(raw.customerId ?? ''),
    customerName: String(raw.customerName ?? ''),
    customerSegment: String(raw.customerSegment ?? ''),
    groupId: String(raw.groupId ?? ''),
    groupName: String(raw.groupName ?? ''),
    assignedUserId: raw.assignedUserId ? String(raw.assignedUserId) : null,
    assignedUserName: raw.assignedUserName ? String(raw.assignedUserName) : null,
    status: (raw.status as TicketStatus) ?? 'open',
    priority: (raw.priority as TicketPriority) ?? 'medium',
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
    tags: Array.isArray(raw.tags) ? (raw.tags as string[]) : [],
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
    description: String(raw.description ?? ''),
    memberIds: Array.isArray(raw.memberIds) ? (raw.memberIds as string[]) : [],
    memberNames: Array.isArray(raw.memberNames) ? (raw.memberNames as string[]) : [],
    // Not provided by real backend — degrade gracefully (show all groups as transfer targets;
    // backend will enforce actual transfer eligibility)
    defaultTemplateIds: [],
    transferableToGroupIds: [],
    isActive: raw.isActive === true,
    openTicketCount: typeof raw.openTicketCount === 'number' ? raw.openTicketCount : 0,
  }
}
