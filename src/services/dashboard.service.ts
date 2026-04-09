import type { DashboardStatsResponse } from '@/types/api.types'
import type { Ticket } from '@/types/ticket.types'
import { apiClient } from './api.client'
import { normalizeTicket } from './normalizers'

export interface DashboardStats {
  totalTickets: number
  activeTickets: number
  resolvedTickets: number
  closedTickets: number
  unassignedTickets: number
  waitingOver24h: number
  myActionRequired: number
  myActionRequiredItems: Ticket[]
}

function toNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function normalizeDashboardStats(response: DashboardStatsResponse): DashboardStats {
  return {
    totalTickets: toNumber(response.totalTickets),
    activeTickets: toNumber(response.activeTickets),
    resolvedTickets: toNumber(response.resolvedTickets),
    closedTickets: toNumber(response.closedTickets),
    unassignedTickets: toNumber(response.unassignedTickets),
    waitingOver24h: toNumber(response.waitingOver24h),
    myActionRequired: toNumber(response.myActionRequired),
    myActionRequiredItems: Array.isArray(response.myActionRequiredItems)
      ? response.myActionRequiredItems.map((item) => normalizeTicket(item))
      : [],
  }
}

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get<DashboardStatsResponse>('/dashboard/stats')
    return normalizeDashboardStats(response)
  },
}
