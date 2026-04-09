import { useCallback, useEffect } from 'react'
import { useFilterStore } from '@/store/filter.store'
import { useTickets } from '@/hooks/useTickets'
import { useUsers } from '@/hooks/useUsers'
import { TicketFilters } from '@/components/tickets/TicketFilters'
import { TicketTable } from '@/components/tickets/TicketTable'

export function TicketListPage() {
  const { filters, sort, page, pageSize, setFilters, setSort, setPage, setPageSize, resetFilters } =
    useFilterStore()

  // Reset filters on page entry — clean slate each visit
  useEffect(() => {
    resetFilters()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
