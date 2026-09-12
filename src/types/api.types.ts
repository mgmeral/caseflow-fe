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

export interface UserProfileResponse {
  id: string | number
  username?: string | null
  email?: string | null
  displayName?: string | null
  firstName?: string | null
  lastName?: string | null
  fullName?: string | null
  avatarUrl?: string | null
  locale?: string | null
  isActive?: boolean | null
  roleId?: string | number | null
  roleCode?: string | null
  roleName?: string | null
  permissionCodes?: string[] | null
  groupIds?: Array<string | number> | null
  groupNames?: string[] | null
  roles?: Array<{
    id?: string | number | null
    code?: string | null
    name?: string | null
  } | string> | null
  groups?: Array<{
    id?: string | number | null
    name?: string | null
  } | string> | null
}

export interface UpdateUserProfileRequest {
  displayName?: string
  firstName?: string
  lastName?: string
  locale?: 'tr' | 'en'
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
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
  /** Canonical field name from spec */
  permissionCodes: string[]
  /** @deprecated Use permissionCodes */
  permissions?: string[]
  version?: number | null
  createdAt?: string | null
  updatedAt?: string | null
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

export type MailProvider = ExtensibleEnum<'GMAIL' | 'OUTLOOK' | 'OTHER'>

export type MailboxAuthType = ExtensibleEnum<'PASSWORD' | 'PLAIN' | 'OAUTH2' | 'APP_PASSWORD'>

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

export interface BackendUserSummaryResponse {
  id?: string | number | null
  username?: string | null
  displayName?: string | null
  fullName?: string | null
  email?: string | null
}

export interface NoteMentionResponse extends BackendUserSummaryResponse {
  mentionedUserId?: string | number | null
  userId?: string | number | null
  displayText?: string | null
  startIndex?: number | null
  endIndex?: number | null
}

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
  createdBy: string | number
  createdByUser?: BackendUserSummaryResponse | null
  mentions?: NoteMentionResponse[] | null
  createdAt: string
  eventType?: string | null
  metadataJson?: string | null
}

export interface DashboardStatsResponse {
  totalTickets?: number | null
  activeTickets?: number | null
  resolvedTickets?: number | null
  closedTickets?: number | null
  unassignedTickets?: number | null
  waitingOver24h?: number | null
  myActionRequired?: number | null
  myActionRequiredItems?: Record<string, unknown>[] | null
  /** SLA fields — present only if backend supports them.
   *  breachedSlaCount is the canonical new field name; slaBreached is the legacy alias.
   */
  slaBreached?: number | null
  breachedSlaCount?: number | null
  atRisk?: number | null
  atRiskSlaCount?: number | null
}

export interface QueueStatsResponse {
  allUnassigned?: number | null
  /** Spec field */
  highOrCritical?: number | null
  /** @deprecated alias for highOrCritical */
  highCritical?: number | null
  /** @deprecated alias for allUnassigned */
  awaitingAssignment?: number | null
  waitingOver8h?: number | null
  slaBreached?: number | null
}

