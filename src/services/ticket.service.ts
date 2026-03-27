import type { Ticket, TicketFilters, TicketMessage, TicketStatus, TicketPriority, TransferRecord } from '@/types/ticket.types'
import type { SortState } from '@/types/common.types'
import type { NoteResponse, EmailDocumentResponse, EmailDocumentSummaryResponse, TransferResponse, PagedResponse } from '@/types/api.types'
import { apiClient, ApiError } from './api.client'
import { USE_MOCKS } from '@/lib/env'
import { mockTickets, mockMessages, mockTransferRecords, getMockDelay } from '@/mock'
import { normalizeTicket } from './normalizers'

// ---------------------------------------------------------------------------
// Mock implementation (only used when VITE_USE_MOCKS=true)
// ---------------------------------------------------------------------------

let _mockTickets = [...mockTickets]
let _mockMessages = [...mockMessages]
let _mockTransferRecords = [...mockTransferRecords]

function addSystemEvent(ticketId: string, content: string): void {
  _mockMessages.push({
    id: `sys-${Date.now()}-${Math.random()}`,
    ticketId,
    type: 'system_event',
    authorId: null,
    authorName: 'System',
    content,
    createdAt: new Date().toISOString(),
    attachments: [],
  })
}

const mockService = {
  getAll: async (
    filters: TicketFilters,
    sort: SortState,
    page: number,
    pageSize: number,
  ): Promise<{ data: Ticket[]; total: number }> => {
    await getMockDelay()
    let result = [..._mockTickets]

    if (filters.search) {
      const q = filters.search.toLowerCase()
      result = result.filter(
        (t) =>
          t.subject.toLowerCase().includes(q) ||
          t.customerName.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q),
      )
    }
    if (filters.statuses.length > 0) result = result.filter((t) => filters.statuses.includes(t.status))
    if (filters.priorities.length > 0) result = result.filter((t) => filters.priorities.includes(t.priority))
    if (filters.assignedUserIds.length > 0) {
      result = result.filter((t) => t.assignedUserId && filters.assignedUserIds.includes(t.assignedUserId))
    }
    if (filters.groupIds.length > 0) result = result.filter((t) => filters.groupIds.includes(t.groupId))
    if (filters.dateFrom) result = result.filter((t) => t.createdAt >= filters.dateFrom!)
    if (filters.dateTo) result = result.filter((t) => t.createdAt <= filters.dateTo!)
    if (filters.unassignedOnly) result = result.filter((t) => t.assignedUserId === null)
    if (filters.overdueOnly) result = result.filter((t) => t.slaBreached)
    if (filters.openOnly) result = result.filter((t) => !['resolved', 'closed'].includes(t.status))
    if (filters.transferredOnly) result = result.filter((t) => t.isTransferred)

    result.sort((a, b) => {
      const aVal = a[sort.field as keyof Ticket]
      const bVal = b[sort.field as keyof Ticket]
      const dir = sort.direction === 'asc' ? 1 : -1
      if (aVal == null) return dir
      if (bVal == null) return -dir
      return aVal < bVal ? -dir : aVal > bVal ? dir : 0
    })

    const total = result.length
    const data = result.slice((page - 1) * pageSize, page * pageSize)
    return { data, total }
  },

  getById: async (id: string): Promise<Ticket | null> => {
    await getMockDelay()
    return _mockTickets.find((t) => t.id === id) ?? null
  },

  getMessages: async (ticketId: string): Promise<TicketMessage[]> => {
    await getMockDelay()
    return _mockMessages
      .filter((m) => m.ticketId === ticketId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  },

  getTransferHistory: async (ticketId: string): Promise<TransferRecord[]> => {
    await getMockDelay()
    return _mockTransferRecords
      .filter((r) => r.ticketId === ticketId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },

  assign: async (ticketId: string, userId: string | null, userName: string | null, note?: string): Promise<Ticket> => {
    await getMockDelay()
    const ticket = _mockTickets.find((t) => t.id === ticketId)
    if (!ticket) throw new Error('Ticket not found')
    ticket.assignedUserId = userId
    ticket.assignedUserName = userName
    ticket.updatedAt = new Date().toISOString()
    ticket.lastActionAt = new Date().toISOString()
    ticket.lastActionSummary = userId ? `${userName} assigned` : 'Assignment removed'
    addSystemEvent(ticketId, userId ? `Ticket assigned to ${userName}.` : 'Ticket assignment removed.')
    if (note) {
      _mockMessages.push({
        id: `note-${Date.now()}`,
        ticketId,
        type: 'internal_note',
        authorId: null,
        authorName: 'System',
        content: note,
        createdAt: new Date().toISOString(),
        attachments: [],
      })
    }
    return { ...ticket }
  },

  changeStatus: async (ticketId: string, status: TicketStatus, reason?: string): Promise<Ticket> => {
    await getMockDelay()
    const ticket = _mockTickets.find((t) => t.id === ticketId)
    if (!ticket) throw new Error('Ticket not found')
    const prev = ticket.status
    ticket.status = status
    ticket.updatedAt = new Date().toISOString()
    ticket.lastActionAt = new Date().toISOString()
    ticket.lastActionSummary = `Status changed "${prev}" to "${status}"`
    addSystemEvent(ticketId, `Status updated "${prev}" to "${status}".${reason ? ` Reason: ${reason}` : ''}`)
    return { ...ticket }
  },

  changePriority: async (ticketId: string, priority: TicketPriority): Promise<Ticket> => {
    await getMockDelay()
    const ticket = _mockTickets.find((t) => t.id === ticketId)
    if (!ticket) throw new Error('Ticket not found')
    ticket.priority = priority
    ticket.updatedAt = new Date().toISOString()
    addSystemEvent(ticketId, `Priority updated to "${priority}".`)
    return { ...ticket }
  },

  addPublicReply: async (ticketId: string, content: string, authorId: string, authorName: string): Promise<TicketMessage> => {
    await getMockDelay()
    const ticket = _mockTickets.find((t) => t.id === ticketId)
    if (!ticket) throw new Error('Ticket not found')
    const msg: TicketMessage = {
      id: `msg-${Date.now()}`,
      ticketId,
      type: 'public_outbound',
      authorId,
      authorName,
      content,
      createdAt: new Date().toISOString(),
      attachments: [],
    }
    _mockMessages.push(msg)
    ticket.messageCount += 1
    ticket.updatedAt = new Date().toISOString()
    ticket.lastActionAt = new Date().toISOString()
    ticket.lastActionSummary = `${authorName} sent a reply`
    return msg
  },

  addInternalNote: async (ticketId: string, content: string, authorId: string, authorName: string): Promise<TicketMessage> => {
    await getMockDelay()
    const ticket = _mockTickets.find((t) => t.id === ticketId)
    if (!ticket) throw new Error('Ticket not found')
    const msg: TicketMessage = {
      id: `note-${Date.now()}`,
      ticketId,
      type: 'internal_note',
      authorId,
      authorName,
      content,
      createdAt: new Date().toISOString(),
      attachments: [],
    }
    _mockMessages.push(msg)
    ticket.internalNoteCount += 1
    ticket.updatedAt = new Date().toISOString()
    return msg
  },

  transfer: async (
    ticketId: string,
    toGroupId: string,
    toGroupName: string,
    fromGroupId: string,
    fromGroupName: string,
    byName: string,
    reason: string,
    note?: string,
  ): Promise<Ticket> => {
    await getMockDelay()
    const ticket = _mockTickets.find((t) => t.id === ticketId)
    if (!ticket) throw new Error('Ticket not found')
    const record: TransferRecord = {
      id: `tr-${Date.now()}`,
      ticketId,
      fromGroupId,
      fromGroupName,
      toGroupId,
      toGroupName,
      transferredByName: byName,
      reason,
      note: note ?? null,
      createdAt: new Date().toISOString(),
    }
    _mockTransferRecords.push(record)
    ticket.groupId = toGroupId
    ticket.groupName = toGroupName
    ticket.assignedUserId = null
    ticket.assignedUserName = null
    ticket.isTransferred = true
    ticket.transferredFromGroup = fromGroupName
    ticket.status = 'transferred'
    ticket.updatedAt = new Date().toISOString()
    ticket.lastActionAt = new Date().toISOString()
    ticket.lastActionSummary = `Transferred to ${toGroupName} team`
    addSystemEvent(ticketId, `Ticket transferred to ${toGroupName}. By: ${byName}. Reason: ${reason}`)
    return { ...ticket }
  },

  close: async (ticketId: string, sendNotification: boolean): Promise<Ticket> => {
    await getMockDelay()
    const ticket = _mockTickets.find((t) => t.id === ticketId)
    if (!ticket) throw new Error('Ticket not found')
    ticket.status = 'closed'
    ticket.updatedAt = new Date().toISOString()
    ticket.lastActionAt = new Date().toISOString()
    ticket.lastActionSummary = 'Ticket closed'
    addSystemEvent(ticketId, `Ticket closed.${sendNotification ? ' Customer notification email sent.' : ''}`)
    return { ...ticket }
  },

  reopen: async (ticketId: string): Promise<Ticket> => {
    await getMockDelay()
    const ticket = _mockTickets.find((t) => t.id === ticketId)
    if (!ticket) throw new Error('Ticket not found')
    ticket.status = 'open'
    ticket.updatedAt = new Date().toISOString()
    ticket.lastActionAt = new Date().toISOString()
    ticket.lastActionSummary = 'Ticket reopened'
    addSystemEvent(ticketId, 'Ticket reopened.')
    return { ...ticket }
  },
}

// ---------------------------------------------------------------------------
// Helpers: map backend DTOs → TicketMessage view model
// ---------------------------------------------------------------------------

function noteToMessage(n: NoteResponse): TicketMessage {
  // Map backend NoteType (INTERNAL/INFO/INVESTIGATION/ESCALATION) → FE MessageType
  const typeMap: Record<string, TicketMessage['type']> = {
    INTERNAL: 'internal_note',
    INFO: 'system_event',
    INVESTIGATION: 'internal_note',
    ESCALATION: 'internal_note',
  }
  return {
    id: n.id,
    ticketId: n.ticketId,
    type: typeMap[n.type] ?? 'internal_note',
    authorId: n.authorId,
    authorName: n.authorName,
    content: n.content,
    createdAt: n.createdAt,
    attachments: [],
  }
}

function emailToMessage(e: EmailDocumentResponse): TicketMessage {
  return {
    id: e.id,
    ticketId: e.ticketId,
    type: e.direction === 'INBOUND' ? 'public_inbound' : 'public_outbound',
    authorId: null,
    authorName: e.fromAddress ?? '',
    // content and attachments come from the detail endpoint; guard against absent summary fields
    content: e.content ?? '',
    createdAt: e.sentAt ?? e.receivedAt ?? new Date().toISOString(),
    attachments: (e.attachments ?? []).map((a) => a.filename),
  }
}

// ---------------------------------------------------------------------------
// Real API implementation — aligned to backend contract
// ---------------------------------------------------------------------------

const realService = {
  getAll: async (
    filters: TicketFilters,
    sort: SortState,
    page: number,
    pageSize: number,
  ): Promise<{ data: Ticket[]; total: number }> => {
    const params = new URLSearchParams()

    // Backend uses 0-indexed page numbers
    params.set('page', String(page - 1))
    params.set('size', String(pageSize))

    // Sort — backend accepts sort field name and direction
    if (sort.field) params.set('sort', sort.field)
    if (sort.direction) params.set('direction', sort.direction)

    // Scalar search
    if (filters.search) params.set('search', filters.search)

    // Array filters — send as repeated params (status=x&status=y)
    for (const s of filters.statuses) params.append('status', s)
    for (const p of filters.priorities) params.append('priority', p)
    for (const uid of filters.assignedUserIds) params.append('userId', uid)
    for (const gid of filters.groupIds) params.append('groupId', gid)

    // Date range
    if (filters.dateFrom) params.set('from', filters.dateFrom)
    if (filters.dateTo) params.set('to', filters.dateTo)

    // Boolean flags (unassignedOnly/overdueOnly/openOnly/transferredOnly) are not in
    // the backend contract — omitted in real mode.

    const res = await apiClient.get<PagedResponse<Record<string, unknown>> | Record<string, unknown>[]>(`/tickets?${params.toString()}`)

    // Normalize: backend returns PagedResponse { items, totalElements } or a flat array
    if (Array.isArray(res)) return { data: res.map(normalizeTicket), total: res.length }
    return { data: res.items.map(normalizeTicket), total: res.totalElements }
  },

  getById: async (id: string): Promise<Ticket> => {
    const raw = await apiClient.get<Record<string, unknown>>(`/tickets/${id}`)
    return normalizeTicket(raw)
  },

  /** GET /tickets/by-ticket-no/{ticketNo} — path param as per backend contract */
  getByTicketNo: async (ticketNo: string): Promise<Ticket> => {
    const raw = await apiClient.get<Record<string, unknown>>(`/tickets/by-ticket-no/${encodeURIComponent(ticketNo)}`)
    return normalizeTicket(raw)
  },

  create: async (data: { subject: string; customerId: string; groupId: string; priority: TicketPriority }): Promise<Ticket> => {
    const raw = await apiClient.post<Record<string, unknown>>('/tickets', data)
    return normalizeTicket(raw)
  },

  update: async (id: string, data: { subject?: string; priority?: TicketPriority; groupId?: string }): Promise<Ticket> => {
    const raw = await apiClient.put<Record<string, unknown>>(`/tickets/${id}`, data)
    return normalizeTicket(raw)
  },

  /**
   * Combines /notes/by-ticket + /emails/by-ticket into a unified TicketMessage view model.
   *
   * /emails/by-ticket returns EmailDocumentSummaryResponse[] — no content or attachments.
   * We batch-fetch full detail (GET /emails/{id}) so every message has a body before render.
   */
  getMessages: async (ticketId: string): Promise<TicketMessage[]> => {
    const [notes, emailSummaries] = await Promise.all([
      apiClient.get<NoteResponse[]>(`/notes/by-ticket/${ticketId}`),
      apiClient.get<EmailDocumentSummaryResponse[]>(`/emails/by-ticket/${ticketId}`),
    ])

    // Fetch full detail for each email to get content + attachments
    const emailDetails = await Promise.all(
      emailSummaries.map((s) => apiClient.get<EmailDocumentResponse>(`/emails/${s.id}`)),
    )

    return [
      ...notes.map(noteToMessage),
      ...emailDetails.map(emailToMessage),
    ].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  },

  getTransferHistory: async (ticketId: string): Promise<TransferRecord[]> => {
    const res = await apiClient.get<TransferResponse[]>(`/transfers/by-ticket/${ticketId}`)
    return res
      .map((t) => ({
        id: t.id,
        ticketId: t.ticketId,
        fromGroupId: t.fromGroupId,
        fromGroupName: t.fromGroupName,
        toGroupId: t.toGroupId,
        toGroupName: t.toGroupName,
        transferredByName: t.transferredByName,
        reason: t.reason,
        note: t.note,
        createdAt: t.createdAt,
      }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },

  /** Routes to /assignments/assign or /assignments/unassign, returns refreshed ticket */
  assign: async (
    ticketId: string,
    userId: string | null,
    _userName: string | null,
    note?: string,
  ): Promise<Ticket> => {
    if (userId === null) {
      await apiClient.post('/assignments/unassign', { ticketId })
    } else {
      await apiClient.post('/assignments/assign', { ticketId, assignedUserId: userId, note })
    }
    const raw = await apiClient.get<Record<string, unknown>>(`/tickets/${ticketId}`)
    return normalizeTicket(raw)
  },

  /** POST /tickets/{id}/status */
  changeStatus: async (ticketId: string, status: TicketStatus, reason?: string): Promise<Ticket> => {
    const raw = await apiClient.post<Record<string, unknown>>(`/tickets/${ticketId}/status`, { status, reason })
    return normalizeTicket(raw)
  },

  /** PUT /tickets/{id} with priority field */
  changePriority: async (ticketId: string, priority: TicketPriority): Promise<Ticket> => {
    const raw = await apiClient.put<Record<string, unknown>>(`/tickets/${ticketId}`, { priority })
    return normalizeTicket(raw)
  },

  /** POST /notes with type=INTERNAL — authorId is NOT sent (backend derives from session) */
  addInternalNote: async (
    ticketId: string,
    content: string,
    _authorId: string,
    _authorName: string,
  ): Promise<TicketMessage> => {
    const note = await apiClient.post<NoteResponse>('/notes', {
      ticketId,
      content,
      type: 'INTERNAL',
      // authorId intentionally omitted — backend derives author from session token
    })
    return noteToMessage(note)
  },

  /**
   * Public reply via email is NOT supported by the current backend (no POST /emails).
   * Deferred to V2. Throws a 501 so the caller can show a graceful error.
   */
  addPublicReply: async (
    _ticketId: string,
    _content: string,
    _authorId: string,
    _authorName: string,
  ): Promise<TicketMessage> => {
    throw new ApiError(
      501,
      'not_implemented',
      'Sending email replies is not supported in this backend version. Use mock mode for this feature.',
    )
  },

  /** POST /transfers then returns refreshed ticket */
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
      ticketId,
      fromGroupId,
      toGroupId,
      reason,
      clearAssignee: true,
    })
    const raw = await apiClient.get<Record<string, unknown>>(`/tickets/${ticketId}`)
    return normalizeTicket(raw)
  },

  /** POST /tickets/{id}/close */
  close: async (ticketId: string, sendNotification: boolean): Promise<Ticket> => {
    const raw = await apiClient.post<Record<string, unknown>>(`/tickets/${ticketId}/close`, { sendNotification })
    return normalizeTicket(raw)
  },

  /** POST /tickets/{id}/reopen */
  reopen: async (ticketId: string): Promise<Ticket> => {
    const raw = await apiClient.post<Record<string, unknown>>(`/tickets/${ticketId}/reopen`, {})
    return normalizeTicket(raw)
  },
}

// ---------------------------------------------------------------------------
// Export: route to mock or real depending on env flag
// ---------------------------------------------------------------------------
export const ticketService = USE_MOCKS ? mockService : realService
