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
  /** Legacy enum may still appear in mixed environments, but is not the source of truth. */
  role?: BackendRole
  roleId: number | string
  roleCode: string
  roleName: string
  permissionCodes: string[]
  ticketScope: RoleTicketScope
  groupIds: (string | number)[]
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
  | 'MANUAL_REVIEW'
  | 'CREATE_UNMATCHED_TICKET'
  | 'IGNORE'
  | 'REJECT'
  // Backward-compatible legacy values still accepted by FE state.
  | 'ALLOW'
  | 'QUARANTINE'
  | 'ROUTE_TO_DEFAULT'
  | 'AUTO_CREATE_CONTACT'
>

/** Phase 1 — only IMAP_POLLING is supported */
export type MailboxSourceType = ExtensibleEnum<'IMAP' | 'WEBHOOK' | 'SMTP_RELAY' | 'IMAP_POLLING'>

export type MailboxAuthType = ExtensibleEnum<'PLAIN' | 'OAUTH2' | 'APP_PASSWORD'>

export type InboundMode = ExtensibleEnum<'POLLING' | 'WEBHOOK'>

export type OutboundMode = ExtensibleEnum<'SMTP' | 'RELAY'>

export type InitialSyncStrategy = ExtensibleEnum<
  | 'NEW_MESSAGES_ONLY'
  | 'SCAN_FROM_START'
  | 'SCAN_LAST_1_DAY'
  | 'SCAN_LAST_3_DAYS'
  | 'SCAN_LAST_7_DAYS'
  | 'START_FROM_LATEST'
  | 'BACKFILL_ALL'
>

export type PollingStatus = ExtensibleEnum<'IDLE' | 'RUNNING' | 'PAUSED' | 'ERROR'>

export type ProcessingStatus = ExtensibleEnum<
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'FAILED_RETRYABLE'
  | 'REPROCESSING'
>

export type OutboundDispatchStatus = ExtensibleEnum<
  | 'PENDING'
  | 'SENDING'
  | 'SENT'
  | 'PERMANENTLY_FAILED'
  | 'QUEUED'
  | 'PROCESSING'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'FAILED'
>

export type SenderMatchType = 'EXACT_EMAIL' | 'DOMAIN' | 'DOMAIN_SUFFIX'

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
  eventType?: string | null
  metadataJson?: string | null
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
  previewSupported?: boolean | null
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
  sanitizedHtmlBody?: string | null
  htmlBody?: string | null
  attachments: AttachmentMetadataResponse[]
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
  id: string | number
  name: string
  displayName?: string | null
  address?: string
  providerType?: MailboxSourceType
  inboundMode?: InboundMode
  outboundMode?: OutboundMode
  isActive: boolean
  defaultGroupId: string | number | null
  defaultPriority: string | null
  smtpHost?: string | null
  smtpPort?: number | null
  smtpUsername?: string | null
  smtpUseSsl?: boolean | null
  imapHost?: string | null
  imapPort?: number | null
  imapUsername?: string | null
  imapUseSsl?: boolean | null
  imapFolder?: string | null
  initialSyncStrategy?: InitialSyncStrategy | null
  cursorInitStrategy?: InitialSyncStrategy | string | null
  lastSeenUid?: string | number | null
  activationState?: string | null
  pollingEnabled?: boolean
  pollIntervalSeconds?: number
  lastPollAt?: string | null
  lastPollError?: string | null
  lastSuccessfulInboundAt?: string | null
  lastSuccessfulOutboundAt?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  pollingStatus?: PollingStatus
}

export type MailboxListResponse = PagedResponse<MailboxResponse>

export interface CreateMailboxRequest {
  name: string
  displayName?: string | null
  address: string
  providerType: MailboxSourceType
  inboundMode: InboundMode
  outboundMode: OutboundMode
  isActive?: boolean
  defaultGroupId?: number | string | null
  defaultPriority?: string | null
  smtpHost?: string | null
  smtpPort?: number | null
  smtpUsername?: string | null
  smtpPassword?: string | null
  smtpUseSsl?: boolean | null
  imapHost?: string | null
  imapPort?: number | null
  imapUsername?: string | null
  imapPassword?: string | null
  imapUseSsl?: boolean | null
  imapFolder?: string | null
  pollingEnabled?: boolean
  pollIntervalSeconds?: number
  initialSyncStrategy?: InitialSyncStrategy
}

export interface UpdateMailboxRequest extends CreateMailboxRequest {}

export interface MailboxProtocolTestResult {
  success: boolean
  message: string
  testedAt: string
}

export interface MailboxImapConnectionTestResponse extends MailboxProtocolTestResult {}

export interface MailboxSmtpConnectionTestResponse extends MailboxProtocolTestResult {}

export interface MailboxConnectionTestResponse extends MailboxProtocolTestResult {
  imap?: MailboxImapConnectionTestResponse | null
  smtp?: MailboxSmtpConnectionTestResponse | null
}

