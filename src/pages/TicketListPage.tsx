import { useFilterStore } from '@/store/filter.store'
import { useTickets } from '@/hooks/useTickets'
import { useUsers } from '@/hooks/useUsers'
import { TicketFilters } from '@/components/tickets/TicketFilters'
import { TicketTable } from '@/components/tickets/TicketTable'

export function TicketListPage() {
  const { filters, sort, page, pageSize, setFilters, setSort, setPage, setPageSize } =
    useFilterStore()

  const { data, isLoading } = useTickets({ filters, sort, page, pageSize })
  const { users, groups } = useUsers()

  return (
    <div className="p-4 space-y-3">
      <h1 className="text-lg font-bold text-gray-900">Tickets</h1>

      <TicketFilters
        filters={filters}
        onChange={(partial) => setFilters({ ...filters, ...partial })}
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
