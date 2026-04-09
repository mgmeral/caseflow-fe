import type { SortState } from '@/types/common.types'

export const DEFAULT_TICKET_SORT: SortState = { field: 'updatedAt', direction: 'desc' }
export const SUPPORTED_TICKET_SORT_FIELDS = ['updatedAt', 'status', 'priority'] as const
export const SUPPORTED_QUEUE_SORT_FIELDS = ['updatedAt', 'status', 'priority'] as const

export function isSupportedTicketSortField(field: string): boolean {
  return (SUPPORTED_TICKET_SORT_FIELDS as readonly string[]).includes(field)
}

export function isSupportedQueueSortField(field: string): boolean {
  return (SUPPORTED_QUEUE_SORT_FIELDS as readonly string[]).includes(field)
}
