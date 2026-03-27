import { Users, CheckCircle, XCircle, RotateCcw, ArrowRight } from 'lucide-react'
import { clsx } from 'clsx'
import { format } from 'date-fns'
import type { Ticket, TicketStatus, TicketPriority, TransferRecord, TicketMessage } from '@/types/ticket.types'
import { SLAIndicator } from './SLAIndicator'
import { Button } from '@/components/shared/Button'
import { usePermissions } from '@/hooks/usePermissions'
import { TICKET_STATUS_LABELS, TICKET_PRIORITY_LABELS } from '@/constants/enums'

const STATUSES: TicketStatus[] = ['new', 'open', 'in_progress', 'pending', 'resolved', 'transferred']
const PRIORITIES: TicketPriority[] = ['critical', 'high', 'medium', 'low']

interface TicketSidePanelProps {
  ticket: Ticket
  transfers: TransferRecord[]
  systemEvents: TicketMessage[]
  onAssign: () => void
  onChangeStatus: (status: TicketStatus) => void
  onChangePriority: (priority: TicketPriority) => void
  onCloseTicket: () => void
  onReopenTicket: () => void
  onTransfer: () => void
}

export function TicketSidePanel({
  ticket,
  transfers,
  systemEvents,
  onAssign,
  onChangeStatus,
  onChangePriority,
  onCloseTicket,
  onReopenTicket,
  onTransfer,
}: TicketSidePanelProps) {
  const { canAssignTickets, canCloseTickets, canChangePriority, canTransferTickets } = usePermissions()

  const hasHistory = transfers.length > 0 || systemEvents.length > 0

  return (
    <div className="p-4 space-y-3">
      {/* STATUS */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</h3>
        </div>
        <div className="px-4 py-3 flex flex-wrap gap-1.5">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChangeStatus(s)}
              className={clsx(
                'text-xs px-2.5 py-1 rounded-full border transition-colors',
                ticket.status === s
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50',
              )}
            >
              {TICKET_STATUS_LABELS[s]}
            </button>
          ))}
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
          {transfers.map((t) => (
            <div key={t.id} className="text-xs border-b border-gray-100 pb-2 last:border-0 last:pb-0">
              <div className="flex items-center gap-1 text-gray-700 font-medium mb-0.5">
                <span>{t.fromGroupName}</span>
                <ArrowRight size={10} className="text-gray-400" />
                <span>{t.toGroupName}</span>
              </div>
              <p className="text-gray-500 mb-0.5">Transfer: &ldquo;{t.reason}&rdquo;</p>
              <p className="text-gray-400">
                {t.transferredByName} · {format(new Date(t.createdAt), 'MMM d, HH:mm')}
              </p>
            </div>
          ))}
          {systemEvents.map((e) => (
            <div key={e.id} className="text-xs text-gray-500 border-b border-gray-100 pb-2 last:border-0 last:pb-0">
              <p>{e.content}</p>
              <p className="text-gray-400 mt-0.5">{format(new Date(e.createdAt), 'MMM d, HH:mm')}</p>
            </div>
          ))}
          {!hasHistory && (
            <p className="text-xs text-gray-400 text-center py-2">No history yet.</p>
          )}
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
        {canCloseTickets && ticket.status !== 'closed' && (
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
        {ticket.status === 'closed' && (
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
        {ticket.status === 'in_progress' && (
          <Button
            variant="secondary"
            size="sm"
            fullWidth
            leftIcon={<CheckCircle size={14} className="text-green-600" />}
            onClick={() => onChangeStatus('resolved')}
          >
            Mark as Resolved
          </Button>
        )}
      </div>
    </div>
  )
}
