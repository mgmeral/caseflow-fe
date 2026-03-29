import type {
  CreateMailboxRequest,
  MailboxResponse,
  UpdateMailboxRequest,
} from '@/types/api.types'
import type { MailboxListResult } from '@/types/email.types'
import { apiClient } from './api.client'
import { USE_MOCKS } from '@/lib/env'
import { getMockDelay } from '@/mock'
import { mockMailboxes } from '@/mock/email-platform.mock'
import { normalizeMailbox, normalizeMailboxList } from './email-platform.normalizers'

export interface MailboxListFilters {
  page?: number
  size?: number
  search?: string
  active?: boolean
  providerType?: string
}

let mailboxStore = [...mockMailboxes]

const mockService = {
  list: async (filters: MailboxListFilters = {}): Promise<MailboxListResult> => {
    await getMockDelay()
    let result = [...mailboxStore]
    if (filters.search) {
      const query = filters.search.toLowerCase()
      result = result.filter((item) =>
        item.name.toLowerCase().includes(query) ||
        item.emailAddress.toLowerCase().includes(query) ||
        (item.displayName ?? '').toLowerCase().includes(query),
      )
    }
    if (filters.active !== undefined) {
      result = result.filter((item) => item.isActive === filters.active)
    }
    if (filters.providerType) {
      result = result.filter((item) => item.providerType === filters.providerType)
    }
    return normalizeMailboxList(result)
  },

  getById: async (id: string) => {
    await getMockDelay()
    const mailbox = mailboxStore.find((item) => item.id === id)
    return mailbox ? normalizeMailbox(mailbox) : null
  },

  create: async (payload: CreateMailboxRequest) => {
    await getMockDelay()
    const mailbox: MailboxResponse = {
      id: `mbx-${Date.now()}`,
      ...payload,
      displayName: payload.displayName ?? null,
      defaultGroupId: payload.defaultGroupId ?? null,
      defaultGroupName: null,
      defaultPriority: payload.defaultPriority ?? null,
      defaultStatus: payload.defaultStatus ?? null,
      isActive: true,
      lastInboundSuccessAt: null,
      lastOutboundSuccessAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    mailboxStore = [mailbox, ...mailboxStore]
    return normalizeMailbox(mailbox)
  },

  update: async (id: string, payload: UpdateMailboxRequest) => {
    await getMockDelay()
    mailboxStore = mailboxStore.map((item) =>
      item.id === id
        ? {
            ...item,
            ...payload,
            displayName: payload.displayName ?? null,
            defaultGroupId: payload.defaultGroupId ?? null,
            defaultPriority: payload.defaultPriority ?? null,
            defaultStatus: payload.defaultStatus ?? null,
            updatedAt: new Date().toISOString(),
          }
        : item,
    )
    const mailbox = mailboxStore.find((item) => item.id === id)
    if (!mailbox) throw new Error('Mailbox not found')
    return normalizeMailbox(mailbox)
  },

  activate: async (id: string) => {
    await getMockDelay()
    mailboxStore = mailboxStore.map((item) =>
      item.id === id
        ? { ...item, isActive: true, updatedAt: new Date().toISOString() }
        : item,
    )
    const mailbox = mailboxStore.find((item) => item.id === id)
    if (!mailbox) throw new Error('Mailbox not found')
    return normalizeMailbox(mailbox)
  },

  deactivate: async (id: string) => {
    await getMockDelay()
    mailboxStore = mailboxStore.map((item) =>
      item.id === id
        ? { ...item, isActive: false, updatedAt: new Date().toISOString() }
        : item,
    )
    const mailbox = mailboxStore.find((item) => item.id === id)
    if (!mailbox) throw new Error('Mailbox not found')
    return normalizeMailbox(mailbox)
  },
}

const realService = {
  list: async (filters: MailboxListFilters = {}): Promise<MailboxListResult> => {
    const params = new URLSearchParams()
    if (filters.page !== undefined) params.set('page', String(filters.page))
    if (filters.size !== undefined) params.set('size', String(filters.size))
    if (filters.search) params.set('search', filters.search)
    if (filters.active !== undefined) params.set('active', String(filters.active))
    if (filters.providerType) params.set('providerType', filters.providerType)
    const query = params.toString()
    const response = await apiClient.get<{ items: MailboxResponse[]; page: number; size: number; totalElements: number; totalPages: number } | MailboxResponse[]>(
      `/mailboxes${query ? `?${query}` : ''}`,
    )
    return normalizeMailboxList(response)
  },

  getById: async (id: string) => normalizeMailbox(await apiClient.get<MailboxResponse>(`/mailboxes/${id}`)),

  create: async (payload: CreateMailboxRequest) => normalizeMailbox(await apiClient.post<MailboxResponse>('/mailboxes', payload)),

  update: async (id: string, payload: UpdateMailboxRequest) => normalizeMailbox(await apiClient.put<MailboxResponse>(`/mailboxes/${id}`, payload)),

  activate: async (id: string) => normalizeMailbox(await apiClient.patch<MailboxResponse>(`/mailboxes/${id}/activate`, {})),

  deactivate: async (id: string) => normalizeMailbox(await apiClient.patch<MailboxResponse>(`/mailboxes/${id}/deactivate`, {})),
}

export const mailboxService = USE_MOCKS ? mockService : realService