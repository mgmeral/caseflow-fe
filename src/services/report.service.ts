import type { AdminCustomerTicketAggregateItemResponse, CustomerTicketReportResponse } from '@/types/api.types'
import type { AdminCustomerTicketAggregateReport, CustomerTicketReport } from '@/types/ticket.types'
import { apiClient } from './api.client'
import { normalizeAdminCustomerTicketAggregateReport, normalizeCustomerTicketReport } from './email-platform.normalizers'

interface ReportDateFilters {
  dateFrom?: string | null
  dateTo?: string | null
}

function toApiDateTime(value: string, boundary: 'start' | 'end') {
  return boundary === 'start' ? `${value}T00:00:00.000Z` : `${value}T23:59:59.999Z`
}

function buildCustomerReportPath(customerId: string, filters?: ReportDateFilters) {
  const query = new URLSearchParams()

  if (filters?.dateFrom) {
    query.set('from', toApiDateTime(filters.dateFrom, 'start'))
  }
  if (filters?.dateTo) {
    query.set('to', toApiDateTime(filters.dateTo, 'end'))
  }

  const basePath = `/customers/${customerId}/reports/tickets`
  const queryString = query.toString()
  return queryString ? `${basePath}?${queryString}` : basePath
}

function buildAggregateReportPath(page: number, size: number, filters?: ReportDateFilters) {
  const query = new URLSearchParams({
    page: String(page),
    size: String(size),
  })

  if (filters?.dateFrom) {
    query.set('from', toApiDateTime(filters.dateFrom, 'start'))
  }
  if (filters?.dateTo) {
    query.set('to', toApiDateTime(filters.dateTo, 'end'))
  }

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