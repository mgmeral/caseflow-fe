import type { Ticket, TicketFilters, TicketMessage, TicketStatus, TicketPriority, TransferRecord } from '@/types/ticket.types'
import type { SortState } from '@/types/common.types'
import type {
  NoteResponse,
  EmailDocumentResponse,
  EmailDocumentSummaryResponse,
  TicketStatusTransitionListResponse,
  TransferListItem,
  PagedResponse,
} from '@/types/api.types'
import { apiClient, ApiError } from './api.client'
import { normalizeStatus, normalizeTicket, toBackendStatus, toBackendPriority } from './normalizers'
import { DEFAULT_TICKET_SORT, isSupportedTicketSortField } from '@/lib/ticketQueryContracts'
import { mapNoteResponseToTicketMessage } from '@/lib/noteMessage'

function emailToMessage(e: EmailDocumentResponse): TicketMessage {
  return {
    id: e.id,
    ticketId: e.ticketId,
    type: 'public_inbound',
    authorId: null,
    authorName: e.from ?? '',
    content: e.textBody ?? e.sanitizedHtmlBody ?? e.htmlBody ?? '',
    createdAt: e.receivedAt ?? new Date().toISOString(),
    attachments: (e.attachments ?? []).map((a) => a.fileName),
  }
}

// ---------------------------------------------------------------------------
// Real API implementation — aligned to backend contract
// ---------------------------------------------------------------------------

