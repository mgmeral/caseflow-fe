import { ArrowLeft, Users, ArrowUpRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { Ticket } from '@/types/ticket.types'
import { TicketStatusBadge } from '@/components/tickets/TicketStatusBadge'
import { PriorityBadge } from '@/components/tickets/PriorityBadge'
import { Button } from '@/components/shared/Button'
import { format } from 'date-fns'

interface TicketHeaderProps {
  ticket: Ticket
  onAssign: () => void
  onTransfer: () => void
}

export function TicketHeader({ ticket, onAssign, onTransfer }: TicketHeaderProps) {
  const navigate = useNavigate()

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center gap-2 mb-3">
        <button
          type="button"
          onClick={() => navigate('/tickets')}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          aria-label="Back to tickets"
        >
          <ArrowLeft size={16} />
          Tickets
        </button>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-500">{ticket.id}</span>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-semibold text-gray-900 mb-2">{ticket.subject}</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <TicketStatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            <span className="text-xs text-gray-400">
              {ticket.groupName}
            </span>
            {ticket.isTransferred && (
              <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                <ArrowUpRight size={11} />
                Transferred from {ticket.transferredFromGroup}
              </span>
            )}
            <span className="text-xs text-gray-400">
              Created {format(new Date(ticket.createdAt), 'MMM d, yyyy HH:mm')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="secondary" size="sm" leftIcon={<Users size={14} />} onClick={onAssign}>
            Assign
          </Button>
          <Button variant="secondary" size="sm" leftIcon={<ArrowUpRight size={14} />} onClick={onTransfer}>
            Transfer
          </Button>
        </div>
      </div>
    </div>
  )
}
