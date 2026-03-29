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
 * Production contract includes permission codes and role metadata.
 */
export interface AuthMeResponse {
  id: string
  username: string
  email: string
  fullName: string
  /** Legacy role enum — kept for backward compat; prefer roleCode for display */
  role: BackendRole
  /** Dynamic role record id */
  roleId?: number | string
  /** Dynamic role code (e.g. "SENIOR_AGENT") */
  roleCode?: string
  /** Human-readable role display name */
  roleName?: string
  /** Permission codes granted to this user (e.g. "TICKET_ASSIGN", "REPORT_VIEW") */
  permissionCodes?: string[]
  /** Ticket visibility scope: ALL = see all, OWN = own tickets, GROUP = own group */
  ticketScope?: 'ALL' | 'GROUP' | 'OWN'
  /** Group IDs the user belongs to */
  groupIds?: (string | number)[]
}

// ---------------------------------------------------------------------------
// Role Management DTOs
// ---------------------------------------------------------------------------

/**
 * GET /api/roles — summary item
 */
export interface RoleResponse {
  id: number | string
  code: string
  name: string
  ticketScope: RoleTicketScope
  isActive: boolean
  permissionCount: number
  userCount?: number
}

/** GET /api/roles/{id} — full role detail */
export interface RoleDetailResponse {
  id: number | string
  code: string
  name: string
  description?: string
  ticketScope: RoleTicketScope
  isActive: boolean
  permissions: string[]
  userCount?: number
}

/** Role ticket scope values supported by backend role contract */
export type RoleTicketScope = 'ALL' | 'OWN_GROUPS' | 'OWN_AND_OWN_GROUPS' | 'ASSIGNED_ONLY'

/**
 * GET /api/roles/permissions — flat list of all available permission codes
 * Each entry is { code, label, description }
 */
export interface PermissionDefinition {
  code: string
  label: string
  description?: string
  /** optional grouping category for display (e.g. "Tickets", "Admin") */
  category?: string
}

/** POST /api/roles request body */
export interface CreateRoleRequest {
  code: string
  name: string
  description?: string
  ticketScope: RoleTicketScope
  permissions: string[]
}

