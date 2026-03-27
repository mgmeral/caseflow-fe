import type { Ticket, TicketFilters, TicketMessage, TicketStatus, TicketPriority, TransferRecord } from '@/types/ticket.types'
import type { SortState } from '@/types/common.types'
import { apiClient } from './api.client'
import { USE_MOCKS } from '@/lib/env'
import { mockTickets, mockMessages, mockTransferRecords, getMockDelay } from '@/mock'

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
// Real API implementation
// ---------------------------------------------------------------------------

interface TicketListResponse {
  data: Ticket[]
  total: number
  page: number
  pageSize: number
}

const realService = {
  getAll: async (
    filters: TicketFilters,
    sort: SortState,
    page: number,
    pageSize: number,
  ): Promise<{ data: Ticket[]; total: number }> => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      sortField: sort.field,
      sortDir: sort.direction,
    })
    if (filters.search) params.set('search', filters.search)
    if (filters.statuses.length) params.set('statuses', filters.statuses.join(','))
    if (filters.priorities.length) params.set('priorities', filters.priorities.join(','))
    if (filters.assignedUserIds.length) params.set('assignedUserIds', filters.assignedUserIds.join(','))
    if (filters.groupIds.length) params.set('groupIds', filters.groupIds.join(','))
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
    if (filters.dateTo) params.set('dateTo', filters.dateTo)
    if (filters.unassignedOnly) params.set('unassignedOnly', 'true')
    if (filters.overdueOnly) params.set('overdueOnly', 'true')
    if (filters.openOnly) params.set('openOnly', 'true')
    if (filters.transferredOnly) params.set('transferredOnly', 'true')

    const res = await apiClient.get<TicketListResponse>(`/tickets?${params.toString()}`)
    return { data: res.data, total: res.total }
  },

  getById: (id: string) => apiClient.get<Ticket | null>(`/tickets/${id}`),

  getMessages: (ticketId: string) =>
    apiClient.get<TicketMessage[]>(`/tickets/${ticketId}/messages`),

  getTransferHistory: (ticketId: string) =>
    apiClient.get<TransferRecord[]>(`/tickets/${ticketId}/transfers`),

  assign: (ticketId: string, userId: string | null, userName: string | null, note?: string) =>
    apiClient.post<Ticket>(`/tickets/${ticketId}/assign`, { userId, userName, note }),

  changeStatus: (ticketId: string, status: TicketStatus, reason?: string) =>
    apiClient.post<Ticket>(`/tickets/${ticketId}/status`, { status, reason }),

  changePriority: (ticketId: string, priority: TicketPriority) =>
    apiClient.post<Ticket>(`/tickets/${ticketId}/priority`, { priority }),

  addPublicReply: (ticketId: string, content: string, authorId: string, authorName: string) =>
    apiClient.post<TicketMessage>(`/tickets/${ticketId}/messages`, {
      type: 'public_outbound',
      content,
      authorId,
      authorName,
    }),

  addInternalNote: (ticketId: string, content: string, authorId: string, authorName: string) =>
    apiClient.post<TicketMessage>(`/tickets/${ticketId}/messages`, {
      type: 'internal_note',
      content,
      authorId,
      authorName,
    }),

  transfer: (
    ticketId: string,
    toGroupId: string,
    toGroupName: string,
    fromGroupId: string,
    fromGroupName: string,
    byName: string,
    reason: string,
    note?: string,
  ) =>
    apiClient.post<Ticket>(`/tickets/${ticketId}/transfer`, {
      toGroupId,
      toGroupName,
      fromGroupId,
      fromGroupName,
      byName,
      reason,
      note,
    }),

  close: (ticketId: string, sendNotification: boolean) =>
    apiClient.post<Ticket>(`/tickets/${ticketId}/close`, { sendNotification }),

  reopen: (ticketId: string) =>
    apiClient.post<Ticket>(`/tickets/${ticketId}/reopen`, {}),
}

// ---------------------------------------------------------------------------
// Export: route to mock or real depending on env flag
// ---------------------------------------------------------------------------
export const ticketService = USE_MOCKS ? mockService : realService
