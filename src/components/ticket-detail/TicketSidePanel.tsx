import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import type { Ticket, TicketStatus, TicketPriority } from '@/types/ticket.types'
import { SLAIndicator } from './SLAIndicator'
import { usePermissions } from '@/hooks/usePermissions'
import { TICKET_STATUS_LABELS, TICKET_PRIORITY_LABELS } from '@/constants/enums'

const PRIORITIES: TicketPriority[] = ['critical', 'high', 'medium', 'low']

interface TicketSidePanelProps {
  ticket: Ticket
  allowedTransitions: TicketStatus[]
  tagsCard?: ReactNode
  integrationCards?: ReactNode
  onChangeStatus: (status: TicketStatus) => void
  onChangePriority: (priority: TicketPriority) => void
}

export function TicketSidePanel({
  ticket,
  allowedTransitions,
  tagsCard,
  integrationCards,
  onChangeStatus,
  onChangePriority,
}: TicketSidePanelProps) {
  const {
    canChangePriority,
    canChangeStatus,
  } = usePermissions()

  const statusActions = allowedTransitions.filter((status) => !['CLOSED', 'REOPENED', 'RESOLVED'].includes(status))

  return (
    <div className="p-4 space-y-3">
      {/* STATUS & PRIORITY */}
      <div className="rounded-xl bg-white border border-gray-200/60 shadow-soft overflow-hidden">
        <div className="px-4 py-2.5">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Status & Priority</h3>
        </div>
        <div className="px-4 pb-3 space-y-3">
          {/* Status row */}
          <div className="flex items-start gap-3">
            <div className="min-w-0">
              <div className="text-[11px] text-gray-400 mb-1">Current</div>
              <span className="inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                {TICKET_STATUS_LABELS[ticket.status]}
              </span>
            </div>
            {canChangeStatus && statusActions.length > 0 && (
              <div className="min-w-0 flex-1">
                <div className="text-[11px] text-gray-400 mb-1">Transitions</div>
                <div className="flex flex-wrap gap-1">
                  {statusActions.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => onChangeStatus(status)}
                      className="text-xs px-2 py-0.5 rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all"
                    >
                      {TICKET_STATUS_LABELS[status]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* Priority row */}
          <div>
            <div className="text-[11px] text-gray-400 mb-1">Priority</div>
            <div className="flex flex-wrap gap-1">
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => canChangePriority && onChangePriority(p)}
                  disabled={!canChangePriority}
                  className={clsx(
                    'text-xs px-2 py-0.5 rounded-md border transition-all',
                    ticket.priority === p
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300',
                    !canChangePriority && 'opacity-50 cursor-not-allowed',
                  )}
                >
                  {TICKET_PRIORITY_LABELS[p]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {tagsCard}

      {integrationCards}

      {/* SLA */}
      <div className="rounded-xl bg-white border border-gray-200/60 shadow-soft overflow-hidden">
        <div className="px-4 py-2.5">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">SLA</h3>
        </div>
        <div className="px-4 pb-3">
          <SLAIndicator
            createdAt={ticket.createdAt}
            slaDeadlineAt={ticket.slaDeadlineAt}
            slaBreached={ticket.slaBreached}
            openDurationMinutes={ticket.openDurationMinutes}
          />
        </div>
      </div>
    </div>
  )
}
