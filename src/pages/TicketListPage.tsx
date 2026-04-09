import { useCallback, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useFilterStore } from '@/store/filter.store'
import { useTickets } from '@/hooks/useTickets'
import { useUsers } from '@/hooks/useUsers'
import { TicketFilters } from '@/components/tickets/TicketFilters'
import { TicketTable } from '@/components/tickets/TicketTable'

type DashboardFilterPreset = 'active' | 'unassigned' | 'waiting' | 'resolved'

function getDashboardPresetFilters(filter: DashboardFilterPreset) {
  switch (filter) {
    case 'active':
      return { openOnly: true }
    case 'unassigned':
      return { openOnly: true, unassignedOnly: true }
    case 'waiting':
      return { statuses: ['WAITING_CUSTOMER'] }
    case 'resolved':
      return { statuses: ['RESOLVED'] }
  }
}

export function TicketListPage() {
  const [searchParams] = useSearchParams()
  const { filters, sort, page, pageSize, setFilters, setSort, setPage, setPageSize, resetFilters } =
    useFilterStore()

  useEffect(() => {
    const dashboardFilter = searchParams.get('dashboardFilter')
    resetFilters()

    if (
      dashboardFilter === 'active'
      || dashboardFilter === 'unassigned'
      || dashboardFilter === 'waiting'
      || dashboardFilter === 'resolved'
    ) {
      setFilters(getDashboardPresetFilters(dashboardFilter))
    }
  }, [resetFilters, searchParams, setFilters])

  const handleFilterChange = useCallback(
    (partial: Parameters<typeof setFilters>[0]) => {
      setFilters(partial)
    },
    [setFilters],
  )

  const { data, isLoading } = useTickets({ filters, sort, page, pageSize })
  const { users, groups } = useUsers()

  return (
    <div className="p-4 space-y-3">
      <h1 className="text-lg font-bold text-gray-900">Tickets</h1>

      <TicketFilters
        filters={filters}
        onChange={handleFilterChange}
        groups={groups}
        users={users}
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