/** PUT /api/roles/{id} request body */
export interface UpdateRoleRequest {
  code: string
  name: string
  description?: string
  ticketScope: RoleTicketScope
  permissions: string[]
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

type ExtensibleEnum<T extends string> = T | (string & {})

export type UnknownSenderPolicy = ExtensibleEnum<
  | 'ALLOW'
  | 'REJECT'
  | 'QUARANTINE'
  | 'ROUTE_TO_DEFAULT'
  | 'AUTO_CREATE_CONTACT'
>

export type MailboxProviderType = ExtensibleEnum<
  | 'SMTP'
  | 'MICROSOFT_365'
  | 'GOOGLE_WORKSPACE'
  | 'GENERIC'
>

export type MailboxInboundMode = ExtensibleEnum<'PULL' | 'PUSH' | 'DISABLED'>

export type MailboxOutboundMode = ExtensibleEnum<'SMTP' | 'API' | 'DISABLED'>

export type IngressStatus = ExtensibleEnum<
  | 'RECEIVED'
  | 'PARSED'
  | 'ROUTED'
  | 'FAILED'
  | 'QUARANTINED'
  | 'REPLAYED'
  | 'RELEASED'
>

export type OutboundDispatchStatus = ExtensibleEnum<
  | 'QUEUED'
  | 'PROCESSING'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'FAILED'
>

export type CustomerEmailRoutingRuleMatchType = 'EXACT_EMAIL' | 'DOMAIN_SUFFIX'

export type TicketEmailDirection = 'INBOUND' | 'OUTBOUND'

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
// Email platform DTOs
// ---------------------------------------------------------------------------

export interface MailboxResponse {
  id: string
  name: string
  emailAddress: string
  displayName: string | null
  providerType: MailboxProviderType
  inboundMode: MailboxInboundMode
  outboundMode: MailboxOutboundMode
  isActive: boolean
  inboundEnabled: boolean
  outboundEnabled: boolean
  defaultGroupId: string | null
  defaultGroupName: string | null
  defaultPriority: string | null
  defaultStatus: string | null
  unknownSenderPolicy: UnknownSenderPolicy
  lastInboundSuccessAt: string | null
  lastOutboundSuccessAt: string | null
  createdAt: string
  updatedAt: string
}

export type MailboxListResponse = PagedResponse<MailboxResponse>

export interface CreateMailboxRequest {
  name: string
  emailAddress: string
  displayName?: string | null
  providerType: MailboxProviderType
  inboundMode: MailboxInboundMode
  outboundMode: MailboxOutboundMode
  inboundEnabled: boolean
  outboundEnabled: boolean
  defaultGroupId?: string | null
  defaultPriority?: string | null
  defaultStatus?: string | null
  unknownSenderPolicy: UnknownSenderPolicy
}

export interface UpdateMailboxRequest extends CreateMailboxRequest {}

export interface CustomerEmailSettingsResponse {
  customerId: string
  customerName?: string | null
  mailboxId: string | null
  mailboxName: string | null
  trustedContactsOnly: boolean
  autoCreateContact: boolean
  allowSubdomains: boolean
  unknownSenderPolicy: UnknownSenderPolicy
  defaultGroupId: string | null
  defaultGroupName: string | null
  defaultPriority: string | null
  defaultStatus: string | null
  updatedAt: string | null
}

export interface UpsertCustomerEmailSettingsRequest {
  mailboxId?: string | null
  trustedContactsOnly: boolean
  autoCreateContact: boolean
  allowSubdomains: boolean
  unknownSenderPolicy: UnknownSenderPolicy
  defaultGroupId?: string | null
  defaultPriority?: string | null
  defaultStatus?: string | null
}

export interface CustomerEmailRoutingRuleResponse {
  id: string
  customerId: string
  matchType: CustomerEmailRoutingRuleMatchType
  matchValue: string
  mailboxId: string | null
  mailboxName: string | null
  groupId: string | null
  groupName: string | null
  priority: string | null
  status: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface UpsertCustomerEmailRoutingRuleRequest {
  matchType: CustomerEmailRoutingRuleMatchType
  matchValue: string
  mailboxId?: string | null
  groupId?: string | null
  priority?: string | null
  status?: string | null
  isActive?: boolean
}

export interface IngressEventResponse {
  id: string
  mailboxId: string | null
  mailboxName: string | null
  mailboxAddress: string | null
  providerType: MailboxProviderType | null
  messageId: string
  subject: string | null
  sender: string | null
  status: IngressStatus
  receivedAt: string
  processedAt: string | null
  lastErrorSummary: string | null
}

export interface IngressEventDetailResponse extends IngressEventResponse {
  recipients: string[]
  cc: string[]
  rawHeaders: Record<string, string>
  payloadExcerpt: string | null
  quarantineReason: string | null
  quarantinedAt: string | null
  replayedAt: string | null
  relatedTicketId: string | null
}

export interface TicketEmailAttachmentResponse {
  id: string | null
  fileName: string
  contentType: string | null
  size: number | null
  downloadUrl: string | null
}

export interface TicketEmailMessageResponse {
  id: string
  ticketId: string
  threadKey: string | null
  messageId: string
  providerMessageId: string | null
  mailboxId: string | null
  mailboxName: string | null
  direction: TicketEmailDirection
  subject: string | null
  from: string | null
  to: string[]
  cc: string[]
  bcc: string[]
  bodyText: string | null
  bodyHtml: string | null
  bodyPreview: string | null
  sentAt: string | null
  receivedAt: string | null
  dispatchStatus: OutboundDispatchStatus | null
  attachments: TicketEmailAttachmentResponse[]
}

export interface SendTicketReplyResponse {
  requestId: string
  ticketId: string
  outboundEmailId: string | null
  mailboxId: string | null
  status: OutboundDispatchStatus
  acceptedAt: string | null
  message: string | null
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
 * Spec: { username, email, fullName, password, roleId, groupIds?, isActive? }
 */
export interface CreateUserRequest {
  username: string
  email: string
  fullName: string
  password: string
  roleId: number | string
  groupIds?: number[]
  isActive?: boolean
}

/**
 * PUT /api/users/{id} body
 * Spec: { username, email, fullName, roleId, isActive, groupIds?, password? }
 */
export interface UpdateUserRequest {
  username: string
  email: string
  fullName: string
  roleId: number | string
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
