/**
 * Backend DTO types — aligned to CaseFlow API v2.0.0 contract.
 * These represent the exact shapes sent/received from the backend API.
 * Frontend view-model types remain in their domain files (ticket.types.ts, etc.).
 */

// ---------------------------------------------------------------------------
// Error shapes
// ---------------------------------------------------------------------------

export interface FieldViolation {
  field: string
  message: string
}

export interface ErrorResponse {
  code: string
  message: string
  violations?: FieldViolation[]
}

// ---------------------------------------------------------------------------
// Auth DTOs
// ---------------------------------------------------------------------------

export interface LoginRequest {
  username: string
  password: string
}

/** Backend response for POST /api/auth/login */
export interface LoginResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
}

/** Backend roles as returned by the API — always uppercase */
export type BackendRole = 'ADMIN' | 'AGENT' | 'VIEWER'

/**
 * Backend response for GET /api/auth/me
 * Spec: { id, username, email, fullName, role }
 */
export interface AuthMeResponse {
  id: string
  username: string
  email: string
  fullName: string
  role: BackendRole
}

/** Paged response wrapper — used by GET /api/tickets */
export interface PagedResponse<T> {
  items: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

/** Matches backend NoteType enum */
export type NoteType = 'INTERNAL' | 'INFO' | 'INVESTIGATION' | 'ESCALATION'

// ---------------------------------------------------------------------------
// Group Type DTOs
// ---------------------------------------------------------------------------

/**
 * GET /api/group-types list item
 * { id, code, name }
 */
export interface GroupTypeDto {
  id: number
  code: string
  name: string
}

/**
 * POST /api/group-types request body
 * { code [required, max 50], name [required, max 255] }
 */
export interface CreateGroupTypeRequest {
  code: string
  name: string
  description?: string
}

// ---------------------------------------------------------------------------
// Note DTOs
// ---------------------------------------------------------------------------

/**
 * POST /api/notes response & GET /api/notes/{id} response
 * Spec: { id, ticketId, content, type, createdBy, createdAt }
 */
export interface NoteResponse {
  id: string
  ticketId: string
  type: NoteType
  content: string
  /** Backend field — the username or display name of the note creator */
  createdBy: string
  createdAt: string
}

// ---------------------------------------------------------------------------
// Assignment DTOs
// ---------------------------------------------------------------------------

/**
 * GET /api/assignments/by-ticket/{ticketId}  &  POST assign/reassign response
 * Spec: { id, ticketId, assignedUserId, assignedGroupId, assignedBy, assignedAt, unassignedAt, active }
 */
export interface AssignmentResponse {
  id: string
  ticketId: string
  assignedUserId: string | null
  assignedGroupId: string | null
  /** Username or name of who performed the assignment */
  assignedBy: string | null
  assignedAt: string
  unassignedAt: string | null
  active: boolean
}

// ---------------------------------------------------------------------------
// Transfer DTOs
// ---------------------------------------------------------------------------

/**
 * POST /api/transfers response
 * Spec: { id, ticketId, fromGroupId, toGroupId, transferredBy, transferredAt, reason }
 */
export interface TransferResponse {
  id: string
  ticketId: string
  fromGroupId: string
  toGroupId: string
  transferredBy: string
  transferredAt: string
  reason: string | null
}

/**
 * GET /api/transfers/by-ticket/{ticketId} response items
 * Spec: { id, ticketId, fromGroupId, toGroupId, transferredAt }
 */
export interface TransferListItem {
  id: string
  ticketId: string
  fromGroupId: string
  toGroupId: string
  transferredAt: string
}

// ---------------------------------------------------------------------------
// Attachment DTOs
// ---------------------------------------------------------------------------

/**
 * Spec: { id, ticketId, emailId, fileName, objectKey, downloadPath, contentType, size, uploadedAt }
 */
export interface AttachmentMetadataResponse {
  id: string
  ticketId: string | null
  emailId: string | null
  fileName: string
  objectKey: string
  downloadPath: string
  contentType: string
  size: number
  uploadedAt: string
}

// ---------------------------------------------------------------------------
// Email DTOs
// ---------------------------------------------------------------------------

/**
 * GET /api/emails/{id} response
 * Spec: { id, messageId, threadKey, subject, from, to[], cc[], receivedAt, parsedAt,
 *         ticketId, textBody, htmlBody, attachments: { fileName, objectKey, contentType, size }[] }
 */
export interface EmailDocumentResponse {
  id: string
  messageId: string
  threadKey: string
  subject: string
  /** Sender address */
  from: string
  to: string[]
  cc: string[]
  receivedAt: string
  parsedAt: string | null
  ticketId: string
  textBody: string | null
  htmlBody: string | null
  attachments: Array<{
    fileName: string
    objectKey: string
    contentType: string
    size: number
  }>
}

/**
 * GET /api/emails/by-ticket/{ticketId} and /by-thread/{threadKey} items
 * Spec: { id, messageId, threadKey, subject, from, receivedAt, ticketId }
 */
export interface EmailDocumentSummaryResponse {
  id: string
  messageId: string
  threadKey: string
  subject: string
  /** Sender address */
  from: string
  receivedAt: string
  ticketId: string
}

// ---------------------------------------------------------------------------
// Contact DTOs
// ---------------------------------------------------------------------------

/**
 * GET /api/contacts response
 * Spec: { id, customerId, email, name, isPrimary, isActive, createdAt }
 */
export interface ContactResponse {
  id: string
  customerId: string
  email: string
  name: string
  isPrimary: boolean
  isActive: boolean
  createdAt: string
}

// ---------------------------------------------------------------------------
// Ticket summary / detail DTOs
// ---------------------------------------------------------------------------

/**
 * TicketSummary from GET /api/tickets paged list
 * Spec: { id, ticketNo, subject, status, priority, customerId, customerName,
 *         assignedUserId, assignedUserName, assignedGroupId, assignedGroupName, createdAt, updatedAt }
 */
export interface TicketSummaryResponse {
  id: string
  ticketNo: string
  subject: string
  status: string
  priority: string
  customerId: string
  customerName: string
  assignedUserId: number | null
  assignedUserName: string | null
  assignedGroupId: number | null
  assignedGroupName: string | null
  createdAt: string
  updatedAt: string
}

// ---------------------------------------------------------------------------
// User / Group summary DTOs
// ---------------------------------------------------------------------------

/**
 * GET /api/users list item
 * Spec: { id, username, fullName, role, isActive }
 */
export interface UserSummaryResponse {
  id: number
  username: string
  fullName: string
  role: BackendRole
  isActive: boolean
}

/**
 * GET /api/users/{id} / full UserResponse
 * Spec: { id, username, email, fullName, role, isActive, groupIds, groupNames, createdAt, lastLoginAt }
 */
export interface UserResponse {
  id: number
  username: string
  email: string
  fullName: string
  role: BackendRole
  isActive: boolean
  groupIds: number[]
  groupNames: string[]
  createdAt: string
  lastLoginAt: string | null
}

/**
 * GET /api/groups list item
 * Backend: { id, name, groupTypeId, groupTypeCode, groupTypeName, description, isActive, memberCount, memberIds }
 */
export interface GroupSummaryResponse {
  id: number
  name: string
  groupTypeId: number
  groupTypeCode: string
  groupTypeName: string
  description: string
  isActive: boolean
  memberCount: number
  memberIds: number[]
}

/**
 * GET /api/groups/{id}
 */
export interface GroupResponse {
  id: number
  name: string
  groupTypeId: number
  groupTypeCode: string
  groupTypeName: string
  description: string
  isActive: boolean
  memberCount: number
  memberIds: number[]
  createdAt: string
}

// ---------------------------------------------------------------------------
// Customer summary
// ---------------------------------------------------------------------------

/**
 * GET /api/customers list item
 * Spec: { id, name, code }
 */
export interface CustomerSummaryResponse {
  id: number
  name: string
  code: string
}

/**
 * GET /api/customers/{id}
 * Spec: { id, name, code, isActive, createdAt, updatedAt }
 */
export interface CustomerResponse {
  id: number
  name: string
  code: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// ---------------------------------------------------------------------------
// Request types
// ---------------------------------------------------------------------------

/**
 * POST /api/tickets body
 * Spec: { subject [required], description?, priority [required], customerId? }
 */
export interface CreateTicketRequest {
  subject: string
  description?: string
  priority: string
  customerId?: number
}

/**
 * PUT /api/tickets/{id} body
 * Spec: { subject [required], description?, priority [required] }
 */
export interface UpdateTicketRequest {
  subject: string
  description?: string
  priority: string
}

/**
 * POST /api/tickets/{id}/status body
 * Spec: { status }  — ticketId is a path param
 */
export interface ChangeTicketStatusRequest {
  status: string
}

/** POST /api/tickets/{id}/close body — spec requires empty object */
export type CloseTicketRequest = Record<string, never>

/** POST /api/tickets/{id}/reopen body — spec requires empty object */
export type ReopenTicketRequest = Record<string, never>

/**
 * POST /api/notes body
 * Spec: { ticketId, content, type }  — author derived from session token
 */
export interface AddNoteRequest {
  ticketId: string
  content: string
  type: NoteType
}

/**
 * POST /api/assignments/assign body
 * Spec: { ticketId [required], assignedUserId?, assignedGroupId? }
 */
export interface AssignTicketRequest {
  ticketId: string
  assignedUserId?: string
  assignedGroupId?: string
}

/**
 * POST /api/assignments/reassign body
 * Spec: { ticketId [required], newUserId?, newGroupId? }
 */
export interface ReassignTicketRequest {
  ticketId: string
  newUserId?: string
  newGroupId?: string
}

/**
 * POST /api/assignments/unassign body
 * Spec: { ticketId [required] }
 */
export interface UnassignTicketRequest {
  ticketId: string
}

/**
 * POST /api/transfers body
 * Spec: { ticketId [required], fromGroupId [required], toGroupId [required], reason?, clearAssignee? }
 */
export interface TransferTicketRequest {
  ticketId: string
  fromGroupId: string
  toGroupId: string
  reason?: string
  clearAssignee?: boolean
}

/**
 * POST /api/users body
 * Spec: { username, email, fullName, password, role, groupIds?, isActive? }
 */
export interface CreateUserRequest {
  username: string
  email: string
  fullName: string
  password: string
  role: BackendRole
  groupIds?: number[]
  isActive?: boolean
}

/**
 * PUT /api/users/{id} body
 * Spec: { email [required], fullName [required], role [required], isActive [required], groupIds?, password? }
 */
export interface UpdateUserRequest {
  email: string
  fullName: string
  role: BackendRole
  isActive: boolean
  groupIds?: number[]
  password?: string
}

/**
 * POST /api/groups body
 * Backend: { name [required, max 255], groupTypeId [required], description? [max 1000], userIds? }
 */
export interface CreateGroupRequest {
  name: string
  groupTypeId: number
  description?: string
  userIds?: number[]
}

/**
 * PUT /api/groups/{id} body
 * Backend: { name [required, max 255], groupTypeId [required], description? [max 1000], userIds? }
 */
export interface UpdateGroupRequest {
  name: string
  groupTypeId: number
  description?: string
  userIds?: number[]
}

/**
 * POST /api/customers body
 * Spec: { name [required], code [required] }
 */
export interface CreateCustomerRequest {
  name: string
  code: string
}

/**
 * PUT /api/customers/{id} body
 * Spec: { name [required], code [required] }
 */
export interface UpdateCustomerRequest {
  name: string
  code: string
}

/**
 * POST /api/contacts body
 * Spec: { customerId [required], email [required], name [required], isPrimary? }
 */
export interface CreateContactRequest {
  customerId: number
  email: string
  name: string
  isPrimary?: boolean
}

/**
 * PUT /api/contacts/{id} body
 * Spec: { name [required], isPrimary?, isActive? }
 */
export interface UpdateContactRequest {
  name: string
  isPrimary?: boolean
  isActive?: boolean
}
