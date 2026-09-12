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
  /** Only populated when backend returns these fields */
  slaBreached: number
  atRisk: number
  /** True when backend sent slaBreached/atRisk fields (even if 0) */
  slaDataAvailable: boolean
}

function toNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function normalizeDashboardStats(response: DashboardStatsResponse): DashboardStats {
  // Accept both legacy slaBreached and canonical breachedSlaCount
  const slaBreachedRaw = response.breachedSlaCount ?? response.slaBreached ?? null
  const atRiskRaw = response.atRiskSlaCount ?? response.atRisk ?? null
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
    slaBreached: toNumber(slaBreachedRaw),
    atRisk: toNumber(atRiskRaw),
    slaDataAvailable: slaBreachedRaw != null || atRiskRaw != null,
  }
}

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get<DashboardStatsResponse>('/dashboard/stats')
    return normalizeDashboardStats(response)
  },
}