export interface CustomerEmailSettingsResponse {
  customerId: string
  customerName?: string | null
  isActive?: boolean
  isEnabled: boolean
  allowSubdomains: boolean
  unknownSenderPolicy: UnknownSenderPolicy
  defaultGroupId: string | null
  defaultGroupName: string | null
  defaultPriority: string | null
  updatedAt: string | null
  rules?: CustomerEmailRoutingRuleResponse[]
  routingRules?: CustomerEmailRoutingRuleResponse[]
  senderPatterns?: CustomerEmailRoutingRuleResponse[]
}

export interface UpsertCustomerEmailSettingsRequest {
  isActive?: boolean
  isEnabled: boolean
  allowSubdomains: boolean
  unknownSenderPolicy: UnknownSenderPolicy
  defaultGroupId?: string | null
  defaultPriority?: string | null
}

export interface CustomerEmailRoutingRuleResponse {
  id: string
  customerId: string
  recipientMailboxId: string | null
  recipientMailboxName: string | null
  senderMatchType?: SenderMatchType
  ruleType?: SenderMatchType | string | null
  matchValue?: string | null
  senderMatchValue?: string | null
  pattern?: string | null
  value?: string | null
  priority?: number | null
  isActive?: boolean | null
  active?: boolean | null
  allowSubdomains?: boolean | null
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export interface UpsertCustomerEmailRoutingRuleRequest {
  recipientMailboxId?: string | null
  senderMatchType: SenderMatchType
  matchValue?: string
  senderMatchValue: string
  priority: number
  isActive?: boolean
  notes?: string | null
}

export interface TicketEmailAttachmentResponse {
  id: string | null
  fileName: string
  contentType: string | null
  size?: number | null
  sizeBytes?: number | null
  previewSupported?: boolean | null
  previewUrl?: string | null
  openUrl?: string | null
  downloadPath?: string | null
  downloadUrl?: string | null
}

export type TicketEmailDetailType = 'INBOUND' | 'OUTBOUND'

export interface TicketEmailTemplateInfoResponse {
  templateId?: string | null
  templateCode?: string | null
  templateName?: string | null
}

export interface TicketEmailReplyContextResponse {
  sourceEventId?: string | null
  sourceEmailDocumentId?: string | null
  resolvedReplyTarget?: string | null
}

export interface UnifiedTicketEmailDetailResponse {
  detailType: TicketEmailDetailType
  id: string | number
  ticketPublicId: string
  direction: TicketEmailDirection
  mailboxId?: string | number | null
  mailboxName?: string | null
  mailboxAddress?: string | null
  messageId?: string | null
  threadMessageId?: string | null
  fromAddress?: string | null
  toAddress?: string[] | null
  cc?: string[] | null
  bcc?: string[] | null
  replyTo?: string[] | null
  subject?: string | null
  status?: string | null
  failureReason?: string | null
  sentAt?: string | null
  receivedAt?: string | null
  createdAt?: string | null
  bodyText?: string | null
  bodyHtml?: string | null
  bodyPreview?: string | null
  attachments?: TicketEmailAttachmentResponse[] | null
  templateInfo?: TicketEmailTemplateInfoResponse | null
  replyContext?: TicketEmailReplyContextResponse | null
  contentWasEdited?: boolean | null
}

export interface TicketEmailReplyPreviewRequest {
  sourceEventId: string
  mailboxId?: string | null
  templateId?: string | null
}

export interface TicketEmailReplyPreviewPlaceholderDiagnosticResponse {
  placeholder: string
  status: 'EMPTY' | 'UNKNOWN'
  message: string
}

export interface TicketEmailReplyPreviewResponse {
  derivedToAddress: string | null
  derivedFromAddress: string | null
  subject: string
  bodyText: string | null
  bodyHtml: string | null
  templateInfo?: TicketEmailTemplateInfoResponse | null
  placeholderDiagnostics?: TicketEmailReplyPreviewPlaceholderDiagnosticResponse[] | null
  warnings?: string[] | null
  mailboxName?: string | null
  mailboxAddress?: string | null
  isEditable?: boolean | null
}

export interface TicketEmailMessageResponse {
  id: string | number
  emailDocumentId?: string | null
  emailId?: string | null
  documentId?: string | null
  ticketId: string | number
  threadKey: string | null
  messageId: string
  providerMessageId: string | null
  mailboxId: string | null
  mailboxName: string | null
  sourceEventId?: string | number | null
  sourceEmailEventId?: string | number | null
  ingressEventId?: string | number | null
  direction: TicketEmailDirection
  subject: string | null
  from: string | null
  to: string[]
  cc: string[]
  bcc: string[]
  replyTo?: string[] | null
  bodyText: string | null
  bodyHtml: string | null
  sanitizedHtmlBody?: string | null
  rawHtmlBody?: string | null
  bodyPreview: string | null
  failureReason?: string | null
  lastError?: string | null
  sentAt: string | null
  receivedAt: string | null
  createdAt?: string | null
  processingStatus?: ProcessingStatus | null
  dispatchStatus: OutboundDispatchStatus | null
  attachmentCount?: number | null
  attachments: TicketEmailAttachmentResponse[]

