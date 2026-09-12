import { InboxIcon, ChevronUp, ChevronDown } from 'lucide-react'
import { clsx } from 'clsx'
import type { Ticket } from '@/types/ticket.types'
import type { SortState } from '@/types/common.types'
import { TicketTableRow } from './TicketTableRow'
import { SkeletonRow } from '@/components/shared/SkeletonRow'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/shared/Button'
import { PAGE_SIZE_OPTIONS } from '@/constants/enums'
import { DEFAULT_TICKET_SORT, isSupportedTicketSortField } from '@/lib/ticketQueryContracts'

interface TicketTableProps {
  tickets: Ticket[]
  isLoading: boolean
  sort: SortState
  onSort?: (field: string) => void
  /** Alias for onSort */
  onSortChange?: (sort: SortState) => void
  selectedIds?: string[]
  onSelectionChange?: (ids: string[]) => void
  total: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onBulkAssign?: () => void
  onBulkStatusChange?: () => void
  onBulkTag?: () => void
}

const COLUMNS: Array<{ key: string; label: string; sortable?: boolean; width?: string }> = [
  { key: 'checkbox', label: '', width: 'w-8' },
  { key: 'subject', label: 'Subject' },
  { key: 'customerName', label: 'Customer' },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'priority', label: 'Priority', sortable: true },
  { key: 'assignedUserName', label: 'Owner' },
  { key: 'groupName', label: 'Group' },
  { key: 'openDurationMinutes', label: 'Age' },
  { key: 'updatedAt', label: 'Updated', sortable: true },
  { key: 'actions', label: '', width: 'w-10' },
]

function SortIcon({ field, sort }: { field: string; sort: SortState }) {
  if (sort.field !== field) {
    return <span className="text-gray-300 ml-1">↕</span>
  }
  return sort.direction === 'asc' ? (
    <ChevronUp size={14} className="inline ml-1 text-indigo-600" />
  ) : (
    <ChevronDown size={14} className="inline ml-1 text-indigo-600" />
  )
}

export function TicketTable({
  tickets,
  isLoading,
  sort,
  onSort,
  onSortChange,
  selectedIds = [],
  onSelectionChange,
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onBulkAssign,
  onBulkStatusChange,
  onBulkTag,
}: TicketTableProps) {
  const allSelected = tickets.length > 0 && tickets.every((t) => selectedIds.includes(t.id))

  const handleSort = (field: string) => {
    if (!isSupportedTicketSortField(field)) return
    if (onSort) {
      onSort(field)
    } else if (onSortChange) {
      if (sort.field !== field) {
        onSortChange({ field, direction: 'asc' })
      } else if (sort.direction === 'asc') {
        onSortChange({ field, direction: 'desc' })
      } else {
        onSortChange(DEFAULT_TICKET_SORT)
      }
    }
  }

  const toggleAll = (checked: boolean) => {
    onSelectionChange?.(checked ? tickets.map((t) => t.id) : [])
  }

  const toggleOne = (id: string, checked: boolean) => {
    onSelectionChange?.(checked ? [...selectedIds, id] : selectedIds.filter((s) => s !== id))
  }

  const totalPages = Math.ceil(total / pageSize)
  const startItem = (page - 1) * pageSize + 1
  const endItem = Math.min(page * pageSize, total)

  return (
    <div className="relative table-shell">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
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
                      onChange={(e) => toggleAll(e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      aria-label="Select all tickets"
                    />
                  ) : (
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
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} colCount={10} />)
            ) : tickets.length === 0 ? (
              <tr>
                <td colSpan={10}>
                  <EmptyState
                    icon={<InboxIcon size={32} className="text-gray-400" />}
                    title="No tickets found"
                    description="Try adjusting your filters or search query."
                  />
                </td>
              </tr>
            ) : (
              tickets.map((ticket, index) => (
                <TicketTableRow
                  key={ticket.id}
                  ticket={ticket}
                  rowIndex={index}
                  isSelected={selectedIds.includes(ticket.id)}
                  onSelect={toggleOne}
                  anySelected={selectedIds.length > 0}
                  onAssign={() => undefined}
                  onChangeStatus={() => undefined}
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
                <option key={s} value={s}>
                  {s} / page
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
            >
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
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Bulk action bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-[#b7cdfc] bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(237,244,255,0.94)_100%)] px-5 py-3 text-slate-900 shadow-elevated backdrop-blur-md">
          <span className="text-sm font-medium text-slate-900">{selectedIds.length} tickets selected</span>
          <div className="h-5 w-px bg-sky-200" />
          <Button variant="ghost" size="sm" className="text-sky-700 hover:bg-sky-50 hover:text-sky-800" onClick={onBulkAssign}>
            Assign
          </Button>
          <Button variant="ghost" size="sm" className="text-sky-700 hover:bg-sky-50 hover:text-sky-800" onClick={onBulkStatusChange}>
            Change Status
          </Button>
          <Button variant="ghost" size="sm" className="text-sky-700 hover:bg-sky-50 hover:text-sky-800" onClick={onBulkTag}>
            Add Tags
          </Button>
          <Button variant="ghost" size="sm" className="text-sky-700 hover:bg-sky-50 hover:text-sky-800">
            Export
          </Button>
          <button
            type="button"
            onClick={() => onSelectionChange?.([])}
            className="text-slate-500 hover:text-slate-900 text-sm"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  )
}
