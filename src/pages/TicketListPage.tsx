import { useCallback, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { defaultFilters, useFilterStore } from '@/store/filter.store'
import { useTickets } from '@/hooks/useTickets'
import { useUsers } from '@/hooks/useUsers'
import { useAllTags } from '@/hooks/useTags'
import { TicketFilters } from '@/components/tickets/TicketFilters'
import { TicketTable } from '@/components/tickets/TicketTable'
import type { TicketFilters as TicketFiltersState } from '@/types/ticket.types'

type DashboardFilterPreset = 'active' | 'unassigned' | 'waiting' | 'resolved' | 'closed'

function getDashboardPresetFilters(filter: DashboardFilterPreset): Partial<TicketFiltersState> {
  switch (filter) {
    case 'active':
      return { openOnly: true }
    case 'unassigned':
      return { openOnly: true, unassignedOnly: true }
    case 'waiting':
      return { statuses: ['WAITING_CUSTOMER'] }
    case 'resolved':
      return { statuses: ['RESOLVED'] }
    case 'closed':
      return { statuses: ['CLOSED'] }
  }
}

export function TicketListPage() {
  const [searchParams] = useSearchParams()
  const dashboardFilter = searchParams.get('dashboardFilter')
  const { filters, sort, page, pageSize, setFilters, replaceFilters, setSort, setPage, setPageSize } =
    useFilterStore()
  const tagsQuery = useAllTags()

  useEffect(() => {
    if (
      dashboardFilter === 'active'
      || dashboardFilter === 'unassigned'
      || dashboardFilter === 'waiting'
      || dashboardFilter === 'resolved'
      || dashboardFilter === 'closed'
    ) {
      replaceFilters({
        ...defaultFilters,
        ...getDashboardPresetFilters(dashboardFilter),
      })
    }
  }, [dashboardFilter, replaceFilters])

  const handleFilterChange = useCallback(
    (partial: Parameters<typeof setFilters>[0]) => {
      setFilters(partial)
    },
    [setFilters],
  )

  const { data, isLoading } = useTickets({ filters, sort, page, pageSize })
  const { users, groups } = useUsers()

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tickets</h1>
          <p className="page-subtitle">Operational queue with layered filters, ownership context, and recent activity visibility.</p>
        </div>
      </div>

      <TicketFilters
        filters={filters}
        onChange={handleFilterChange}
        groups={groups}
        users={users}
        tags={tagsQuery.data ?? []}
        isTagsLoading={tagsQuery.isLoading}
        tagsUnavailable={tagsQuery.isError}
      />

      <TicketTable
        tickets={data?.tickets ?? []}
        total={data?.total ?? 0}
        isLoading={isLoading}
        sort={sort}
        page={page}
        pageSize={pageSize}
        onSortChange={setSort}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  )
}
