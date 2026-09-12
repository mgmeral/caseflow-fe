import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MoreHorizontal, ArrowUpRight } from 'lucide-react'
import { clsx } from 'clsx'
import { format } from 'date-fns'
import type { Ticket } from '@/types/ticket.types'
import { TicketStatusBadge } from './TicketStatusBadge'
import { PriorityBadge } from './PriorityBadge'
import { AgingIndicator } from './AgingIndicator'
import { OwnerCell } from './OwnerCell'

interface TicketTableRowProps {
  ticket: Ticket
  rowIndex?: number
  isSelected: boolean
  onSelect: (id: string, checked: boolean) => void
  anySelected: boolean
  onAssign?: (ticketId: string) => void
  onChangeStatus?: (ticketId: string) => void
}

export function TicketTableRow({
  ticket,
  rowIndex = 0,
  isSelected,
  onSelect,
  anySelected,
  onAssign,
  onChangeStatus,
}: TicketTableRowProps) {
  const navigate = useNavigate()
  const [hovering, setHovering] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const isUnassigned = !ticket.assignedUserId
  const isEvenRow = rowIndex % 2 === 0

  return (
    <tr
      className={clsx(
        'cursor-pointer border-b border-white/60 transition-colors',
        isEvenRow
          ? 'bg-[linear-gradient(90deg,rgba(31,111,255,0.11)_0%,rgba(31,111,255,0.05)_52%,rgba(255,255,255,0.14)_100%)]'
          : 'bg-[linear-gradient(90deg,rgba(148,163,184,0.13)_0%,rgba(148,163,184,0.06)_52%,rgba(255,255,255,0.1)_100%)]',
        ticket.isUnread && 'border-l-[3px] border-l-[#1f6fff]',
        isUnassigned && !ticket.isUnread && 'bg-[linear-gradient(90deg,rgba(251,191,36,0.1)_0%,transparent_38%)]',
        isSelected ? 'bg-[linear-gradient(90deg,rgba(31,111,255,0.12)_0%,rgba(31,111,255,0.04)_100%)]' : 'hover:bg-[linear-gradient(90deg,rgba(31,111,255,0.05)_0%,transparent_55%)]',
      )}
      onClick={() => navigate(`/tickets/${ticket.id}`)}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => {
        setHovering(false)
        setMenuOpen(false)
      }}
    >
      {/* Checkbox */}
      <td
        className="pl-3 pr-1 py-1.5 w-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={clsx(
            'transition-opacity',
            hovering || anySelected || isSelected ? 'opacity-100' : 'opacity-0',
          )}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(ticket.id, e.target.checked)}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            aria-label={`Select ticket ${ticket.id}`}
          />
        </div>
      </td>

      {/* Subject */}
      <td className="px-3 py-1.5 max-w-xs">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            {ticket.isUnread && (
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
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

      {/* Priority */}
      <td className="px-3 py-1.5">
        <PriorityBadge priority={ticket.priority} />
      </td>

      {/* Owner */}
      <td className="px-3 py-1.5">
        <OwnerCell userId={ticket.assignedUserId} userName={ticket.assignedUserName} />
      </td>

      {/* Group */}
      <td className="px-3 py-1.5">
        <div className="inline-flex flex-col gap-1">
          <span className="rounded-full border border-slate-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(241,246,255,0.84)_100%)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-600">{ticket.groupName}</span>
          <span className="text-[11px] text-gray-400">Current group</span>
        </div>
      </td>

      {/* Aging */}
      <td className="px-3 py-1.5">
        <AgingIndicator
          openDurationMinutes={ticket.openDurationMinutes}
          slaBreached={ticket.slaBreached}
          slaDeadlineAt={ticket.slaDeadlineAt}
        />
      </td>

      {/* Updated At */}
      <td className="px-3 py-1.5">
        <span className="text-[11px] text-gray-400 tabular-nums">
          {format(new Date(ticket.updatedAt), 'MMM d, HH:mm')}
        </span>
      </td>

      {/* Actions */}
      <td
        className={clsx('px-3 py-1.5 text-right w-10', hovering ? 'opacity-100' : 'opacity-0')}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="rounded-lg border border-transparent p-1.5 text-gray-400 transition-all duration-200 hover:border-[#d5e2ff] hover:bg-[#eef5ff] hover:text-[#1258e3]"
            aria-label="Ticket actions"
          >
            <MoreHorizontal size={16} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full z-20 mt-1 w-40 overflow-hidden rounded-xl border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(243,248,255,0.92)_100%)] py-1 shadow-elevated backdrop-blur-md">
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-[13px] font-medium text-slate-700 transition-colors hover:bg-[#eef5ff] hover:text-[#1258e3]"
                onClick={() => {
                  setMenuOpen(false)
                  onAssign?.(ticket.id)
                }}
              >
                Assign
              </button>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-[13px] font-medium text-slate-700 transition-colors hover:bg-[#eef5ff] hover:text-[#1258e3]"
                onClick={() => {
                  setMenuOpen(false)
                  onChangeStatus?.(ticket.id)
                }}
              >
                Change Status
              </button>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-[13px] font-medium text-slate-700 transition-colors hover:bg-[#eef5ff] hover:text-[#1258e3]"
                onClick={() => {
                  setMenuOpen(false)
                  navigate(`/tickets/${ticket.id}`)
                }}
              >
                View Detail
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  )
}
