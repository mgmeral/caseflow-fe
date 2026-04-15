import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { InboxIcon, ChevronUp, ChevronDown, UserPlus, ArrowUpRight } from 'lucide-react'
import { clsx } from 'clsx'
import { format } from 'date-fns'
import type { Ticket } from '@/types/ticket.types'
import type { SortState } from '@/types/common.types'
import { TicketStatusBadge } from './TicketStatusBadge'
import { PriorityBadge } from './PriorityBadge'
import { AgingIndicator } from './AgingIndicator'
import { SkeletonRow } from '@/components/shared/SkeletonRow'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/shared/Button'
import { PAGE_SIZE_OPTIONS } from '@/constants/enums'
import { DEFAULT_TICKET_SORT, isSupportedQueueSortField } from '@/lib/ticketQueryContracts'

interface PoolTableProps {
  tickets: Ticket[]
  isLoading: boolean
  sort: SortState
  onSortChange: (sort: SortState) => void
  total: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onAssign: (ticket: Ticket) => void
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
  onBulkAssign: () => void
}

const COLUMNS: Array<{ key: string; label: string; sortable?: boolean; width?: string }> = [
  { key: 'checkbox', label: '', width: 'w-8' },
  { key: 'priority', label: 'Priority', sortable: true, width: 'w-20' },
  { key: 'subject', label: 'Subject' },
  { key: 'customerName', label: 'Customer' },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'groupName', label: 'Group' },
  { key: 'openDurationMinutes', label: 'Age' },
  { key: 'updatedAt', label: 'Updated', sortable: true },
  { key: 'assign', label: '', width: 'w-24' },
]

function SortIcon({ field, sort }: { field: string; sort: SortState }) {
  if (sort.field !== field) return <span className="text-gray-300 ml-1">↕</span>
  return sort.direction === 'asc'
    ? <ChevronUp size={14} className="inline ml-1 text-indigo-600" />
    : <ChevronDown size={14} className="inline ml-1 text-indigo-600" />
}

