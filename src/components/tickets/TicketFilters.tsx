import { useState, useEffect, useRef } from 'react'
import { Search, ChevronDown, ChevronUp, X } from 'lucide-react'
import { clsx } from 'clsx'
import type { TicketFilters, TicketStatus, TicketPriority } from '@/types/ticket.types'
import type { Group } from '@/types/user.types'
import type { User } from '@/types/user.types'
import { TICKET_STATUS_LABELS, TICKET_PRIORITY_LABELS } from '@/constants/enums'

interface TicketFiltersProps {
  filters: TicketFilters
  onChange: (partial: Partial<TicketFilters>) => void
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
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

interface MultiSelectDropdownProps {
  label: string
  options: { value: string; label: string }[]
  selected: string[]
  onChange: (vals: string[]) => void
}

function MultiSelectDropdown({ label, options, selected, onChange }: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const toggle = (val: string) => {
    onChange(selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val])
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={clsx(
          'flex items-center gap-1 px-2 py-1 text-xs border rounded-md bg-white hover:bg-gray-50 transition-colors',
          selected.length > 0 ? 'border-indigo-400 text-indigo-700' : 'border-gray-300 text-gray-700',
        )}
      >
        {label}
        {selected.length > 0 && (
          <span className="bg-indigo-100 text-indigo-700 text-xs px-1.5 rounded-full font-medium">
            {selected.length}
          </span>
        )}
        <ChevronDown size={14} />
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 z-30 min-w-[180px] bg-white border border-gray-200 rounded-lg shadow-lg py-1">
          {options.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                checked={selected.includes(opt.value)}
                onChange={() => toggle(opt.value)}
              />
              <span className="text-sm text-gray-700">{opt.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

export function TicketFilters({ filters, onChange, groups, users }: TicketFiltersProps) {
  const [showMore, setShowMore] = useState(false)
  const [searchInput, setSearchInput] = useState(filters.search)
  const debouncedSearch = useDebounce(searchInput, 300)

  useEffect(() => {
    onChange({ search: debouncedSearch })
  }, [debouncedSearch]) // eslint-disable-line react-hooks/exhaustive-deps

  const activeFilterCount = [
    filters.statuses.length > 0,
    filters.priorities.length > 0,
    filters.assignedUserIds.length > 0,
    filters.groupIds.length > 0,
    filters.dateFrom || filters.dateTo,
    filters.unassignedOnly,
    filters.overdueOnly,
    filters.openOnly,
    filters.transferredOnly,
  ].filter(Boolean).length

  const activeTags: Array<{ label: string; onRemove: () => void }> = []
  if (filters.statuses.length > 0)
    activeTags.push({
      label: `Status (${filters.statuses.length})`,
      onRemove: () => onChange({ statuses: [] }),
    })
  if (filters.priorities.length > 0)
    activeTags.push({
      label: `Priority (${filters.priorities.length})`,
      onRemove: () => onChange({ priorities: [] }),
    })
  if (filters.assignedUserIds.length > 0)
    activeTags.push({
      label: `Assignee (${filters.assignedUserIds.length})`,
      onRemove: () => onChange({ assignedUserIds: [] }),
    })
  if (filters.groupIds.length > 0)
    activeTags.push({
      label: `Group (${filters.groupIds.length})`,
      onRemove: () => onChange({ groupIds: [] }),
    })
  if (filters.unassignedOnly)
    activeTags.push({ label: 'Unassigned Only', onRemove: () => onChange({ unassignedOnly: false }) })
  if (filters.overdueOnly)
    activeTags.push({ label: 'Overdue Only', onRemove: () => onChange({ overdueOnly: false }) })
  if (filters.openOnly)
    activeTags.push({ label: 'Open Only', onRemove: () => onChange({ openOnly: false }) })
  if (filters.transferredOnly)
    activeTags.push({ label: 'Transferred Only', onRemove: () => onChange({ transferredOnly: false }) })
  if (filters.dateFrom || filters.dateTo)
    activeTags.push({
      label: `Date Range`,
      onRemove: () => onChange({ dateFrom: null, dateTo: null }),
    })

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
      {/* Row 1 */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search tickets..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-7 pr-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-[240px]"
          />
        </div>

        <MultiSelectDropdown
          label="Status"
          options={ALL_STATUSES.map((s) => ({ value: s, label: TICKET_STATUS_LABELS[s] }))}
          selected={filters.statuses}
          onChange={(vals) => onChange({ statuses: vals as TicketStatus[] })}
        />

        <MultiSelectDropdown
          label="Priority"
          options={ALL_PRIORITIES.map((p) => ({ value: p, label: TICKET_PRIORITY_LABELS[p] }))}
          selected={filters.priorities}
          onChange={(vals) => onChange({ priorities: vals as TicketPriority[] })}
        />

        <MultiSelectDropdown
          label="Assignee"
          options={users
            .filter((u) => u.isActive)
            .map((u) => ({ value: u.id, label: u.fullName }))}
          selected={filters.assignedUserIds}
          onChange={(vals) => onChange({ assignedUserIds: vals })}
        />

        <MultiSelectDropdown
          label="Group"
          options={groups.map((g) => ({ value: g.id, label: g.name }))}
          selected={filters.groupIds}
          onChange={(vals) => onChange({ groupIds: vals })}
        />

        <button
          type="button"
          onClick={() => setShowMore((v) => !v)}
          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 ml-auto"
        >
          {showMore ? 'Less' : 'More'}
          {showMore ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Row 2 */}
      {showMore && (
        <div className="flex items-center gap-2 flex-wrap pt-0.5">
          <div className="flex items-center gap-1.5">
            <label className="text-[11px] text-gray-500 font-medium">From</label>
            <input
              type="date"
              value={filters.dateFrom ?? ''}
              onChange={(e) => onChange({ dateFrom: e.target.value || null })}
              className="px-1.5 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-[11px] text-gray-500 font-medium">To</label>
            <input
              type="date"
              value={filters.dateTo ?? ''}
              onChange={(e) => onChange({ dateTo: e.target.value || null })}
              className="px-1.5 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {(
            [
              { key: 'unassignedOnly', label: 'Unassigned Only' },
              { key: 'overdueOnly', label: 'Overdue Only' },
              { key: 'openOnly', label: 'Open Only' },
              { key: 'transferredOnly', label: 'Transferred Only' },
            ] as const
          ).map(({ key, label }) => (
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
      )}

      {/* Active filter tags */}
      {activeFilterCount > 0 && (
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
      )}
    </div>
  )
}
