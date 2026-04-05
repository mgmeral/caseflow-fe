import { useQuery } from '@tanstack/react-query'
import { reportService } from '@/services/report.service'

interface ReportDateFilters {
  from?: string | null
  to?: string | null
}

export function useCustomerReport(customerId: string, filters?: ReportDateFilters) {
  return useQuery({
    queryKey: ['customer-report', customerId, filters?.from ?? null, filters?.to ?? null],
    queryFn: () => reportService.getCustomerReport(customerId, filters),
    enabled: !!customerId,
    staleTime: 30_000,
  })
}

export function useAdminAggregateReport(page = 0, size = 20, filters?: ReportDateFilters) {
  return useQuery({
    queryKey: ['admin-customer-aggregate-report', page, size, filters?.from ?? null, filters?.to ?? null],
    queryFn: () => reportService.getAdminAggregateReport(page, size, filters),
    staleTime: 30_000,
  })
}