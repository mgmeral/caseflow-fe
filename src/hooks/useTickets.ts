import { useQuery } from '@tanstack/react-query'
import { ticketService } from '@/services/ticket.service'
import { useFilterStore } from '@/store/filter.store'
import type { TicketFilters } from '@/types/ticket.types'
import type { SortState } from '@/types/common.types'

interface UseTicketsOptions {
  filters?: Partial<TicketFilters>
  sort?: SortState
  page?: number
  pageSize?: number
}

export function useTickets(options?: UseTicketsOptions) {
  const store = useFilterStore()

  const storeFilters = store.filters
  const filters: TicketFilters = { ...storeFilters, ...(options?.filters ?? {}) }
  const sort = options?.sort ?? store.sort
  const page = options?.page ?? store.page
  const pageSize = options?.pageSize ?? store.pageSize

  const query = useQuery({
    queryKey: ['tickets', filters, sort, page, pageSize],
    queryFn: () => ticketService.getAll(filters, sort, page, pageSize),
    staleTime: 30_000,
  })

  return {
    data: query.data ? { tickets: query.data.data, total: query.data.total } : undefined,
    tickets: query.data?.data ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}
