import { useQuery } from '@tanstack/react-query'
import type { SortState } from '@/types/common.types'
import type { TicketPriority } from '@/types/ticket.types'
import { queueService } from '@/services/queue.service'

interface UseQueueOptions {
  search?: string
  priority?: TicketPriority | ''
  groupId?: string
  sort: SortState
  page: number
  pageSize: number
}

export function useQueue(options: UseQueueOptions) {
  const filters = {
    search: options.search,
    priority: options.priority,
    groupId: options.groupId,
  }

  const query = useQuery({
    queryKey: ['queue', filters, options.sort, options.page, options.pageSize],
    queryFn: () => queueService.getQueue(filters, options.sort, options.page, options.pageSize),
    staleTime: 15_000,
  })

  return {
    data: query.data ? { tickets: query.data.data, total: query.data.total } : undefined,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}

export function useQueueStats(filters: { search?: string; priority?: TicketPriority | ''; groupId?: string }) {
  return useQuery({
    queryKey: ['queue-stats', filters],
    queryFn: () => queueService.getStats(filters),
    staleTime: 15_000,
  })
}
