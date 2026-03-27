import { useTickets } from '@/hooks/useTickets'
import { useFilterStore } from '@/store/filter.store'
import { useUsers } from '@/hooks/useUsers'
import { TicketTable } from '@/components/tickets/TicketTable'
import { TicketFilters } from '@/components/tickets/TicketFilters'
import { usePermissions } from '@/hooks/usePermissions'
import { EmptyState } from '@/components/shared/EmptyState'
import { ShieldOff } from 'lucide-react'

export function AdminPoolPage() {
  const { canViewAdminPool } = usePermissions()
  const { filters, sort, page, pageSize, setFilters, setSort, setPage, setPageSize } =
    useFilterStore()
  const { users, groups } = useUsers()

  // Pool: unassigned tickets only
  const { data, isLoading } = useTickets({
    filters: { ...filters, unassignedOnly: true },
    sort,
    page,
    pageSize,
  })

  if (!canViewAdminPool) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<ShieldOff className="w-8 h-8 text-gray-400" />}
          title="Access Denied"
          description="You don't have permission to view the admin pool."
        />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Admin Pool</h1>
        <p className="text-sm text-gray-500 mt-0.5">Unassigned tickets waiting for assignment.</p>
      </div>

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
