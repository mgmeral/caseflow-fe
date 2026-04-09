import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useQueue, useQueueStats } from '@/hooks/useQueue'
import { useUsers } from '@/hooks/useUsers'
import { usePermissions } from '@/hooks/usePermissions'
import { assignmentService } from '@/services/assignment.service'
import { PoolTable } from '@/components/tickets/PoolTable'
import { AssignmentModal } from '@/components/modals/AssignmentModal'
import { EmptyState } from '@/components/shared/EmptyState'
import { ShieldOff, Inbox, AlertTriangle, Flame, Clock, Search } from 'lucide-react'
import { clsx } from 'clsx'
import type { Ticket, TicketPriority } from '@/types/ticket.types'
import type { SortState } from '@/types/common.types'

type PoolView = 'all' | 'high_priority' | 'sla_risk' | 'waiting_long'

export function AdminPoolPage() {
  const { canViewAdminPool } = usePermissions()
  const { users, groups } = useUsers()
  const queryClient = useQueryClient()

  const [poolView, setPoolView] = useState<PoolView>('all')
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | ''>('')
  const [groupFilter, setGroupFilter] = useState('')
  const [sort, setSort] = useState<SortState>({ field: 'updatedAt', direction: 'desc' })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  const [assignTarget, setAssignTarget] = useState<Ticket | null>(null)
  const [bulkAssignIds, setBulkAssignIds] = useState<string[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isAssigning, setIsAssigning] = useState(false)

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedSearch(searchInput), 300)
    return () => clearTimeout(timeoutId)
  }, [searchInput])

  const queueFilters = useMemo(
    () => ({ search: debouncedSearch, priority: priorityFilter, groupId: groupFilter || undefined }),
    [debouncedSearch, groupFilter, priorityFilter],
  )

  const { data, isLoading } = useQueue({
    ...queueFilters,
    sort,
    page,
    pageSize,
  })
  const queueStatsQuery = useQueueStats(queueFilters)

  const allPoolTickets = data?.tickets ?? []

  const poolCounts = useMemo(() => {
    const stats = queueStatsQuery.data
    return {
      total: stats?.allUnassigned ?? stats?.awaitingAssignment ?? 0,
      highPriority: stats?.highCritical,
      slaRisk: stats?.slaBreached,
      waitingLong: stats?.waitingOver8h,
    }
  }, [queueStatsQuery.data])

  const visibleTickets = useMemo(() => {
    switch (poolView) {
      case 'high_priority':
        return allPoolTickets.filter((ticket) => ticket.priority === 'critical' || ticket.priority === 'high')
      case 'sla_risk':
        return allPoolTickets.filter((ticket) => ticket.slaBreached)
      case 'waiting_long':
        return allPoolTickets.filter((ticket) => ticket.openDurationMinutes > 480)
      default:
        return allPoolTickets
    }
  }, [allPoolTickets, poolView])

  const handleAssign = useCallback(
    async (userId: string | null) => {
      if (!userId) return
      setIsAssigning(true)
      try {
        if (assignTarget) {
          await assignmentService.assign({ ticketId: assignTarget.id, assignedUserId: userId })
        } else if (bulkAssignIds.length > 0) {
          await Promise.all(
            bulkAssignIds.map((id) => assignmentService.assign({ ticketId: id, assignedUserId: userId })),
          )
        }
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['queue'], refetchType: 'all' }),
          queryClient.invalidateQueries({ queryKey: ['queue-stats'], refetchType: 'all' }),
          queryClient.invalidateQueries({ queryKey: ['tickets'], refetchType: 'all' }),
        ])
        setAssignTarget(null)
        setBulkAssignIds([])
        setSelectedIds([])
      } finally {
        setIsAssigning(false)
      }
    },
    [assignTarget, bulkAssignIds, queryClient],
  )

  if (!canViewAdminPool) {
    return (
      <div className="p-4">
        <EmptyState
          icon={<ShieldOff className="w-8 h-8 text-gray-400" />}
          title="Access Denied"
          description="You don't have permission to view the assignment queue."
        />
      </div>
    )
  }

  const viewTabs: Array<{ key: PoolView; label: string; count?: number; icon: typeof Inbox; color: string }> = [
    { key: 'all', label: 'All Unassigned', count: poolCounts.total, icon: Inbox, color: 'text-gray-500' },
    { key: 'high_priority', label: 'High / Critical', count: poolCounts.highPriority, icon: Flame, color: 'text-orange-500' },
    { key: 'sla_risk', label: 'SLA Breached', count: poolCounts.slaRisk, icon: AlertTriangle, color: 'text-red-500' },
    { key: 'waiting_long', label: 'Waiting > 8h', count: poolCounts.waitingLong, icon: Clock, color: 'text-amber-500' },
  ]

  const isAssignModalOpen = !!assignTarget || bulkAssignIds.length > 0
  const assignModalTicketNo = assignTarget ? assignTarget.ticketNo : `${bulkAssignIds.length} ticket${bulkAssignIds.length > 1 ? 's' : ''}`
  const hasActiveFilter = Boolean(searchInput || priorityFilter || groupFilter)

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Assignment Queue</h1>
          <p className="text-xs text-gray-500">Triage and assign queue-eligible tickets to agents.</p>
        </div>
        {!isLoading ? (
          <div className="text-right">
            <span className="text-2xl font-bold text-gray-900">{poolCounts.total}</span>
            <p className="text-[11px] text-gray-500">awaiting assignment</p>
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1 border border-gray-200">
        {viewTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => {
              setPoolView(tab.key)
              setPage(1)
            }}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
              poolView === tab.key
                ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                : 'text-gray-500 hover:text-gray-700 hover:bg-white/50',
            )}
          >
            <tab.icon className={clsx('w-3.5 h-3.5', poolView === tab.key ? tab.color : 'text-gray-400')} />
            {tab.label}
            {typeof tab.count === 'number' ? (
              <span
                className={clsx(
                  'text-[11px] px-1.5 rounded-full font-medium',
                  poolView === tab.key ? 'bg-gray-100 text-gray-700' : 'bg-gray-200/60 text-gray-400',
                  tab.key === 'sla_risk' && tab.count > 0 && 'bg-red-100 text-red-600',
                  tab.key === 'high_priority' && tab.count > 0 && poolView === tab.key && 'bg-orange-100 text-orange-600',
                )}
              >
                {tab.count}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
        <div className="relative">
          <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search queue…"
            value={searchInput}
            onChange={(event) => {
              setSearchInput(event.target.value)
              setPage(1)
            }}
            className="pl-7 pr-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-[200px]"
          />
        </div>

        <select
          value={priorityFilter}
          onChange={(event) => {
            setPriorityFilter(event.target.value as TicketPriority | '')
            setPage(1)
          }}
          className="px-2 py-1 text-xs border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <select
          value={groupFilter}
          onChange={(event) => {
            setGroupFilter(event.target.value)
            setPage(1)
          }}
          className="px-2 py-1 text-xs border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Groups</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>{group.name}</option>
          ))}
        </select>

        {hasActiveFilter ? (
          <button
            type="button"
            onClick={() => {
              setSearchInput('')
              setPriorityFilter('')
              setGroupFilter('')
              setPage(1)
            }}
            className="text-xs text-indigo-600 hover:text-indigo-800 underline ml-auto"
          >
            Clear
          </button>
        ) : null}
      </div>

      <PoolTable
        tickets={visibleTickets}
        total={poolView === 'all' ? (data?.total ?? 0) : visibleTickets.length}
        isLoading={isLoading}
        sort={sort}
        onSortChange={(nextSort) => {
          setSort(nextSort)
          setPage(1)
        }}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setPage(1)
        }}
        onAssign={(ticket) => setAssignTarget(ticket)}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onBulkAssign={() => setBulkAssignIds([...selectedIds])}
      />

      <AssignmentModal
        isOpen={isAssignModalOpen}
        onClose={() => {
          setAssignTarget(null)
          setBulkAssignIds([])
        }}
        ticketId={assignTarget?.id ?? ''}
        ticketNo={assignModalTicketNo}
        currentAssigneeId={null}
        currentAssigneeName={null}
        groups={groups}
        users={users}
        onAssign={handleAssign}
        isAssigning={isAssigning}
      />
    </div>
  )
}