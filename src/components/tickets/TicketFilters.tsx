import { useEffect, useState } from 'react'
import { Search, ChevronDown, ChevronUp, X } from 'lucide-react'
import { clsx } from 'clsx'
import type { TicketFilters as TicketFiltersState, TicketPriority, TicketStatus, TicketTag } from '@/types/ticket.types'
import type { Group, User } from '@/types/user.types'
import { TICKET_PRIORITY_LABELS, TICKET_STATUS_LABELS } from '@/constants/enums'

interface TicketFiltersProps {
  filters: TicketFiltersState
  onChange: (partial: Partial<TicketFiltersState>) => void
  groups: Group[]
  users: User[]
  tags: TicketTag[]
  isTagsLoading?: boolean
  tagsUnavailable?: boolean
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

export function TicketFilters({
  filters,
  onChange,
  groups,
  users,
  tags,
  isTagsLoading = false,
  tagsUnavailable = false,
}: TicketFiltersProps) {
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
  const selectedTagId = filters.tagIds[0] ?? ''
  const selectedTagCode = filters.tagCodes[0] ?? ''
  const selectedAssigneeLabel = users.find((user) => user.id === selectedAssignee)?.fullName ?? selectedAssignee
  const selectedGroupLabel = groups.find((group) => group.id === selectedGroup)?.name ?? selectedGroup
  const selectedTag = tags.find((tag) => tag.id === selectedTagId) ?? tags.find((tag) => tag.code === selectedTagCode) ?? null

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
    activeTags.push({ label: `Assignee: ${selectedAssigneeLabel}`, onRemove: () => onChange({ assignedUserIds: [] }) })
  }
  if (selectedGroup) {
    activeTags.push({ label: `Group: ${selectedGroupLabel}`, onRemove: () => onChange({ groupIds: [] }) })
  }
  if (selectedTagId || selectedTagCode) {
    activeTags.push({
      label: `Tag: ${selectedTag?.name ?? selectedTag?.code ?? selectedTagCode ?? selectedTagId}`,
      onRemove: () => onChange({ tagIds: [], tagCodes: [] }),
    })
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
  if (filters.slaState === 'BREACHED') {
    activeTags.push({ label: 'SLA Breached', onRemove: () => onChange({ slaState: undefined }) })
  }
  if (filters.slaState === 'AT_RISK') {
    activeTags.push({ label: 'SLA At Risk', onRemove: () => onChange({ slaState: undefined }) })
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
      tagIds: [],
      tagCodes: [],
      dateFrom: null,
      dateTo: null,
      unassignedOnly: false,
      overdueOnly: false,
      openOnly: false,
      transferredOnly: false,
      slaState: undefined,
    })
  }

  return (
    <div className="table-toolbar space-y-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[240px] flex-1 max-w-[320px]">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search tickets..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="ui-input ui-input-with-icon pr-3"
          />
        </div>

        <select
          value={selectedStatus}
          onChange={(event) => onChange({ statuses: event.target.value ? [event.target.value as TicketStatus] : [] })}
          className="ui-select ui-field-inline px-3 text-[13px]"
        >
          <option value="">All Statuses</option>
          {ALL_STATUSES.map((status) => (
            <option key={status} value={status}>{TICKET_STATUS_LABELS[status]}</option>
          ))}
        </select>

        <select
          value={selectedPriority}
          onChange={(event) => onChange({ priorities: event.target.value ? [event.target.value as TicketPriority] : [] })}
          className="ui-select ui-field-inline px-3 text-[13px]"
        >
          <option value="">All Priorities</option>
          {ALL_PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>{TICKET_PRIORITY_LABELS[priority]}</option>
          ))}
        </select>

        <select
          value={selectedAssignee}
          onChange={(event) => onChange({ assignedUserIds: event.target.value ? [event.target.value] : [] })}
          className="ui-select ui-field-inline px-3 text-[13px]"
        >
          <option value="">All Assignees</option>
          {users.filter((user) => user.isActive).map((user) => (
            <option key={user.id} value={user.id}>{user.fullName}</option>
          ))}
        </select>

        <select
          value={selectedGroup}
          onChange={(event) => onChange({ groupIds: event.target.value ? [event.target.value] : [] })}
          className="ui-select ui-field-inline px-3 text-[13px]"
        >
          <option value="">All Groups</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>{group.name}</option>
          ))}
        </select>

        <select
          value={selectedTagId || selectedTagCode}
          onChange={(event) => {
            const tag = tags.find((item) => item.id === event.target.value || item.code === event.target.value)
            onChange({
              tagIds: tag ? [tag.id] : [],
              tagCodes: tag ? [tag.code] : [],
            })
          }}
          disabled={isTagsLoading || tagsUnavailable}
          className="ui-select ui-field-inline px-3 text-[13px]"
        >
          <option value="">All Tags</option>
          {tags.map((tag) => (
            <option key={tag.id} value={tag.id}>{tag.name} ({tag.code})</option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setShowMore((value) => !value)}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-slate-200/70 bg-white/82 px-3 py-1.5 text-[13px] font-medium text-slate-600 shadow-soft transition-all duration-200 hover:-translate-y-[1px] hover:border-[#b7d0ff] hover:bg-[#f7fbff] hover:text-[#1258e3] hover:shadow-card"
        >
          {showMore ? 'Less' : 'More'}
          {showMore ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {showMore ? (
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <div className="flex items-center gap-1.5">
            <label className="text-[11px] font-medium text-gray-500">From</label>
            <input
              type="date"
              value={filters.dateFrom ?? ''}
              onChange={(event) => onChange({ dateFrom: event.target.value || null })}
              className="ui-input w-auto min-w-[160px] px-3 py-1.5 text-[13px]"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-[11px] font-medium text-gray-500">To</label>
            <input
              type="date"
              value={filters.dateTo ?? ''}
              onChange={(event) => onChange({ dateTo: event.target.value || null })}
              className="ui-input w-auto min-w-[160px] px-3 py-1.5 text-[13px]"
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
                'rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] transition-all duration-200',
                filters[key]
                  ? 'border-[#b7d0ff] bg-[#edf4ff] text-[#1258e3] shadow-soft'
                  : 'border-slate-200 bg-white/80 text-slate-600 hover:border-[#c7d8f3] hover:bg-white',
              )}
            >
              {label}
            </button>
          ))}
          {/* SLA state — mutually exclusive pair */}
          {(['BREACHED', 'AT_RISK'] as const).map((state) => (
            <button
              key={state}
              type="button"
              onClick={() => onChange({ slaState: filters.slaState === state ? undefined : state })}
              className={clsx(
                'rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] transition-all duration-200',
                filters.slaState === state
                  ? 'border-[#b7d0ff] bg-[#edf4ff] text-[#1258e3] shadow-soft'
                  : 'border-slate-200 bg-white/80 text-slate-600 hover:border-[#c7d8f3] hover:bg-white',
              )}
            >
              {state === 'BREACHED' ? 'SLA Breached' : 'SLA At Risk'}
            </button>
          ))}
        </div>
      ) : null}

      {tagsUnavailable ? (
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-3 py-2.5 text-[11px] text-amber-900">
          Tag filter options are unavailable right now, so tag filtering is temporarily disabled instead of showing partial results.
        </div>
      ) : null}

      {activeTags.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {activeTags.map((tag) => (
            <span
              key={tag.label}
              className="inline-flex items-center gap-1 rounded-full border border-[#b7d0ff]/90 bg-[#edf4ff] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#1258e3] shadow-soft"
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
            className="ml-auto text-xs font-medium text-indigo-600 hover:text-indigo-800"
          >
            Clear All
          </button>
        </div>
      ) : null}
    </div>
  )
}