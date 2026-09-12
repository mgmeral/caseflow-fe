import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { defaultFilters, useFilterStore } from '@/store/filter.store'
import { useTickets } from '@/hooks/useTickets'
import { useUsers } from '@/hooks/useUsers'
import { useActiveTags } from '@/hooks/useTags'
import { useAllTags } from '@/hooks/useTags'
import { useToast } from '@/hooks/useToast'
import { TicketFilters } from '@/components/tickets/TicketFilters'
import { TicketTable } from '@/components/tickets/TicketTable'
import { AssignmentModal } from '@/components/modals/AssignmentModal'
import { Modal } from '@/components/shared/Modal'
import { Button } from '@/components/shared/Button'
import { getErrorMessage } from '@/lib/errors'
import { assignmentService } from '@/services/assignment.service'
import { ticketService } from '@/services/ticket.service'
import { tagService } from '@/services/tag.service'
import type { TicketFilters as TicketFiltersState, TicketStatus } from '@/types/ticket.types'
import { TICKET_STATUS_LABELS } from '@/constants/enums'

type DashboardFilterPreset = 'active' | 'unassigned' | 'waiting' | 'resolved' | 'closed' | 'staleOpen24h' | 'slaBreached' | 'slaAtRisk'

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
    case 'staleOpen24h':
      // overdueOnly=true — backend predicate for tickets open > 24 h
      return { openOnly: true, overdueOnly: true }
    case 'slaBreached':
      // slaState='BREACHED' → backend slaBreachedOnly=true, exact predicate matching the dashboard slaBreached count
      return { openOnly: true, slaState: 'BREACHED' as const }
    case 'slaAtRisk':
      // slaState='AT_RISK' → backend slaAtRiskOnly=true, tickets within the SLA at-risk window
      return { openOnly: true, slaState: 'AT_RISK' as const }
  }
}

