import { Users, CheckCircle, XCircle, RotateCcw, ArrowRight } from 'lucide-react'
import { clsx } from 'clsx'
import type { Ticket, TicketStatus, TicketPriority, TicketActivityItem } from '@/types/ticket.types'
import { SLAIndicator } from './SLAIndicator'
import { Button } from '@/components/shared/Button'
import { usePermissions } from '@/hooks/usePermissions'
import { TICKET_STATUS_LABELS, TICKET_PRIORITY_LABELS } from '@/constants/enums'
import { TicketActivityTimeline } from './TicketActivityTimeline'

const PRIORITIES: TicketPriority[] = ['critical', 'high', 'medium', 'low']

interface TicketSidePanelProps {
  ticket: Ticket
  allowedTransitions: TicketStatus[]
  activities: TicketActivityItem[]
  onAssign: () => void
  onChangeStatus: (status: TicketStatus) => void
  onChangePriority: (priority: TicketPriority) => void
  onCloseTicket: () => void
  onReopenTicket: () => void
  onTransfer: () => void
}

export function TicketSidePanel({
  ticket,
  allowedTransitions,
  activities,
  onAssign,
  onChangeStatus,
  onChangePriority,
  onCloseTicket,
  onReopenTicket,
  onTransfer,
}: TicketSidePanelProps) {
  const {
    canAssignTickets,
    canCloseTickets,
    canChangePriority,
    canChangeStatus,
  } = usePermissions()

  const allowedTransitionSet = new Set(allowedTransitions)
  const statusActions = allowedTransitions.filter((status) => !['CLOSED', 'REOPENED', 'RESOLVED'].includes(status))

  return (
    <div className="p-4 space-y-3">
      {/* STATUS */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</h3>
        </div>
        <div className="px-4 py-3 space-y-3">
          <div>
            <div className="text-xs text-gray-500 mb-1">Current</div>
            <span className="inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
              {TICKET_STATUS_LABELS[ticket.status]}
            </span>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Allowed next actions</div>
            {canChangeStatus && statusActions.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {statusActions.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => onChangeStatus(status)}
                    className={clsx(
                      'text-xs px-2.5 py-1 rounded-full border transition-colors',
                      'bg-white text-gray-600 border-gray-300 hover:bg-gray-50',
                    )}
                  >
                    {TICKET_STATUS_LABELS[status]}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">No manual status actions available.</p>
            )}
          </div>
        </div>
      </div>

      {/* PRIORITY */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Priority</h3>
        </div>
        <div className="px-4 py-3 flex flex-wrap gap-1.5">
          {PRIORITIES.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => canChangePriority && onChangePriority(p)}
              disabled={!canChangePriority}
              className={clsx(
                'text-xs px-2.5 py-1 rounded-full border transition-colors',
                ticket.priority === p
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50',
                !canChangePriority && 'opacity-50 cursor-not-allowed',
              )}
            >
              {TICKET_PRIORITY_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* SLA */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">SLA</h3>
        </div>
        <div className="px-4 py-3">
          <SLAIndicator
            createdAt={ticket.createdAt}
            slaDeadlineAt={ticket.slaDeadlineAt}
            slaBreached={ticket.slaBreached}
            openDurationMinutes={ticket.openDurationMinutes}
          />
        </div>
      </div>

      {/* OPERATION LOGS / HISTORICAL */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Operation Logs / Historical
          </h3>
        </div>
        <div className="px-4 py-3 space-y-3 max-h-72 overflow-y-auto">
          <TicketActivityTimeline activities={activities} />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-2 pt-1">
        {canAssignTickets && (
          <Button
            variant="secondary"
            size="sm"
            fullWidth
            leftIcon={<Users size={14} />}
            onClick={onAssign}
          >
            {ticket.assignedUserId ? `Reassign (${ticket.assignedUserName})` : 'Assign'}
          </Button>
        )}
        {canCloseTickets && allowedTransitionSet.has('CLOSED') && (
          <Button
            variant="danger"
            size="sm"
            fullWidth
            leftIcon={<XCircle size={14} />}
            onClick={onCloseTicket}
          >
            Close Ticket
          </Button>
        )}
        {canCloseTickets && allowedTransitionSet.has('REOPENED') && (
          <Button
            variant="secondary"
            size="sm"
            fullWidth
            leftIcon={<RotateCcw size={14} />}
            onClick={onReopenTicket}
          >
            Reopen Ticket
          </Button>
        )}
        {canChangeStatus && allowedTransitionSet.has('RESOLVED') && (
          <Button
            variant="secondary"
            size="sm"
            fullWidth
            leftIcon={<CheckCircle size={14} className="text-green-600" />}
            onClick={() => onChangeStatus('RESOLVED')}
          >
            Mark as Resolved
          </Button>
        )}
      </div>
    </div>
  )
}