export const ticketService = {
  getAll: async (
    filters: TicketFilters,
    sort: SortState,
    page: number,
    pageSize: number,
  ): Promise<{ data: Ticket[]; total: number }> => {
    const params = new URLSearchParams()
    const safeSortField = isSupportedTicketSortField(sort.field) ? sort.field : DEFAULT_TICKET_SORT.field

    params.set('page', String(page - 1))
    params.set('size', String(pageSize))

    if (safeSortField) params.set('sort', safeSortField)
    if (sort.direction) params.set('direction', sort.direction)
    if (filters.search) params.set('search', filters.search)

    if (filters.statuses[0]) params.set('status', toBackendStatus(filters.statuses[0]))
    if (filters.priorities[0]) params.set('priority', toBackendPriority(filters.priorities[0]))
    if (filters.assignedUserIds[0]) params.set('userId', filters.assignedUserIds[0])
    if (filters.groupIds[0]) params.set('groupId', filters.groupIds[0])

    if (filters.dateFrom) params.set('from', filters.dateFrom)
    if (filters.dateTo) params.set('to', filters.dateTo)

    const res = await apiClient.get<PagedResponse<Record<string, unknown>> | Record<string, unknown>[]>(`/tickets?${params.toString()}`)

    if (Array.isArray(res)) return { data: res.map(normalizeTicket), total: res.length }
    return { data: res.items.map(normalizeTicket), total: res.totalElements }
  },

  getById: async (id: string): Promise<Ticket> => {
    const raw = await apiClient.get<Record<string, unknown>>(`/tickets/${id}`)
    return normalizeTicket(raw)
  },

  getAllowedTransitions: async (ticketId: string): Promise<TicketStatus[]> => {
    try {
      const response = await apiClient.get<TicketStatusTransitionListResponse | string[]>(`/tickets/${ticketId}/transitions`)
      const rawTransitions = Array.isArray(response)
        ? response
        : response.allowedTransitions ?? []
      return rawTransitions.map((value) => normalizeStatus(value))
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return []
      }
      throw error
    }
  },

  getByTicketNo: async (ticketNo: string): Promise<Ticket> => {
    const raw = await apiClient.get<Record<string, unknown>>(`/tickets/by-ticket-no/${encodeURIComponent(ticketNo)}`)
    return normalizeTicket(raw)
  },

  create: async (data: { subject: string; customerId?: string; priority: TicketPriority }): Promise<Ticket> => {
    const body: Record<string, unknown> = {
      subject: data.subject,
      priority: toBackendPriority(data.priority),
    }
    if (data.customerId) body.customerId = Number(data.customerId)
    const raw = await apiClient.post<Record<string, unknown>>('/tickets', body)
    return normalizeTicket(raw)
  },

  update: async (id: string, data: { subject: string; priority: TicketPriority; description?: string }): Promise<Ticket> => {
    const raw = await apiClient.put<Record<string, unknown>>(`/tickets/${id}`, {
      subject: data.subject,
      priority: toBackendPriority(data.priority),
      ...(data.description !== undefined ? { description: data.description } : {}),
    })
    return normalizeTicket(raw)
  },

  getMessages: async (ticketId: string): Promise<TicketMessage[]> => {
    const [notes, emailSummaries] = await Promise.all([
      apiClient.get<NoteResponse[]>(`/notes/by-ticket/${ticketId}`),
      apiClient.get<EmailDocumentSummaryResponse[]>(`/emails/by-ticket/${ticketId}`),
    ])

    const emailDetails = await Promise.all(
      emailSummaries.map((s) => apiClient.get<EmailDocumentResponse>(`/emails/${s.id}`)),
    )

    return [
      ...notes.map(mapNoteResponseToTicketMessage),
      ...emailDetails.map(emailToMessage),
    ].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  },

  getTransferHistory: async (ticketId: string): Promise<TransferRecord[]> => {
    const res = await apiClient.get<TransferListItem[]>(`/transfers/by-ticket/${ticketId}`)
    return res
      .map((t) => ({
        id: t.id,
        ticketId: String(t.ticketId),
        fromGroupId: String(t.fromGroupId),
        fromGroupName: '',
        toGroupId: String(t.toGroupId),
        toGroupName: '',
        transferredByName: '',
        reason: '',
        note: null,
        createdAt: t.transferredAt,
      }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },

  assign: async (
    ticketId: string,
    userId: string | null,
    _userName: string | null,
    _note?: string,
  ): Promise<Ticket> => {
    if (userId === null) {
      await apiClient.post('/assignments/unassign', { ticketId: Number(ticketId) })
    } else {
      await apiClient.post('/assignments/assign', {
        ticketId: Number(ticketId),
        assignedUserId: Number(userId),
      })
    }
    const raw = await apiClient.get<Record<string, unknown>>(`/tickets/${ticketId}`)
    return normalizeTicket(raw)
  },

  changeStatus: async (ticketId: string, status: TicketStatus, _reason?: string): Promise<Ticket> => {
    const raw = await apiClient.post<Record<string, unknown>>(`/tickets/${ticketId}/status`, {
      status: toBackendStatus(status),
    })
    return normalizeTicket(raw)
  },

  changePriority: async (ticketId: string, priority: TicketPriority): Promise<Ticket> => {
    const current = await apiClient.get<Record<string, unknown>>(`/tickets/${ticketId}`)
    const raw = await apiClient.put<Record<string, unknown>>(`/tickets/${ticketId}`, {
      subject: String(current.subject ?? ''),
      priority: toBackendPriority(priority),
    })
    return normalizeTicket(raw)
  },

  addInternalNote: async (
    ticketId: string,
    content: string,
    mentionedUserIds: string[],
  ): Promise<TicketMessage> => {
    const note = await apiClient.post<NoteResponse>('/notes', {
      ticketId: Number(ticketId),
      content,
      type: 'INTERNAL',
      mentionedUserIds,
    })
    return mapNoteResponseToTicketMessage(note)
  },

  addPublicReply: async (
    _ticketId: string,
    _content: string,
    _authorId: string,
    _authorName: string,
  ): Promise<TicketMessage> => {
    throw new ApiError(
      501,
      'not_implemented',
      'Use ticketEmailService.sendReply() for email replies.',
    )
  },

  transfer: async (
    ticketId: string,
    toGroupId: string,
    _toGroupName: string,
    fromGroupId: string,
    _fromGroupName: string,
    _byName: string,
    reason: string,
    _note?: string,
  ): Promise<Ticket> => {
    await apiClient.post('/transfers', {
      ticketId: Number(ticketId),
      fromGroupId: Number(fromGroupId),
      toGroupId: Number(toGroupId),
      reason,
      clearAssignee: true,
    })
    const raw = await apiClient.get<Record<string, unknown>>(`/tickets/${ticketId}`)
    return normalizeTicket(raw)
  },

  close: async (ticketId: string): Promise<Ticket> => {
    const raw = await apiClient.post<Record<string, unknown>>(`/tickets/${ticketId}/close`, {})
    return normalizeTicket(raw)
  },

  reopen: async (ticketId: string): Promise<Ticket> => {
    const raw = await apiClient.post<Record<string, unknown>>(`/tickets/${ticketId}/reopen`, {})
    return normalizeTicket(raw)
  },
}
