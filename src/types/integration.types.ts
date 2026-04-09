export type JiraJobStatus =
  | 'NOT_REQUESTED'
  | 'PENDING'
  | 'PROCESSING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'PERMANENTLY_FAILED'
  | 'CANCELED'

export interface JiraStatusResponse {
  jobId: number | null
  jobStatus: JiraJobStatus
  attemptCount: number | null
  lastError: string | null
  nextAttemptAt: string | null
  jiraIssueKey: string | null
  jiraUrl: string | null
  linkedAt: string | null
}

export interface JiraConfigResponse {
  id: number
  enabled: boolean
  baseUrl: string
  authType: string
  username: string | null
  apiToken: string | null
  projectKey: string
  issueType: string
  defaultLabels: string | null
  appBaseUrl: string | null
  updatedAt: string
}

export interface JiraConfigRequest {
  baseUrl: string
  authType?: string | null
  username?: string | null
  apiToken?: string | null
  projectKey: string
  issueType?: string | null
  defaultLabels?: string | null
  appBaseUrl?: string | null
  enabled: boolean
}

export interface IntegrationConnectionTestResult {
  success: boolean
  message: string
}

export type ChannelType = 'SLACK' | 'TEAMS'

export type ScopeType = 'GLOBAL' | 'GROUP' | 'CUSTOMER'

export type NotificationEventType = string

export interface ChannelEventCatalogItem {
  value: NotificationEventType
  label: string
  group: string
  description?: string | null
}

export interface ChannelConfigResponse {
  id: number
  name: string
  channelType: ChannelType
  enabled: boolean
  webhookUrl: string
  subscribedEvents: string
  scopeType: ScopeType
  scopeId: number | null
  createdAt: string
  updatedAt: string
}

export interface ChannelConfig {
  id: number
  name: string
  channelType: ChannelType
  enabled: boolean
  webhookUrlMasked: string | null
  webhookConfigured: boolean
  subscribedEvents: NotificationEventType[]
  scopeType: ScopeType
  scopeId: number | null
  createdAt: string
  updatedAt: string
}

export interface ChannelConfigRequest {
  name: string
  channelType: ChannelType
  webhookUrl: string
  subscribedEvents: NotificationEventType[]
  scopeType?: ScopeType | null
  scopeId?: number | null
  enabled: boolean
}

export type DispatchStatus =
  | 'PENDING'
  | 'SENDING'
  | 'SENT'
  | 'FAILED'
  | 'PERMANENTLY_FAILED'
  | 'CANCELED'

export interface ScheduledEmailResponse {
  id: number
  ticketId: number
  mailboxId: number
  toAddress: string
  subject: string
  status: DispatchStatus
  sendNotBefore: string
  canceledAt: string | null
  sentAt: string | null
  createdAt: string
}

export interface ScheduleEmailRequest {
  mailboxId: number
  toAddress: string
  subject: string
  textBody: string
  htmlBody?: string | null
  sendNotBefore: string
}