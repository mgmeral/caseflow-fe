import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTickets } from '@/hooks/useTickets'
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

  /* ── Local state — fully decoupled from Tickets page ── */
  const [poolView, setPoolView] = useState<PoolView>('all')
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | ''>('')
  const [groupFilter, setGroupFilter] = useState('')
  const [sort, setSort] = useState<SortState>({ field: 'updatedAt', direction: 'desc' })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  /* ── Assignment state ── */
  const [assignTarget, setAssignTarget] = useState<Ticket | null>(null)
  const [bulkAssignIds, setBulkAssignIds] = useState<string[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isAssigning, setIsAssigning] = useState(false)

  /* ── Debounce search ── */
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput), 300)
    return () => clearTimeout(t)
  }, [searchInput])

  /* ── Data — always unassigned + open only ── */
  const { data, isLoading } = useTickets({
    filters: {
      search: debouncedSearch,
      statuses: [],
      priorities: priorityFilter ? [priorityFilter] : [],
      assignedUserIds: [],
      groupIds: groupFilter ? [groupFilter] : [],
      dateFrom: null,
      dateTo: null,
      unassignedOnly: true,
      overdueOnly: false,
      openOnly: true,
      transferredOnly: false,
    },
    sort,
    page,
    pageSize,
  })

  const allPoolTickets = data?.tickets ?? []

  /* ── Quick-triage counts ── */
  const poolCounts = useMemo(() => {
    const highPriority = allPoolTickets.filter((t) => t.priority === 'critical' || t.priority === 'high').length
    const slaRisk = allPoolTickets.filter((t) => t.slaBreached).length
    const waitingLong = allPoolTickets.filter((t) => t.openDurationMinutes > 480).length
    return { total: allPoolTickets.length, highPriority, slaRisk, waitingLong }
  }, [allPoolTickets])

  /* ── Client-side triage filtering ── */
  const visibleTickets = useMemo(() => {
    switch (poolView) {
      case 'high_priority':
        return allPoolTickets.filter((t) => t.priority === 'critical' || t.priority === 'high')
      case 'sla_risk':
        return allPoolTickets.filter((t) => t.slaBreached)
      case 'waiting_long':
        return allPoolTickets.filter((t) => t.openDurationMinutes > 480)
      default:
        return allPoolTickets
    }
  }, [allPoolTickets, poolView])

  /* ── Assign handler (single + bulk) ── */
  const handleAssign = useCallback(
    async (userId: string | null) => {
      if (!userId) return
      setIsAssigning(true)
      try {
        if (assignTarget) {
          await assignmentService.assign({ ticketId: assignTarget.id, assignedUserId: userId })
        } else if (bulkAssignIds.length > 0) {
          await Promise.all(
            bulkAssignIds.map((id) =>
              assignmentService.assign({ ticketId: id, assignedUserId: userId }),
            ),
          )
        }
        queryClient.invalidateQueries({ queryKey: ['tickets'] })
        setAssignTarget(null)
        setBulkAssignIds([])
        setSelectedIds([])
      } finally {
        setIsAssigning(false)
      }
    },
    [assignTarget, bulkAssignIds, queryClient],
  )

  /* ── Permission gate ── */
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

  const VIEW_TABS: Array<{ key: PoolView; label: string; count: number; icon: typeof Inbox; color: string }> = [
    { key: 'all', label: 'All Unassigned', count: poolCounts.total, icon: Inbox, color: 'text-gray-500' },
    { key: 'high_priority', label: 'High / Critical', count: poolCounts.highPriority, icon: Flame, color: 'text-orange-500' },
    { key: 'sla_risk', label: 'SLA Breached', count: poolCounts.slaRisk, icon: AlertTriangle, color: 'text-red-500' },
    { key: 'waiting_long', label: 'Waiting > 8h', count: poolCounts.waitingLong, icon: Clock, color: 'text-amber-500' },
  ]

  const isAssignModalOpen = !!assignTarget || bulkAssignIds.length > 0
  const assignModalTicketNo = assignTarget
    ? assignTarget.ticketNo
    : `${bulkAssignIds.length} ticket${bulkAssignIds.length > 1 ? 's' : ''}`

  const hasActiveFilter = searchInput || priorityFilter || groupFilter

  return (
    <div className="p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Assignment Queue</h1>
          <p className="text-xs text-gray-500">Triage and assign unassigned tickets to agents.</p>
        </div>
        {!isLoading && (
          <div className="text-right">
            <span className="text-2xl font-bold text-gray-900">{poolCounts.total}</span>
            <p className="text-[11px] text-gray-500">awaiting assignment</p>
          </div>
        )}
      </div>

      {/* Quick triage tabs */}
      <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1 border border-gray-200">
        {VIEW_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => { setPoolView(tab.key); setPage(1) }}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
              poolView === tab.key
                ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                : 'text-gray-500 hover:text-gray-700 hover:bg-white/50',
            )}
          >
            <tab.icon className={clsx('w-3.5 h-3.5', poolView === tab.key ? tab.color : 'text-gray-400')} />
            {tab.label}
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
          </button>
        ))}
      </div>

      {/* Simplified filter bar — no Assignee, no Unassigned toggle */}
      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
        <div className="relative">
          <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search queue…"
            value={searchInput}
            onChange={(e) => { setSearchInput(e.target.value); setPage(1) }}
            className="pl-7 pr-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-[200px]"
          />
        </div>

        <select
          value={priorityFilter}
          onChange={(e) => { setPriorityFilter(e.target.value as TicketPriority | ''); setPage(1) }}
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
          onChange={(e) => { setGroupFilter(e.target.value); setPage(1) }}
          className="px-2 py-1 text-xs border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Groups</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>

        {hasActiveFilter && (
          <button
            type="button"
            onClick={() => { setSearchInput(''); setPriorityFilter(''); setGroupFilter(''); setPage(1) }}
            className="text-xs text-indigo-600 hover:text-indigo-800 underline ml-auto"
          >
            Clear
          </button>
        )}
      </div>

      {/* Pool table */}
      <PoolTable
        tickets={visibleTickets}
        total={poolView === 'all' ? (data?.total ?? 0) : visibleTickets.length}
        isLoading={isLoading}
        sort={sort}
        onSortChange={(s) => { setSort(s); setPage(1) }}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
        onAssign={(ticket) => setAssignTarget(ticket)}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onBulkAssign={() => setBulkAssignIds([...selectedIds])}
      />

      {/* Assignment modal — reused for single + bulk */}
      <AssignmentModal
        isOpen={isAssignModalOpen}
        onClose={() => { setAssignTarget(null); setBulkAssignIds([]) }}
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