  // Backend thread/detail aliases.
  fromAddress?: string | null
  toAddress?: string | null
  status?: string | null
  timestamp?: string | null
  mailboxAddress?: string | null
  threadMessageId?: string | null
  templateInfo?: TicketEmailTemplateInfoResponse | null
  replyContext?: TicketEmailReplyContextResponse | null
  contentWasEdited?: boolean | null
  resolvedReplyTarget?: string | null
  detailType?: TicketEmailDetailType | null
  detailId?: string | null
  hasAttachments?: boolean | null
  isPreviewAvailable?: boolean | null
}

export interface EmailThreadItemResponse {
  direction: 'INBOUND' | 'OUTBOUND'
  replyTo?: string[] | null
  id: string | number
  emailDocumentId?: string | null
  emailId?: string | null
  documentId?: string | null
  inboundEmailId?: string | null
  outboundEmailId?: string | null
  mailboxId?: string | number | null
  mailboxName?: string | null
  sourceEventId?: string | number | null
  sourceEmailEventId?: string | number | null
  createdAt?: string | null
  ingressEventId?: string | number | null
  messageId: string | null
  fromAddress: string | null
  toAddress: string | null
  subject: string | null
  status: string | null
  timestamp: string | null
  threadMessageId?: string | null
  templateInfo?: TicketEmailTemplateInfoResponse | null
  replyContext?: TicketEmailReplyContextResponse | null
  contentWasEdited?: boolean | null
  bodyPreview: string | null
  failureReason?: string | null
  attachmentCount?: number | null
  resolvedReplyTarget?: string | null
  detailType?: TicketEmailDetailType | null
  detailId?: string | number | null
  hasAttachments?: boolean | null
  isPreviewAvailable?: boolean | null
}

export interface TagResponse {
  id: string | number
  code: string
  name: string
  color?: string | null
  isActive?: boolean | null
}

export interface TagRequest {
  code: string
  name: string
  color?: string | null
  isActive?: boolean | null
}

export interface CreateTagRequest extends TagRequest {}

export interface UpdateTagRequest extends TagRequest {}

export interface TicketTagResponse {
  id?: string | number | null
  ticketId?: string | number | null
  tagId?: string | number | null
  taggedAt?: string | null
  taggedBy?: string | null
  taggedByName?: string | null
  tag?: TagResponse | null
  tagCode?: string | null
  tagName?: string | null
  tagColor?: string | null
  code?: string | null
  name?: string | null
  color?: string | null
  isActive?: boolean | null
}

export interface TicketTagBreakdownResponse {
  tagId?: string | number | null
  tagCode?: string | null
  tagName?: string | null
  tagColor?: string | null
  count?: number | null
}

export interface CustomerTicketReportResponse {
  totalCount?: number | null
  openCount?: number | null
  closedCount?: number | null
  resolvedCount?: number | null
  newCount?: number | null
  inProgressCount?: number | null
  waitingCustomerCount?: number | null
  reopenedCount?: number | null
  byTag?: TicketTagBreakdownResponse[] | null
}

export interface AdminCustomerTicketAggregateItemResponse {
  customerId?: string | number | null
  customerName?: string | null
  totalCount?: number | null
  openCount?: number | null
  closedCount?: number | null
  resolvedCount?: number | null
  waitingCustomerCount?: number | null
  byTag?: TicketTagBreakdownResponse[] | null
}

export interface SendTicketReplyResponse {
  requestId: string
  ticketId: string
  outboundEmailId: string | null
  mailboxId: string | null
  sourceEventId?: string | null
  status: OutboundDispatchStatus
  acceptedAt: string | null
  message: string | null
}

export interface TicketStatusTransitionListResponse {
  currentStatus?: string | null
  allowedTransitions?: string[]
}

export interface MailTemplateResponse {
  id: string | number
  name?: string | null
  code?: string | null
  subjectTemplate?: string | null
  htmlTemplate?: string | null
  plainTextTemplate?: string | null
  isActive?: boolean | null
  isBuiltIn?: boolean | null
  canEdit?: boolean | null
  canDelete?: boolean | null
  createdAt?: string | null
  updatedAt?: string | null
}

export interface MailTemplateRequest {
  name: string
  code: string
  subjectTemplate: string
  htmlTemplate: string
  plainTextTemplate: string
  isActive: boolean
}

export interface MailTemplatePreviewRequest {
  variables?: Record<string, string>
}

export interface MailTemplatePreviewResponse {
  subject?: string | null
  renderedSubject?: string | null
  html?: string | null
  renderedHtml?: string | null
  plainText?: string | null
  renderedPlainText?: string | null
}

export interface NotificationResponse {
  id: string | number
  title?: string | null
  message?: string | null
  content?: string | null
  type?: string | null
  isRead?: boolean | null
  createdAt?: string | null
  ticketId?: string | number | null
  ticketNo?: string | null
}

export interface UnreadCountResponse {
  unreadCount?: number | null
  count?: number | null
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
