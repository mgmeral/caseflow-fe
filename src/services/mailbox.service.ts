import type {
  CreateMailboxRequest,
  MailboxImapConnectionTestResponse,
  MailboxConnectionTestResponse,
  MailboxSmtpConnectionTestResponse,
  MailboxResponse,
  UpdateMailboxRequest,
} from '@/types/api.types'
import type { MailboxListResult } from '@/types/email.types'
import { apiClient } from './api.client'
import { normalizeInitialSyncStrategy, normalizeMailbox, normalizeMailboxList } from './email-platform.normalizers'

function toBackendMailboxPayload(payload: CreateMailboxRequest): CreateMailboxRequest {
  const parsedDefaultGroupId =
    payload.defaultGroupId == null || payload.defaultGroupId === ''
      ? null
      : Number(payload.defaultGroupId)
  const defaultGroupId = Number.isFinite(parsedDefaultGroupId ?? NaN) ? parsedDefaultGroupId : null
  const pollInterval = Math.min(86_400, Math.max(30, payload.pollIntervalSeconds ?? 60))
  const cleanString = (value?: string | null) => {
    const trimmed = value?.trim()
    return trimmed ? trimmed : null
  }

  return {
    name: payload.name,
    displayName: payload.displayName ?? null,
    address: payload.address,
    providerType: payload.providerType ?? 'IMAP',
    inboundMode: payload.inboundMode ?? 'POLLING',
    outboundMode: payload.outboundMode ?? 'SMTP',
    isActive: payload.isActive ?? true,
    defaultGroupId,
    defaultPriority: payload.defaultPriority ?? null,
    smtpHost: cleanString(payload.smtpHost),
    smtpPort: payload.smtpPort ?? null,
    smtpUsername: cleanString(payload.smtpUsername),
    smtpPassword: cleanString(payload.smtpPassword),
    smtpUseSsl: payload.smtpUseSsl ?? true,
    imapHost: cleanString(payload.imapHost),
    imapPort: payload.imapPort ?? null,
    imapUsername: cleanString(payload.imapUsername),
    imapPassword: cleanString(payload.imapPassword),
    imapUseSsl: payload.imapUseSsl ?? true,
    imapFolder: cleanString(payload.imapFolder) ?? 'INBOX',
    pollingEnabled: payload.pollingEnabled ?? true,
    pollIntervalSeconds: pollInterval,
    initialSyncStrategy: normalizeInitialSyncStrategy(payload.initialSyncStrategy) ?? 'NEW_MESSAGES_ONLY',
  }
}

export interface MailboxListFilters {
  page?: number
  size?: number
  activeOnly?: boolean

  // Backward-compatible aliases used by existing callers.
  search?: string
  active?: boolean
  pollingEnabled?: boolean
  pollingStatus?: string
}

export const mailboxService = {
  list: async (filters: MailboxListFilters = {}): Promise<MailboxListResult> => {
    const params = new URLSearchParams()
    const activeOnly = filters.activeOnly ?? filters.active

    if (filters.page !== undefined) params.set('page', String(filters.page))
    if (filters.size !== undefined) params.set('size', String(filters.size))
    if (activeOnly !== undefined) params.set('activeOnly', String(activeOnly))
    const query = params.toString()
    const response = await apiClient.get<{ items: MailboxResponse[]; page: number; size: number; totalElements: number; totalPages: number } | MailboxResponse[]>(
      `/admin/mailboxes${query ? `?${query}` : ''}`,
    )
    return normalizeMailboxList(response)
  },

  getById: async (id: string) =>
    normalizeMailbox(await apiClient.get<MailboxResponse>(`/admin/mailboxes/${id}`)),

  create: async (payload: CreateMailboxRequest) =>
    normalizeMailbox(await apiClient.post<MailboxResponse>('/admin/mailboxes', toBackendMailboxPayload(payload))),

  update: async (id: string, payload: UpdateMailboxRequest) =>
    normalizeMailbox(await apiClient.put<MailboxResponse>(`/admin/mailboxes/${id}`, toBackendMailboxPayload(payload))),

  activate: async (id: string) =>
    normalizeMailbox(await apiClient.patch<MailboxResponse>(`/admin/mailboxes/${id}/activate`, {})),

  deactivate: async (id: string) =>
    normalizeMailbox(await apiClient.patch<MailboxResponse>(`/admin/mailboxes/${id}/deactivate`, {})),

  testImapConnection: async (id: string): Promise<MailboxImapConnectionTestResponse> => {
    const result = await apiClient.post<MailboxConnectionTestResponse>(`/admin/mailboxes/${id}/test-connection`, {})
    return result.imap ?? result
  },

  testSmtpConnection: async (id: string): Promise<MailboxSmtpConnectionTestResponse> => {
    const result = await apiClient.post<MailboxConnectionTestResponse>(`/admin/mailboxes/${id}/test-smtp-connection`, {})
    return result.smtp ?? result
  },
}