const BULK_STATUS_OPTIONS: TicketStatus[] = ['TRIAGED', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED']

export function TicketListPage() {
  const [searchParams] = useSearchParams()
  const dashboardFilter = searchParams.get('dashboardFilter')
  const { filters, sort, page, pageSize, setFilters, replaceFilters, setSort, setPage, setPageSize } =
    useFilterStore()
  const tagsQuery = useAllTags()
  const queryClient = useQueryClient()
  const { success, error: toastError } = useToast()

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showBulkAssign, setShowBulkAssign] = useState(false)
  const [isBulkAssigning, setIsBulkAssigning] = useState(false)
  const [showBulkStatus, setShowBulkStatus] = useState(false)
  const [bulkStatusTarget, setBulkStatusTarget] = useState<TicketStatus | ''>('')
  const [isBulkStatusChanging, setIsBulkStatusChanging] = useState(false)
  const [showBulkTag, setShowBulkTag] = useState(false)
  const [bulkTagId, setBulkTagId] = useState('')
  const [isBulkTagging, setIsBulkTagging] = useState(false)
  const activeTagsQuery = useActiveTags()

  useEffect(() => {
    if (
      dashboardFilter === 'active'
      || dashboardFilter === 'unassigned'
      || dashboardFilter === 'waiting'
      || dashboardFilter === 'resolved'
      || dashboardFilter === 'closed'
      || dashboardFilter === 'staleOpen24h'
      || dashboardFilter === 'slaBreached'
      || dashboardFilter === 'slaAtRisk'
    ) {
      replaceFilters({
        ...defaultFilters,
        ...getDashboardPresetFilters(dashboardFilter as DashboardFilterPreset),
      })
    }
  }, [dashboardFilter, replaceFilters])

  const handleFilterChange = useCallback(
    (partial: Parameters<typeof setFilters>[0]) => {
      setFilters(partial)
      setSelectedIds([])
    },
    [setFilters],
  )

  const { data, isLoading } = useTickets({ filters, sort, page, pageSize })
  const { users, groups } = useUsers()

  const handleBulkAssign = async (userId: string | null, _userName: string | null) => {
    if (!userId || selectedIds.length === 0) return
    setIsBulkAssigning(true)
    let successCount = 0
    let failCount = 0
    for (const ticketId of selectedIds) {
      try {
        await assignmentService.assignOrReassign({ ticketId, assignedUserId: userId })
        successCount++
      } catch {
        failCount++
      }
    }
    setIsBulkAssigning(false)
    queryClient.invalidateQueries({ queryKey: ['tickets'] })
    setSelectedIds([])
    setShowBulkAssign(false)
    if (failCount === 0) {
      success(`${successCount} ticket${successCount !== 1 ? 's' : ''} assigned.`)
    } else {
      toastError(`${successCount} assigned, ${failCount} failed. Check individual tickets.`)
    }
  }

  const handleBulkStatusChange = async () => {
    if (!bulkStatusTarget || selectedIds.length === 0) return
    setIsBulkStatusChanging(true)
    let successCount = 0
    let failCount = 0
    for (const ticketId of selectedIds) {
      try {
        await ticketService.changeStatus(ticketId, bulkStatusTarget)
        successCount++
      } catch {
        failCount++
      }
    }
    setIsBulkStatusChanging(false)
    queryClient.invalidateQueries({ queryKey: ['tickets'] })
    setSelectedIds([])
    setShowBulkStatus(false)
    setBulkStatusTarget('')
    if (failCount === 0) {
      success(`${successCount} ticket${successCount !== 1 ? 's' : ''} updated to ${TICKET_STATUS_LABELS[bulkStatusTarget]}.`)
    } else {
      toastError(`${successCount} updated, ${failCount} failed. Check individual tickets.`)
    }
  }

  const handleBulkTag = async () => {
    if (!bulkTagId || selectedIds.length === 0) return
    setIsBulkTagging(true)
    let successCount = 0
    let failCount = 0
    for (const ticketId of selectedIds) {
      try {
        await tagService.addTagToTicket(ticketId, bulkTagId)
        successCount++
      } catch {
        failCount++
      }
    }
    setIsBulkTagging(false)
    queryClient.invalidateQueries({ queryKey: ['tickets'] })
    setSelectedIds([])
    setShowBulkTag(false)
    setBulkTagId('')
    if (failCount === 0) {
      success(`Tag applied to ${successCount} ticket${successCount !== 1 ? 's' : ''}.`)
    } else {
      toastError(`${successCount} tagged, ${failCount} failed. Check individual tickets.`)
    }
  }

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
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onSortChange={setSort}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onBulkAssign={() => setShowBulkAssign(true)}
        onBulkStatusChange={() => setShowBulkStatus(true)}
        onBulkTag={() => setShowBulkTag(true)}
      />

      {/* Bulk Assign Modal */}
      <AssignmentModal
        isOpen={showBulkAssign}
        onClose={() => setShowBulkAssign(false)}
        ticketId=""
        ticketNo={`${selectedIds.length} ticket${selectedIds.length !== 1 ? 's' : ''}`}
        groups={groups}
        users={users}
        onAssign={handleBulkAssign}
        isAssigning={isBulkAssigning}
      />

      {/* Bulk Tag Modal */}
      <Modal
        isOpen={showBulkTag}
        onClose={() => { setShowBulkTag(false); setBulkTagId('') }}
        title={`Add Tag — ${selectedIds.length} Ticket${selectedIds.length !== 1 ? 's' : ''}`}
        size="sm"
        footer={(
          <>
            <Button variant="secondary" size="sm" onClick={() => { setShowBulkTag(false); setBulkTagId('') }} disabled={isBulkTagging}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleBulkTag} isLoading={isBulkTagging} disabled={!bulkTagId}>
              Apply to {selectedIds.length} Ticket{selectedIds.length !== 1 ? 's' : ''}
            </Button>
          </>
        )}
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Select a tag to apply to all <strong>{selectedIds.length}</strong> selected ticket{selectedIds.length !== 1 ? 's' : ''}.
          </p>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Tag</label>
            <select
              value={bulkTagId}
              onChange={(e) => setBulkTagId(e.target.value)}
              className="ui-select"
            >
              <option value="">Select tag...</option>
              {(activeTagsQuery.data ?? []).map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      {/* Bulk Status Modal */}
      <Modal
        isOpen={showBulkStatus}
        onClose={() => { setShowBulkStatus(false); setBulkStatusTarget('') }}
        title={`Change Status — ${selectedIds.length} Ticket${selectedIds.length !== 1 ? 's' : ''}`}
        size="sm"
        footer={(
          <>
            <Button variant="secondary" size="sm" onClick={() => { setShowBulkStatus(false); setBulkStatusTarget('') }} disabled={isBulkStatusChanging}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleBulkStatusChange} isLoading={isBulkStatusChanging} disabled={!bulkStatusTarget}>
              Apply to {selectedIds.length} Ticket{selectedIds.length !== 1 ? 's' : ''}
            </Button>
          </>
        )}
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Select the new status to apply to all <strong>{selectedIds.length}</strong> selected ticket{selectedIds.length !== 1 ? 's' : ''}.
            Tickets that don't allow this transition will be skipped and reported.
          </p>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">New Status</label>
            <select
              value={bulkStatusTarget}
              onChange={(e) => setBulkStatusTarget(e.target.value as TicketStatus)}
              className="ui-select"
            >
              <option value="">Select status...</option>
              {BULK_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{TICKET_STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  )
}
