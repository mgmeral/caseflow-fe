import { useEffect, useState } from 'react'
import { Search, ChevronDown, ChevronUp, X } from 'lucide-react'
import { clsx } from 'clsx'
import type { TicketFilters as TicketFiltersState, TicketPriority, TicketStatus } from '@/types/ticket.types'
import type { Group, User } from '@/types/user.types'
import { TICKET_PRIORITY_LABELS, TICKET_STATUS_LABELS } from '@/constants/enums'

interface TicketFiltersProps {
  filters: TicketFiltersState
  onChange: (partial: Partial<TicketFiltersState>) => void
  groups: Group[]
  users: User[]
}

const ALL_STATUSES: TicketStatus[] = [
  'NEW',
  'TRIAGED',
  'ASSIGNED',
  'IN_PROGRESS',
  'WAITING_CUSTOMER',
  'RESOLVED',
  'CLOSED',
  'REOPENED',
]

const ALL_PRIORITIES: TicketPriority[] = ['critical', 'high', 'medium', 'low']

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timeoutId)
  }, [delay, value])

  return debounced
}

export function TicketFilters({ filters, onChange, groups, users }: TicketFiltersProps) {
  const [showMore, setShowMore] = useState(false)
  const [searchInput, setSearchInput] = useState(filters.search)
  const debouncedSearch = useDebounce(searchInput, 300)

  useEffect(() => {
    if (filters.search !== searchInput) {
      setSearchInput(filters.search)
    }
  }, [filters.search, searchInput])

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      onChange({ search: debouncedSearch })
    }
  }, [debouncedSearch, filters.search, onChange])

  const selectedStatus = filters.statuses[0] ?? ''
  const selectedPriority = filters.priorities[0] ?? ''
  const selectedAssignee = filters.assignedUserIds[0] ?? ''
  const selectedGroup = filters.groupIds[0] ?? ''

  const activeTags: Array<{ label: string; onRemove: () => void }> = []
  if (selectedStatus) {
    activeTags.push({
      label: `Status: ${TICKET_STATUS_LABELS[selectedStatus]}`,
      onRemove: () => onChange({ statuses: [] }),
    })
  }
  if (selectedPriority) {
    activeTags.push({
      label: `Priority: ${TICKET_PRIORITY_LABELS[selectedPriority]}`,
      onRemove: () => onChange({ priorities: [] }),
    })
  }
  if (selectedAssignee) {
    activeTags.push({ label: 'Assignee selected', onRemove: () => onChange({ assignedUserIds: [] }) })
  }
  if (selectedGroup) {
    activeTags.push({ label: 'Group selected', onRemove: () => onChange({ groupIds: [] }) })
  }
  if (filters.unassignedOnly) {
    activeTags.push({ label: 'Unassigned Only', onRemove: () => onChange({ unassignedOnly: false }) })
  }
  if (filters.overdueOnly) {
    activeTags.push({ label: 'Overdue Only', onRemove: () => onChange({ overdueOnly: false }) })
  }
  if (filters.openOnly) {
    activeTags.push({ label: 'Open Only', onRemove: () => onChange({ openOnly: false }) })
  }
  if (filters.transferredOnly) {
    activeTags.push({ label: 'Transferred Only', onRemove: () => onChange({ transferredOnly: false }) })
  }
  if (filters.dateFrom || filters.dateTo) {
    activeTags.push({ label: 'Date Range', onRemove: () => onChange({ dateFrom: null, dateTo: null }) })
  }

  const clearAll = () => {
    setSearchInput('')
    onChange({
      search: '',
      statuses: [],
      priorities: [],
      assignedUserIds: [],
      groupIds: [],
      dateFrom: null,
      dateTo: null,
      unassignedOnly: false,
      overdueOnly: false,
      openOnly: false,
      transferredOnly: false,
    })
  }

  return (
    <div className="bg-white border-b border-gray-200 px-3 py-2 space-y-1.5">
      <div className="flex items-center gap-1.5 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search tickets..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="pl-7 pr-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-[240px]"
          />
        </div>

        <select
          value={selectedStatus}
          onChange={(event) => onChange({ statuses: event.target.value ? [event.target.value as TicketStatus] : [] })}
          className="px-2 py-1 text-xs border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Statuses</option>
          {ALL_STATUSES.map((status) => (
            <option key={status} value={status}>{TICKET_STATUS_LABELS[status]}</option>
          ))}
        </select>

        <select
          value={selectedPriority}
          onChange={(event) => onChange({ priorities: event.target.value ? [event.target.value as TicketPriority] : [] })}
          className="px-2 py-1 text-xs border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Priorities</option>
          {ALL_PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>{TICKET_PRIORITY_LABELS[priority]}</option>
          ))}
        </select>

        <select
          value={selectedAssignee}
          onChange={(event) => onChange({ assignedUserIds: event.target.value ? [event.target.value] : [] })}
          className="px-2 py-1 text-xs border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Assignees</option>
          {users.filter((user) => user.isActive).map((user) => (
            <option key={user.id} value={user.id}>{user.fullName}</option>
          ))}
        </select>

        <select
          value={selectedGroup}
          onChange={(event) => onChange({ groupIds: event.target.value ? [event.target.value] : [] })}
          className="px-2 py-1 text-xs border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Groups</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>{group.name}</option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setShowMore((value) => !value)}
          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 ml-auto"
        >
          {showMore ? 'Less' : 'More'}
          {showMore ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {showMore ? (
        <div className="flex items-center gap-2 flex-wrap pt-0.5">
          <div className="flex items-center gap-1.5">
            <label className="text-[11px] text-gray-500 font-medium">From</label>
            <input
              type="date"
              value={filters.dateFrom ?? ''}
              onChange={(event) => onChange({ dateFrom: event.target.value || null })}
              className="px-1.5 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-[11px] text-gray-500 font-medium">To</label>
            <input
              type="date"
              value={filters.dateTo ?? ''}
              onChange={(event) => onChange({ dateTo: event.target.value || null })}
              className="px-1.5 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {([
            { key: 'unassignedOnly', label: 'Unassigned Only' },
            { key: 'overdueOnly', label: 'Overdue Only' },
            { key: 'openOnly', label: 'Open Only' },
            { key: 'transferredOnly', label: 'Transferred Only' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => onChange({ [key]: !filters[key] })}
              className={clsx(
                'px-2 py-1 text-[11px] font-medium rounded-full border transition-colors',
                filters[key]
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}

      {activeTags.length > 0 ? (
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          {activeTags.map((tag) => (
            <span
              key={tag.label}
              className="inline-flex items-center gap-0.5 px-1.5 py-px bg-indigo-50 text-indigo-700 text-[11px] rounded-full border border-indigo-200"
            >
              {tag.label}
              <button
                type="button"
                onClick={tag.onRemove}
                className="hover:text-indigo-900"
                aria-label={`Remove ${tag.label} filter`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-indigo-600 hover:text-indigo-800 underline ml-auto"
          >
            Clear All
          </button>
        </div>
      ) : null}
    </div>
  )
}