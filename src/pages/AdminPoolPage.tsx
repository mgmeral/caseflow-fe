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
          if (assignTarget.assignedUserId) {
            await assignmentService.reassign({
              ticketId: assignTarget.id,
              newUserId: userId,
              ...(assignTarget.groupId ? { newGroupId: assignTarget.groupId } : {}),
            })
          } else {
            await assignmentService.assign({ ticketId: assignTarget.id, assignedUserId: userId })
          }
        } else if (bulkAssignIds.length > 0) {
          await Promise.all(
            bulkAssignIds.map((id) => {
              const ticket = allPoolTickets.find((item) => item.id === id)
              if (ticket?.assignedUserId) {
                return assignmentService.reassign({
                  ticketId: id,
                  newUserId: userId,
                  ...(ticket.groupId ? { newGroupId: ticket.groupId } : {}),
                })
              }

              return assignmentService.assign({ ticketId: id, assignedUserId: userId })
            }),
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
    [allPoolTickets, assignTarget, bulkAssignIds, queryClient],
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
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1 className="page-title">Assignment Queue</h1>
          <p className="page-subtitle">Triage queue-eligible tickets, assign faster, and keep priority work visible.</p>
        </div>
        {!isLoading ? (
          <div className="text-right">
            <span className="text-[1.9rem] font-semibold tracking-[-0.04em] text-slate-950">{poolCounts.total}</span>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">awaiting assignment</p>
          </div>
        ) : null}
      </div>

      <div className="surface-card flex flex-wrap items-center gap-1.5 p-1.5">
        {viewTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => {
              setPoolView(tab.key)
              setPage(1)
            }}
            className={clsx(
              'flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-semibold tracking-[-0.01em] transition-all duration-200',
              poolView === tab.key
                ? 'border border-[#c6d8ff] bg-[linear-gradient(180deg,#ffffff_0%,#edf4ff_100%)] text-slate-950 shadow-soft'
                : 'text-slate-500 hover:bg-white/60 hover:text-slate-800',
            )}
          >
            <tab.icon className={clsx('w-3.5 h-3.5', poolView === tab.key ? tab.color : 'text-gray-400')} />
            {tab.label}
            {typeof tab.count === 'number' ? (
              <span
                className={clsx(
                  'text-[11px] px-1.5 rounded-full font-medium',
                  poolView === tab.key ? 'bg-slate-100 text-slate-700' : 'bg-slate-200/60 text-slate-400',
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

      <div className="surface-card flex flex-wrap items-center gap-2.5 px-4 py-4">
        <div className="relative min-w-[240px] flex-1 max-w-[320px]">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search queue…"
            value={searchInput}
            onChange={(event) => {
              setSearchInput(event.target.value)
              setPage(1)
            }}
            className="ui-input ui-input-with-icon"
          />
        </div>

        <select
          value={priorityFilter}
          onChange={(event) => {
            setPriorityFilter(event.target.value as TicketPriority | '')
            setPage(1)
          }}
          className="ui-select ui-field-inline px-3 text-[13px]"
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
          className="ui-select ui-field-inline px-3 text-[13px]"
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
            className="ml-auto text-xs font-medium text-indigo-600 hover:text-indigo-800"
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