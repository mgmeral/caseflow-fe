/**
 * Backend DTO types — aligned to the current backend contract.
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

/** Backend response for POST /auth/login */
export interface LoginResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
}

/** Backend roles as returned by the API — always uppercase */
export type BackendRole = 'ADMIN' | 'AGENT' | 'VIEWER'

/** Backend response for GET /auth/me */
export interface AuthMeResponse {
  id: string
  username?: string
  firstName: string
  lastName: string
  fullName: string
  email: string
  role: BackendRole
  isActive: boolean
}

/** Normalized PagedResponse from backend list endpoints */
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

/** Matches backend NoteType enum — uppercase values as returned/expected by the API */
export type NoteType = 'INTERNAL' | 'INFO' | 'INVESTIGATION' | 'ESCALATION'

/** Matches backend GroupType enum — values TBD per backend implementation */
export type GroupType = string

// ---------------------------------------------------------------------------
// Note DTOs
// ---------------------------------------------------------------------------

export interface NoteResponse {
  id: string
  ticketId: string
  type: NoteType
  content: string
  authorId: string | null
  authorName: string
  createdAt: string
}

export interface NoteSummaryResponse {
  id: string
  ticketId: string
  type: NoteType
  authorName: string
  createdAt: string
}

// ---------------------------------------------------------------------------
// Assignment DTOs
// ---------------------------------------------------------------------------

export interface AssignmentResponse {
  id: string
  ticketId: string
  assigneeId: string
  assigneeName: string
  assignedById: string | null
  assignedByName: string | null
  createdAt: string
}

export interface AssignmentSummaryResponse {
  id: string
  ticketId: string
  assigneeName: string
  createdAt: string
}

// ---------------------------------------------------------------------------
// Transfer DTOs
// ---------------------------------------------------------------------------

export interface TransferResponse {
  id: string
  ticketId: string
  fromGroupId: string
  fromGroupName: string
  toGroupId: string
  toGroupName: string
  transferredById: string
  transferredByName: string
  reason: string
  note: string | null
  createdAt: string
}

export interface TransferSummaryResponse {
  id: string
  ticketId: string
  fromGroupName: string
  toGroupName: string
  reason: string
  createdAt: string
}

// ---------------------------------------------------------------------------
// Email DTOs
// ---------------------------------------------------------------------------

export interface AttachmentMetadataResponse {
  id: string
  filename: string
  contentType: string
  sizeBytes: number
}

export interface EmailDocumentResponse {
  id: string
  ticketId: string
  threadKey: string
  subject: string
  fromAddress: string
  toAddresses: string[]
  content: string
  direction: 'INBOUND' | 'OUTBOUND'
  sentAt: string
  receivedAt: string | null
  attachments: AttachmentMetadataResponse[]
}

export interface EmailDocumentSummaryResponse {
  id: string
  ticketId: string
  subject: string
  fromAddress: string
  direction: 'INBOUND' | 'OUTBOUND'
  sentAt: string
}

// ---------------------------------------------------------------------------
// Contact DTOs
// ---------------------------------------------------------------------------

export interface ContactResponse {
  id: string
  customerId: string
  firstName: string
  lastName: string
  fullName: string
  email: string
  phone: string | null
  isActive: boolean
  isPrimary: boolean
}

export interface ContactSummaryResponse {
  id: string
  customerId: string
  fullName: string
  email: string
  isPrimary: boolean
}

// ---------------------------------------------------------------------------
// Ticket summary / detail DTOs (as backend returns them)
// ---------------------------------------------------------------------------

export interface TicketSummaryResponse {
  id: string
  ticketNo: string
  subject: string
  customerId: string
  customerName: string
  groupId: string
  groupName: string
  assignedUserId: string | null
  assignedUserName: string | null
  status: string
  priority: string
  createdAt: string
  updatedAt: string
}

// ---------------------------------------------------------------------------
// User / Group summary DTOs
// ---------------------------------------------------------------------------

export interface UserSummaryResponse {
  id: string
  firstName: string
  lastName: string
  fullName: string
  email: string
  role: string
  isActive: boolean
}

export interface GroupSummaryResponse {
  id: string
  name: string
  groupType: GroupType
  isActive: boolean
}

// ---------------------------------------------------------------------------
// Customer / contact summary
// ---------------------------------------------------------------------------

export interface CustomerSummaryResponse {
  id: string
  name: string
  segment: string
  isActive: boolean
}

// ---------------------------------------------------------------------------
// Request types
// ---------------------------------------------------------------------------

export interface CreateTicketRequest {
  subject: string
  customerId: string
  groupId: string
  priority: string
  sourceType?: string
}

export interface UpdateTicketRequest {
  subject?: string
  priority?: string
  groupId?: string
}

export interface ChangeTicketStatusRequest {
  ticketId: string
  status: string
  reason?: string
}

export interface CloseTicketRequest {
  ticketId: string
  sendNotification?: boolean
  closingNote?: string
}

export interface ReopenTicketRequest {
  ticketId: string
  reason?: string
}

export interface AddNoteRequest {
  ticketId: string
  content: string
  type: NoteType
  /** Optional in real mode — backend derives author from the authenticated session */
  authorId?: string
}

export interface AssignTicketRequest {
  ticketId: string
  /** Backend field name */
  assignedUserId: string
  note?: string
}

export interface ReassignTicketRequest {
  ticketId: string
  /** Backend field name */
  newUserId: string
  note?: string
}

export interface UnassignTicketRequest {
  ticketId: string
  reason?: string
}

export interface TransferTicketRequest {
  ticketId: string
  fromGroupId: string
  toGroupId: string
  reason: string
  clearAssignee?: boolean
}

export interface CreateUserRequest {
  firstName: string
  lastName: string
  email: string
  role: string
  groupIds?: string[]
}

export interface UpdateUserRequest {
  firstName?: string
  lastName?: string
  email?: string
  role?: string
  groupIds?: string[]
}

export interface CreateGroupRequest {
  name: string
  description?: string
  groupType?: GroupType
  memberIds?: string[]
}

export interface UpdateGroupRequest {
  name?: string
  description?: string
  memberIds?: string[]
}

export interface CreateCustomerRequest {
  name: string
  segment: string
  emails: string[]
  phone?: string
}

export interface UpdateCustomerRequest {
  name?: string
  segment?: string
  emails?: string[]
  phone?: string
  notes?: string
}

export interface CreateContactRequest {
  customerId: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  isPrimary?: boolean
}

export interface UpdateContactRequest {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  isPrimary?: boolean
}