export interface ChannelEventCatalogResponseItem {
  value?: string | null
  code?: string | null
  eventType?: string | null
  label?: string | null
  displayName?: string | null
  group?: string | null
  category?: string | null
  description?: string | null
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
  fromGroupName?: string | null
  toGroupName?: string | null
  transferredByName?: string | null
  note?: string | null
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
  fromGroupName?: string | null
  toGroupName?: string | null
  transferredBy?: string | null
  transferredByName?: string | null
  reason?: string | null
  note?: string | null
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
  mailProvider?: MailProvider | null
  authType?: MailboxAuthType | null
  providerType?: MailboxSourceType
  inboundMode?: InboundMode
  outboundMode?: OutboundMode
  isActive: boolean
  defaultGroupId: string | number | null
  defaultPriority: string | null
  oauthTenantId?: string | null
  oauthClientId?: string | null
  oauthConfigured?: boolean | null
  smtpHost?: string | null
  smtpPort?: number | null
  smtpUsername?: string | null
  smtpStarttls?: boolean | null
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
  mailProvider?: MailProvider | null
  authType?: MailboxAuthType | null
  providerType: MailboxSourceType
  inboundMode: InboundMode
  outboundMode: OutboundMode
  isActive?: boolean
  defaultGroupId?: number | string | null
  defaultPriority?: string | null
  oauthTenantId?: string | null
  oauthClientId?: string | null
  oauthClientSecret?: string | null
  smtpHost?: string | null
  smtpPort?: number | null
  smtpUsername?: string | null
  smtpPassword?: string | null
  smtpStarttls?: boolean | null
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

/** POST /admin/mailboxes/{id}/poll-now */
export interface MailboxPollNowResponse {
  triggered: boolean
  message: string | null
  triggeredAt: string | null
}

/** POST /admin/mailboxes/{id}/reset-cursor */
export interface MailboxCursorResetResponse {
  reset: boolean
  message: string | null
  strategy: string | null
  resetAt: string | null
}

// ---------------------------------------------------------------------------
// Ingress Event DTOs
// ---------------------------------------------------------------------------

/**
 * Processing/quarantine status of an ingress event.
 * Extensible to accept new backend values without breaking the FE.
 */
export type IngressEventStatus = ExtensibleEnum<
  // Spec-defined values
  | 'RECEIVED'
  | 'PROCESSING'
  | 'PROCESSED'
  | 'FAILED'
  | 'QUARANTINED'
  // Legacy / extended values kept for backward compat
  | 'PENDING'
  | 'COMPLETED'
  | 'FAILED_RETRYABLE'
  | 'REPROCESSING'
  | 'RELEASED'
  | 'SKIPPED'
>

/** GET /admin/ingress/events — list item */
export interface IngressEventResponse {
  id: string | number
  externalId: string | null
  mailboxId: string | number | null
  mailboxName: string | null
  mailboxAddress: string | null
  status: IngressEventStatus
  fromAddress: string | null
  toAddress: string | null
  subject: string | null
  messageId: string | null
  errorMessage: string | null
  failureReason: string | null
  retryCount: number | null
  maxRetries: number | null
  receivedAt: string | null
  processedAt: string | null
  createdAt: string
  updatedAt: string
  ticketId: string | number | null
}

/** Paged list response from GET /admin/ingress/events */
export type IngressEventListResponse = {
  items: IngressEventResponse[]
  page: number
  size: number
  totalElements: number
  totalPages: number
} | IngressEventResponse[]

/** POST /admin/ingress/events/{id}/retry */
export interface IngressEventActionResponse {
  success: boolean
  message: string | null
  eventId: string | number
  newStatus: IngressEventStatus | null
}

/** GET /admin/ingress/events query filters */
export interface IngressEventListFilters {
  status?: IngressEventStatus | null
  mailboxId?: string | null
  page?: number
  size?: number
}

export interface CustomerEmailSettingsResponse {
  /** Spec field — settings record id */
  id?: number | null
  customerId: string
  customerName?: string | null
  isActive?: boolean
  /** @deprecated use isActive */
  isEnabled?: boolean
  allowSubdomains: boolean
  unknownSenderPolicy: UnknownSenderPolicy
  defaultGroupId: string | null
  defaultGroupName?: string | null
  defaultPriority: string | null
  updatedAt: string | null
  rules?: CustomerEmailRoutingRuleResponse[]
  /** @deprecated aliases */
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
  templateId?: string | number | null
  templateCode?: string | null
  templateName?: string | null
}

export interface TicketEmailReplyContextResponse {
  sourceEventId?: string | number | null
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
  /** Required — mailbox that will send the reply */
  mailboxId: number
  sourceEventId?: number | null
  templateId?: number | null
  templateCode?: string | null
  subjectOverride?: string | null
  bodyText?: string | null
  bodyHtml?: string | null
}

export interface TicketEmailReplyPreviewPlaceholderDiagnosticResponse {
  placeholder: string
  /** Spec field */
  severity: string
  message: string
  /** @deprecated Use severity */
  status?: 'EMPTY' | 'UNKNOWN' | null
}

export interface TicketEmailReplyPreviewResponse {
  ticketPublicId?: string | null
  sourceDetailType?: string | null
  sourceDetailId?: string | null
  mailboxId?: number | null
  mailboxName?: string | null
  mailboxAddress?: string | null
  derivedToAddress: string | null
  derivedFromAddress: string | null
  subject: string
  bodyText: string | null
  bodyHtml: string | null
  templateInfo?: TicketEmailTemplateInfoResponse | null
  placeholderDiagnostics?: TicketEmailReplyPreviewPlaceholderDiagnosticResponse[] | null
  warnings?: string[] | null
  isEditable?: boolean | null
  previewGeneratedAt?: string | null
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
  customerId?: number | null
  customerName?: string | null
  from?: string | null
  to?: string | null
  totalCount?: number | null
  openCount?: number | null
  newCount?: number | null
  inProgressCount?: number | null
  waitingCustomerCount?: number | null
  resolvedCount?: number | null
  closedCount?: number | null
  reopenedCount?: number | null
  byTag?: TicketTagBreakdownResponse[] | null
}

export interface AdminCustomerTicketAggregateItemResponse {
  customerId?: string | number | null
  customerName?: string | null
  customerColorHex?: string | null
  totalCount?: number | null
  openCount?: number | null
  newCount?: number | null
  inProgressCount?: number | null
  waitingCustomerCount?: number | null
  resolvedCount?: number | null
  closedCount?: number | null
  reopenedCount?: number | null
  byTag?: TicketTagBreakdownResponse[] | null
}

export interface SendTicketReplyResponse {
  requestId: string
  ticketId: string
  outboundEmailId: string | null
  mailboxId: string | null
  sourceEventId?: number | null
  status: OutboundDispatchStatus
  acceptedAt: string | null
  message: string | null
}

export interface ScheduledEmailResponse {
  id: string | number
  ticketId: string | number
  mailboxId: string | number | null
  /** Spec field — resolved outbound address */
  resolvedToAddress?: string | null
  /** @deprecated aliased from resolvedToAddress for backward compat */
  toAddress?: string | null
  fromAddress?: string | null
  subject: string
  status: OutboundDispatchStatus | string | null
  failureReason?: string | null
  failureCategory?: string | null
  sourceEventId?: number | null
  sendNotBefore: string
  createdAt: string
  sentAt?: string | null
  canceledAt?: string | null
}

export interface ScheduleEmailRequest {
  mailboxId: number
  toAddress?: string | null
  subject: string
  textBody: string
  htmlBody?: string | null
  sendNotBefore: string
  sourceEventId?: number | null
  templateId?: number | null
  templateCode?: string | null
  contentWasEdited?: boolean | null
}

export interface TicketStatusTransitionListResponse {
  currentStatus?: string | null
  allowedTransitions?: string[]
}

export interface MailTemplateResponse {
  id: string | number
  code?: string | null
  name?: string | null
  usageType?: string | null
  description?: string | null
  supportedPlaceholders?: string | null
  customerVisible?: boolean | null
  defaultStatusAfterSend?: string | null
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
  code: string
  name: string
  usageType?: string | null
  description?: string | null
  supportedPlaceholders?: string | null
  customerVisible?: boolean | null
  defaultStatusAfterSend?: string | null
  subjectTemplate?: string | null
  htmlTemplate: string
  plainTextTemplate: string
  isActive: boolean
}

export interface MailTemplatePreviewRequest {
  replyBody?: string | null
  ticketRef?: string | null
  mailboxName?: string | null
  agentName?: string | null
  signatureBlock?: string | null
}

export interface MailTemplatePreviewResponse {
  subject?: string | null
  html?: string | null
  /** Spec field — plain text rendered output */
  text?: string | null
  /** @deprecated aliases */
  renderedSubject?: string | null
  renderedHtml?: string | null
  plainText?: string | null
  renderedPlainText?: string | null
}

export interface NotificationResponse {
  id: string | number
  userId?: number | null
  type?: string | null
  title?: string | null
  message?: string | null
  /** @deprecated alias for message */
  content?: string | null
  ticketId?: string | number | null
  ticketPublicId?: string | null
  ticketNo?: string | null
  groupId?: number | null
  actorUserId?: number | null
  noteId?: number | null
  isRead?: boolean | null
  readAt?: string | null
  createdAt?: string | null
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
 * Spec: { id, publicId, ticketNo, subject, status, priority, customerId, customerName,
 *         assignedUserId, assignedUserName, assignedGroupId, assignedGroupName,
 *         createdAt, updatedAt, statusChangedAt, slaState, firstResponseDueAt, resolutionDueAt }
 */
export interface TicketSummaryResponse {
  id: string
  publicId?: string | null
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
  statusChangedAt?: string | null
  slaState?: 'OK' | 'WARNING' | 'BREACHED' | 'RESOLVED' | 'PAUSED' | null
  firstResponseDueAt?: string | null
  resolutionDueAt?: string | null
}

// ---------------------------------------------------------------------------
// User / Group summary DTOs
// ---------------------------------------------------------------------------

/**
 * GET /api/users list item
 * Spec: { id, username, fullName, roleId, roleCode, isActive }
 */
export interface UserSummaryResponse {
  id: number
  username: string
  fullName: string
  roleId?: number | null
  roleCode?: string | null
  /** @deprecated Backend no longer returns a legacy role enum; use roleCode instead */
  role?: BackendRole | null
  isActive: boolean
}

/**
 * GET /api/users/{id} / full UserResponse
 * Spec: { id, username, email, fullName, roleId, roleCode, roleName, isActive, groupIds, groupNames, createdAt, lastLoginAt }
 */
export interface UserResponse {
  id: number
  username: string
  email: string
  fullName: string
  roleId?: number | null
  roleCode?: string | null
  roleName?: string | null
  /** @deprecated Backend no longer returns a legacy role enum; use roleCode instead */
  role?: BackendRole | null
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
  memberIds?: number[] | null
  /** Full member objects — returned by GET /api/groups/{id} */
  members?: UserSummaryResponse[] | null
  createdAt: string
}

// ---------------------------------------------------------------------------
// Customer summary
// ---------------------------------------------------------------------------

/**
 * GET /api/customers list item
 * Spec: { id, name, code, isActive, colorHex }
 */
export interface CustomerSummaryResponse {
  id: number | string
  name: string
  code: string
  isActive: boolean
  colorHex?: string | null
}

/**
 * GET /api/customers/{id}
 * Spec: { id, name, code, isActive, colorHex, createdAt, updatedAt }
 */
export interface CustomerResponse {
  id: number | string
  name: string
  code: string
  isActive: boolean
  colorHex?: string | null
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
  mentionedUserIds?: string[]
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
 * Spec: { name [required], code [required], colorHex? }
 */
export interface CreateCustomerRequest {
  name: string
  code: string
  colorHex?: string | null
}

/**
 * PUT /api/customers/{id} body
 * Spec: { name [required], code [required], colorHex? }
 */
export interface UpdateCustomerRequest {
  name: string
  code: string
  colorHex?: string | null
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

// ---------------------------------------------------------------------------
// Ticket detail / SLA DTOs
// ---------------------------------------------------------------------------

/** SLA state values from spec */
export type SlaState = 'OK' | 'WARNING' | 'BREACHED' | 'RESOLVED' | 'PAUSED'

/** GET /api/tickets/{id}/detail — sla sub-object */
export interface SlaSummary {
  firstResponseDueAt?: string | null
  resolutionDueAt?: string | null
  firstResponseRespondedAt?: string | null
  firstResponseBreached?: boolean | null
  resolutionBreached?: boolean | null
  slaState?: SlaState | null
  ageMinutes?: number | null
  currentStatusAgeMinutes?: number | null
}

/**
 * GET /api/tickets/{id}/detail response
 * Extends TicketResponse with sla, attachments, history.
 */
export interface TicketDetailResponse {
  id: string | number
  publicId?: string | null
  ticketNo: string
  subject: string
  description?: string | null
  status: string
  priority: string
  customerId: string | number
  customerName: string
  assignedUserId?: number | null
  assignedUserName?: string | null
  assignedGroupId?: number | null
  assignedGroupName?: string | null
  createdAt: string
  updatedAt: string
  closedAt?: string | null
  statusChangedAt?: string | null
  sla?: SlaSummary | null
  attachments?: AttachmentMetadataResponse[] | null
  history?: Array<{
    id: number
    actionType: string
    performedBy?: number | null
    performedByName?: string | null
    sourceType?: string | null
    summary?: string | null
    performedAt: string
  }> | null
}

/**
 * GET /api/tickets/{id}/transitions response
 * Spec: { ticketId, currentStatus, allowedTransitions }
 */
export interface AllowedTransitionsResponse {
  ticketId?: number | null
  currentStatus?: string | null
  allowedTransitions?: string[]
}

// ---------------------------------------------------------------------------
// Dispatch DTO
// ---------------------------------------------------------------------------

export type DispatchFailureCategory =
  | 'SMTP_CONNECTION'
  | 'SMTP_AUTH_FAILURE'
  | 'TLS_FAILURE'
  | 'SMTP_RATE_LIMITED'
  | 'RECIPIENT_REJECTED'
  | 'MAILBOX_FULL'
  | 'CONTENT_REJECTED'
  | 'INVALID_ADDRESS'
  | 'MAILBOX_INACTIVE'
  | 'UNCONFIGURED'
  | 'REVALIDATION_FAILURE'
  | 'UNKNOWN'

/**
 * GET /api/tickets/{ticketId}/email/outbound/{dispatchId}
 * Also returned by sendReply, retryDispatch, cancelDispatch
 */
export interface DispatchResponse {
  id: string | number
  ticketId: string | number
  mailboxId?: number | null
  sourceIngressEventId?: number | null
  sentByUserId?: number | null
  messageId?: string | null
  fromAddress?: string | null
  toAddress?: string | null
  resolvedToAddress?: string | null
  subject?: string | null
  status: OutboundDispatchStatus
  attempts?: number | null
  lastAttemptAt?: string | null
  sentAt?: string | null
  failureReason?: string | null
  failureCategory?: DispatchFailureCategory | null
  scheduledAt?: string | null
  createdAt?: string | null
}
