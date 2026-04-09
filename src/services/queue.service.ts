import type { PagedResponse, QueueStatsResponse } from '@/types/api.types'
import type { SortState } from '@/types/common.types'
import type { Ticket, TicketPriority } from '@/types/ticket.types'
import { apiClient } from './api.client'
import { normalizeTicket } from './normalizers'
import { DEFAULT_TICKET_SORT, isSupportedQueueSortField } from '@/lib/ticketQueryContracts'

export interface QueueFilters {
  search?: string
  priority?: TicketPriority | ''
  groupId?: string
}

export interface QueueStats {
  awaitingAssignment: number
  allUnassigned: number
  highCritical?: number
  waitingOver8h?: number
  slaBreached?: number
}

function toNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function buildQueueParams(filters: QueueFilters, sort: SortState, page: number, pageSize: number) {
  const params = new URLSearchParams()
  const safeSortField = isSupportedQueueSortField(sort.field) ? sort.field : DEFAULT_TICKET_SORT.field
  params.set('page', String(page - 1))
  params.set('size', String(pageSize))
  if (safeSortField) params.set('sort', safeSortField)
  if (sort.direction) params.set('direction', sort.direction)
  if (filters.search) params.set('search', filters.search)
  if (filters.priority) params.set('priority', String(filters.priority).toUpperCase())
  if (filters.groupId) params.set('groupId', filters.groupId)
  return params
}

export const queueService = {
  getQueue: async (filters: QueueFilters, sort: SortState, page: number, pageSize: number): Promise<{ data: Ticket[]; total: number }> => {
    const params = buildQueueParams(filters, sort, page, pageSize)
    const response = await apiClient.get<PagedResponse<Record<string, unknown>> | Record<string, unknown>[]>(`/queue?${params.toString()}`)
    if (Array.isArray(response)) return { data: response.map(normalizeTicket), total: response.length }
    return { data: response.items.map(normalizeTicket), total: response.totalElements }
  },

  getStats: async (filters: QueueFilters): Promise<QueueStats> => {
    const params = new URLSearchParams()
    if (filters.search) params.set('search', filters.search)
    if (filters.priority) params.set('priority', String(filters.priority).toUpperCase())
    if (filters.groupId) params.set('groupId', filters.groupId)
    const response = await apiClient.get<QueueStatsResponse>(`/queue/stats${params.toString() ? `?${params.toString()}` : ''}`)
    return {
      awaitingAssignment: toNumber(response.awaitingAssignment) ?? toNumber(response.allUnassigned) ?? 0,
      allUnassigned: toNumber(response.allUnassigned) ?? toNumber(response.awaitingAssignment) ?? 0,
      highCritical: toNumber(response.highCritical),
      waitingOver8h: toNumber(response.waitingOver8h),
      slaBreached: toNumber(response.slaBreached),
    }
  },
}
