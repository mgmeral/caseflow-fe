import { useEffect, useState, type ReactNode } from 'react'
import type { Ticket, TicketPriority, TicketStatus } from '@/types/ticket.types'
import { TICKET_PRIORITY_LABELS, TICKET_STATUS_LABELS } from '@/constants/enums'
import { usePermissions } from '@/hooks/usePermissions'
import { SLAIndicator } from './SLAIndicator'

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
  const { canChangePriority, canChangeStatus } = usePermissions()
  const [selectedStatusAction, setSelectedStatusAction] = useState('')
  const [selectedPriorityAction, setSelectedPriorityAction] = useState('')

  useEffect(() => {
    setSelectedStatusAction('')
  }, [ticket.status, allowedTransitions])

  useEffect(() => {
    setSelectedPriorityAction('')
  }, [ticket.priority])

  const handleStatusChange = (value: string) => {
    setSelectedStatusAction(value)
    if (!value) return
    onChangeStatus(value as TicketStatus)
    setSelectedStatusAction('')
  }

  const handlePriorityChange = (value: string) => {
    setSelectedPriorityAction(value)
    if (!value) return
    onChangePriority(value as TicketPriority)
    setSelectedPriorityAction('')
  }

  return (
    <div className="p-4 space-y-3">
      <div className="surface-card overflow-hidden">
        <div className="px-4 py-2.5">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Overview</h3>
        </div>

        <div className="px-4 pb-4 space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="ticket-detail-inline-card">
              <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Assignee</div>
              <div className="mt-1 truncate text-sm font-medium text-slate-900">{ticket.assignedUserName ?? 'Unassigned'}</div>
            </div>

            <div className="ticket-detail-inline-card">
              <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Group</div>
              <div className="mt-1 truncate text-sm font-medium text-slate-900">{ticket.groupName || 'No group assigned'}</div>
            </div>

            <div className="ticket-detail-inline-card">
              <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Status</div>
              <div className="mt-1 truncate text-sm font-medium text-slate-900">{TICKET_STATUS_LABELS[ticket.status]}</div>
            </div>

            <div className="ticket-detail-inline-card">
              <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Priority</div>
              <div className="mt-1 truncate text-sm font-medium text-slate-900">{TICKET_PRIORITY_LABELS[ticket.priority]}</div>
            </div>
          </div>

          {(canChangeStatus || canChangePriority) && (
            <div className="grid gap-3 border-t border-gray-100 pt-3 sm:grid-cols-2">
              {canChangeStatus && (
                <label className="block min-w-0">
                  <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-500">Status Action</span>
                  <select
                    aria-label="Status Action"
                    value={selectedStatusAction}
                    onChange={(event) => handleStatusChange(event.target.value)}
                    disabled={allowedTransitions.length === 0}
                    className="ui-select"
                  >
                    <option value="">{allowedTransitions.length > 0 ? 'Select status change' : 'No status changes available'}</option>
                    {allowedTransitions.map((status) => (
                      <option key={status} value={status}>{TICKET_STATUS_LABELS[status]}</option>
                    ))}
                  </select>
                </label>
              )}

              {canChangePriority && (
                <label className="block min-w-0">
                  <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-500">Priority Action</span>
                  <select
                    aria-label="Priority Action"
                    value={selectedPriorityAction}
                    onChange={(event) => handlePriorityChange(event.target.value)}
                    className="ui-select"
                  >
                    <option value="">Select new priority</option>
                    {PRIORITIES.filter((priority) => priority !== ticket.priority).map((priority) => (
                      <option key={priority} value={priority}>{TICKET_PRIORITY_LABELS[priority]}</option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="surface-card overflow-hidden">
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

      {tagsCard}

      {integrationCards}
    </div>
  )
}
