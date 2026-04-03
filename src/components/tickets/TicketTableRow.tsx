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
  isSelected: boolean
  onSelect: (id: string, checked: boolean) => void
  anySelected: boolean
  onAssign?: (ticketId: string) => void
  onChangeStatus?: (ticketId: string) => void
}

export function TicketTableRow({
  ticket,
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

  return (
    <tr
      className={clsx(
        'border-b border-gray-100 cursor-pointer transition-colors',
        ticket.isUnread && 'border-l-[3px] border-l-indigo-500',
        isUnassigned && !ticket.isUnread && 'bg-amber-50',
        isSelected ? 'bg-indigo-50' : 'hover:bg-gray-50',
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
        className="pl-4 pr-2 py-3 w-10"
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
      <td className="px-4 py-3 max-w-xs">
        <div className="flex items-start gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              {ticket.isUnread && (
                <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
              )}
              <span className="text-sm font-medium text-gray-900 truncate">{ticket.subject}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-gray-400">{ticket.id}</span>
              {ticket.isTransferred && (
                <span className="inline-flex items-center gap-0.5 text-[11px] text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                  <ArrowUpRight size={10} />
                  Transferred
                </span>
              )}
            </div>
          </div>
        </div>
      </td>

      {/* Customer */}
      <td className="px-4 py-3">
        <div className="text-sm text-gray-700 truncate max-w-[140px]">{ticket.customerName}</div>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <TicketStatusBadge status={ticket.status} />
      </td>

      {/* Priority */}
      <td className="px-4 py-3">
        <PriorityBadge priority={ticket.priority} />
      </td>

      {/* Owner */}
      <td className="px-4 py-3">
        <OwnerCell userId={ticket.assignedUserId} userName={ticket.assignedUserName} />
      </td>

      {/* Group */}
      <td className="px-4 py-3">
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{ticket.groupName}</span>
      </td>

      {/* Aging */}
      <td className="px-4 py-3">
        <AgingIndicator
          openDurationMinutes={ticket.openDurationMinutes}
          slaBreached={ticket.slaBreached}
        />
      </td>

      {/* Updated At */}
      <td className="px-4 py-3">
        <span className="text-xs text-gray-400">
          {format(new Date(ticket.updatedAt), 'MMM d, HH:mm')}
        </span>
      </td>

      {/* Actions */}
      <td
        className={clsx('px-4 py-3 text-right w-12', hovering ? 'opacity-100' : 'opacity-0')}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-700"
            aria-label="Ticket actions"
          >
            <MoreHorizontal size={16} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 z-20 w-40 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  setMenuOpen(false)
                  onAssign?.(ticket.id)
                }}
              >
                Assign
              </button>
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  setMenuOpen(false)
                  onChangeStatus?.(ticket.id)
                }}
              >
                Change Status
              </button>
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
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
