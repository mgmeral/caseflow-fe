import type { AdminCustomerTicketAggregateItemResponse, CustomerTicketReportResponse } from '@/types/api.types'
import type { AdminCustomerTicketAggregateReport, CustomerTicketReport } from '@/types/ticket.types'
import { apiClient } from './api.client'
import { normalizeAdminCustomerTicketAggregateReport, normalizeCustomerTicketReport } from './email-platform.normalizers'

interface ReportDateFilters {
  from?: string | null
  to?: string | null
}

function buildCustomerReportPath(customerId: string, filters?: ReportDateFilters) {
  const query = new URLSearchParams()

  if (filters?.from) query.set('from', filters.from)
  if (filters?.to) query.set('to', filters.to)

  const basePath = `/customers/${customerId}/reports/tickets`
  const queryString = query.toString()
  return queryString ? `${basePath}?${queryString}` : basePath
}

function buildAggregateReportPath(page: number, size: number, filters?: ReportDateFilters) {
  const query = new URLSearchParams({
    page: String(page),
    size: String(size),
  })

  if (filters?.from) query.set('from', filters.from)
  if (filters?.to) query.set('to', filters.to)

  return `/admin/reports/customers/tickets?${query.toString()}`
}

export const reportService = {
  getCustomerReport: async (customerId: string, filters?: ReportDateFilters): Promise<CustomerTicketReport> => {
    const response = await apiClient.get<CustomerTicketReportResponse>(buildCustomerReportPath(customerId, filters))
    return normalizeCustomerTicketReport(response)
  },

  getAdminAggregateReport: async (page = 0, size = 20, filters?: ReportDateFilters): Promise<AdminCustomerTicketAggregateReport> => {
    const response = await apiClient.get<{
      items: AdminCustomerTicketAggregateItemResponse[]
      page: number
      size: number
      totalElements: number
      totalPages: number
    }>(buildAggregateReportPath(page, size, filters))
    return normalizeAdminCustomerTicketAggregateReport(response)
  },
}