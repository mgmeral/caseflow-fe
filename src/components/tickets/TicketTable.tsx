import { InboxIcon, ChevronUp, ChevronDown } from 'lucide-react'
import { clsx } from 'clsx'
import type { Ticket } from '@/types/ticket.types'
import type { SortState } from '@/types/common.types'
import { TicketTableRow } from './TicketTableRow'
import { SkeletonRow } from '@/components/shared/SkeletonRow'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/shared/Button'
import { PAGE_SIZE_OPTIONS } from '@/constants/enums'

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
}

const COLUMNS: Array<{ key: string; label: string; sortable?: boolean; width?: string }> = [
  { key: 'checkbox', label: '', width: 'w-10' },
  { key: 'subject', label: 'Subject', sortable: true },
  { key: 'customerName', label: 'Customer', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'priority', label: 'Priority', sortable: true },
  { key: 'assignedUserName', label: 'Owner', sortable: true },
  { key: 'groupName', label: 'Group', sortable: true },
  { key: 'openDurationMinutes', label: 'Age', sortable: true },
  { key: 'updatedAt', label: 'Updated', sortable: true },
  { key: 'actions', label: '', width: 'w-12' },
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
}: TicketTableProps) {
  const allSelected = tickets.length > 0 && tickets.every((t) => selectedIds.includes(t.id))

  const handleSort = (field: string) => {
    if (onSort) {
      onSort(field)
    } else if (onSortChange) {
      const newDir = sort.field === field && sort.direction === 'asc' ? 'desc' : 'asc'
      onSortChange({ field, direction: newDir })
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
    <div className="relative">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={clsx(
                    'px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wide',
                    col.width,
                    col.sortable && 'cursor-pointer select-none hover:text-gray-700',
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
              tickets.map((ticket) => (
                <TicketTableRow
                  key={ticket.id}
                  ticket={ticket}
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
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-white">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              Showing {startItem}–{endItem} of {total}
            </span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                    'px-3 py-1 text-sm rounded border',
                    p === page
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50',
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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-2xl">
          <span className="text-sm font-medium">{selectedIds.length} tickets selected</span>
          <div className="w-px h-5 bg-gray-600" />
          <Button variant="ghost" size="sm" className="text-white hover:bg-gray-700" onClick={onBulkAssign}>
            Assign
          </Button>
          <Button variant="ghost" size="sm" className="text-white hover:bg-gray-700" onClick={onBulkStatusChange}>
            Change Status
          </Button>
          <Button variant="ghost" size="sm" className="text-white hover:bg-gray-700">
            Export
          </Button>
          <button
            type="button"
            onClick={() => onSelectionChange?.([])}
            className="text-gray-400 hover:text-white text-sm"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  )
}