export function PoolTable({
  tickets,
  isLoading,
  sort,
  onSortChange,
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onAssign,
  selectedIds,
  onSelectionChange,
  onBulkAssign,
}: PoolTableProps) {
  const navigate = useNavigate()
  const allSelected = tickets.length > 0 && tickets.every((t) => selectedIds.includes(t.id))
  const totalPages = Math.ceil(total / pageSize)
  const startItem = (page - 1) * pageSize + 1
  const endItem = Math.min(page * pageSize, total)

  const handleSort = (field: string) => {
    if (!isSupportedQueueSortField(field)) return
    if (sort.field !== field) {
      onSortChange({ field, direction: 'asc' })
    } else if (sort.direction === 'asc') {
      onSortChange({ field, direction: 'desc' })
    } else {
      onSortChange(DEFAULT_TICKET_SORT)
    }
  }

  return (
    <div className="relative table-shell">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b border-white/60 bg-[linear-gradient(90deg,rgba(31,111,255,0.05)_0,rgba(31,111,255,0.05)_72px,transparent_72px),linear-gradient(180deg,rgba(255,255,255,0.78)_0%,rgba(244,248,255,0.66)_100%)]">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={clsx(
                    'px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400',
                    col.width,
                    col.sortable && 'cursor-pointer select-none hover:text-gray-600',
                    sort.field === col.key && 'text-indigo-600',
                  )}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  {col.key === 'checkbox' ? (
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(e) => onSelectionChange(e.target.checked ? tickets.map((t) => t.id) : [])}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      aria-label="Select all tickets"
                    />
                  ) : col.key === 'assign' ? null : (
                    <>
                      {col.label}
                      {col.sortable && <SortIcon field={col.key} sort={sort} />}
                    </>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} colCount={9} />)
            ) : tickets.length === 0 ? (
              <tr>
                <td colSpan={9}>
                  <EmptyState
                    icon={<InboxIcon size={32} className="text-gray-400" />}
                    title="Queue is empty"
                    description="No unassigned tickets matching your filters."
                  />
                </td>
              </tr>
            ) : (
              tickets.map((ticket, index) => (
                <PoolRow
                  key={ticket.id}
                  ticket={ticket}
                  rowIndex={index}
                  isSelected={selectedIds.includes(ticket.id)}
                  onSelect={(checked) =>
                    onSelectionChange(
                      checked ? [...selectedIds, ticket.id] : selectedIds.filter((id) => id !== ticket.id),
                    )
                  }
                  anySelected={selectedIds.length > 0}
                  onAssign={() => onAssign(ticket)}
                  onNavigate={() => navigate(`/tickets/${ticket.id}`)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!isLoading && total > 0 && (
        <div className="flex items-center justify-between border-t border-white/60 bg-[linear-gradient(180deg,rgba(250,252,255,0.84)_0%,rgba(244,247,252,0.72)_100%)] px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">
              {startItem}–{endItem} of {total}
            </span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="ui-select w-auto min-w-[104px] px-3 py-1.5 text-[11px]"
            >
              {PAGE_SIZE_OPTIONS.map((s) => (
                <option key={s} value={s}>{s} / page</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
              Prev
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = totalPages <= 5 ? i + 1 : Math.max(1, page - 2) + i
              if (p > totalPages) return null
              return (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className={clsx(
                    'rounded-lg border px-2.5 py-1 text-[13px] font-medium transition-all duration-200',
                    p === page
                      ? 'border-[#1258e3] bg-[#1258e3] text-white shadow-soft'
                      : 'border-slate-200 bg-white/80 text-slate-700 hover:-translate-y-[1px] hover:border-[#b7d0ff] hover:bg-[#f7fbff] hover:text-[#1258e3]',
                  )}
                >
                  {p}
                </button>
              )
            })}
            <Button variant="secondary" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Bulk action bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-[#2a63d4]/40 bg-[linear-gradient(180deg,rgba(19,82,211,0.96)_0%,rgba(16,63,161,0.92)_100%)] px-5 py-3 text-white shadow-elevated backdrop-blur-md">
          <span className="text-sm font-medium">
            {selectedIds.length} ticket{selectedIds.length > 1 ? 's' : ''} selected
          </span>
          <div className="w-px h-5 bg-indigo-500" />
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[13px] font-semibold text-indigo-700 transition-colors hover:bg-indigo-50"
            onClick={onBulkAssign}
          >
            <UserPlus size={14} />
            Assign Selected
          </button>
          <button
            type="button"
            onClick={() => onSelectionChange([])}
            className="text-indigo-300 hover:text-white text-sm"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  )
}

/* ─── Pool Row ─────────────────────────────────────────── */

interface PoolRowProps {
  ticket: Ticket
  rowIndex?: number
  isSelected: boolean
  onSelect: (checked: boolean) => void
  anySelected: boolean
  onAssign: () => void
  onNavigate: () => void
}

function PoolRow({ ticket, rowIndex = 0, isSelected, onSelect, anySelected, onAssign, onNavigate }: PoolRowProps) {
  const [hovering, setHovering] = useState(false)
  const isEvenRow = rowIndex % 2 === 0

  return (
    <tr
      className={clsx(
        'cursor-pointer border-b border-white/60 transition-colors',
        isEvenRow
          ? 'bg-[linear-gradient(90deg,rgba(31,111,255,0.11)_0%,rgba(31,111,255,0.05)_52%,rgba(255,255,255,0.14)_100%)]'
          : 'bg-[linear-gradient(90deg,rgba(148,163,184,0.13)_0%,rgba(148,163,184,0.06)_52%,rgba(255,255,255,0.1)_100%)]',
        ticket.slaBreached && 'bg-[linear-gradient(90deg,rgba(239,68,68,0.08)_0%,transparent_42%)]',
        !ticket.slaBreached && (ticket.priority === 'critical' || ticket.priority === 'high') && 'bg-[linear-gradient(90deg,rgba(251,191,36,0.09)_0%,transparent_42%)]',
        isSelected && '!bg-[linear-gradient(90deg,rgba(31,111,255,0.12)_0%,rgba(31,111,255,0.04)_100%)]',
        !isSelected && !ticket.slaBreached && ticket.priority !== 'critical' && ticket.priority !== 'high' && 'hover:bg-[linear-gradient(90deg,rgba(31,111,255,0.05)_0%,transparent_55%)]',
      )}
      onClick={onNavigate}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* Checkbox */}
      <td className="pl-3 pr-1 py-1.5 w-8" onClick={(e) => e.stopPropagation()}>
        <div className={clsx('transition-opacity', hovering || anySelected || isSelected ? 'opacity-100' : 'opacity-0')}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(e.target.checked)}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            aria-label={`Select ticket ${ticket.ticketNo}`}
          />
        </div>
      </td>

      {/* Priority */}
      <td className="px-3 py-1.5 w-20">
        <PriorityBadge priority={ticket.priority} />
      </td>

      {/* Subject */}
      <td className="px-3 py-1.5 max-w-xs">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            {ticket.slaBreached && (
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 animate-pulse" title="SLA Breached" />
            )}
            <span className="text-sm font-medium text-gray-900 truncate">{ticket.subject}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-px">
            <span className="text-[11px] text-gray-400">{ticket.ticketNo}</span>
            {ticket.isTransferred && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-1 py-px rounded-full leading-none">
                <ArrowUpRight size={9} />
                Transferred
              </span>
            )}
          </div>
        </div>
      </td>

      {/* Customer */}
      <td className="px-3 py-1.5">
        <div className="text-sm text-gray-700 truncate max-w-[130px]">{ticket.customerName}</div>
      </td>

      {/* Status */}
      <td className="px-3 py-1.5">
        <TicketStatusBadge status={ticket.status} />
      </td>

      {/* Group */}
      <td className="px-3 py-1.5">
        <span className="rounded-full border border-slate-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(241,246,255,0.84)_100%)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-600">{ticket.groupName}</span>
      </td>

      {/* Age */}
      <td className="px-3 py-1.5">
        <AgingIndicator openDurationMinutes={ticket.openDurationMinutes} slaBreached={ticket.slaBreached} />
      </td>

      {/* Updated */}
      <td className="px-3 py-1.5">
        <span className="text-[11px] text-gray-400 tabular-nums">
          {format(new Date(ticket.updatedAt), 'MMM d, HH:mm')}
        </span>
      </td>

      {/* Assign CTA */}
      <td className="px-2 py-1.5 w-24" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onAssign}
          className="flex items-center gap-1 rounded-lg border border-[#c6d8ff] bg-[linear-gradient(180deg,rgba(255,255,255,0.88)_0%,rgba(236,244,255,0.82)_100%)] px-2.5 py-1.5 text-[12px] font-semibold text-[#1258e3] shadow-soft transition-all duration-200 hover:-translate-y-[1px] hover:border-[#7faeff] hover:bg-[#edf4ff] hover:text-[#0f53d3]"
        >
          <UserPlus size={12} />
          Assign
        </button>
      </td>
    </tr>
  )
}
