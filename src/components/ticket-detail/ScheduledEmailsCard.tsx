import { CalendarClock, MailX } from 'lucide-react'
import { Badge } from '@/components/shared/Badge'
import { Button } from '@/components/shared/Button'
import { useCancelScheduledEmail, useScheduledEmails } from '@/hooks/useIntegrations'
import { usePermissions } from '@/hooks/usePermissions'
import { getErrorMessage } from '@/lib/errors'
import type { DispatchStatus, ScheduledEmailResponse } from '@/types/integration.types'

interface ScheduledEmailsCardProps {
  ticketPublicId: string | null
  ticketStatus: string
}

function statusVariant(status: DispatchStatus): 'warning' | 'info' | 'success' | 'error' | 'default' {
  switch (status) {
    case 'PENDING':
      return 'warning'
    case 'SENDING':
      return 'info'
    case 'SENT':
      return 'success'
    case 'FAILED':
    case 'PERMANENTLY_FAILED':
      return 'error'
    case 'CANCELED':
      return 'default'
    default:
      return 'default'
  }
}

function splitScheduledEmails(items: ScheduledEmailResponse[]) {
  return {
    pending: items.filter((item) => item.status === 'PENDING'),
    history: items.filter((item) => item.status !== 'PENDING'),
  }
}

function ScheduledEmailRow({
  item,
  onCancel,
  canceling,
}: {
  item: ScheduledEmailResponse
  onCancel: (dispatchId: number) => void
  canceling: boolean
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-medium text-gray-800 truncate">{item.subject}</div>
          <div className="mt-1 text-xs text-gray-500 truncate">To {item.toAddress}</div>
          <div className="mt-1 text-xs text-gray-500">Send not before {new Date(item.sendNotBefore).toLocaleString()}</div>
        </div>
        <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
      </div>
      {(item.sentAt || item.canceledAt) ? (
        <div className="mt-2 text-xs text-gray-500">
          {item.sentAt ? `Sent ${new Date(item.sentAt).toLocaleString()}` : null}
          {item.canceledAt ? `Canceled ${new Date(item.canceledAt).toLocaleString()}` : null}
        </div>
      ) : null}
      {item.status === 'PENDING' ? (
        <div className="mt-3">
          <Button variant="secondary" size="sm" leftIcon={<MailX size={13} />} onClick={() => onCancel(item.id)} isLoading={canceling}>
            Cancel Schedule
          </Button>
        </div>
      ) : null}
    </div>
  )
}

export function ScheduledEmailsCard({ ticketPublicId, ticketStatus }: ScheduledEmailsCardProps) {
  const { canManageScheduledEmail } = usePermissions()
  const scheduledEmailsQuery = useScheduledEmails(ticketPublicId ?? '', canManageScheduledEmail && !!ticketPublicId)
  const cancelMutation = useCancelScheduledEmail(ticketPublicId ?? '')

  if (!canManageScheduledEmail) {
    return null
  }

  if (!ticketPublicId) {
    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Scheduled Emails</h3>
        </div>
        <div className="px-4 py-3 text-xs text-gray-400">Scheduled emails are unavailable until the backend returns a public ticket identifier.</div>
      </div>
    )
  }

  const items = scheduledEmailsQuery.data ?? []
  const { pending, history } = splitScheduledEmails(items)

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Scheduled Emails</h3>
        <Badge variant={ticketStatus === 'CLOSED' ? 'default' : 'outline'}>{ticketStatus === 'CLOSED' ? 'Ticket Closed' : 'Active Ticket'}</Badge>
      </div>
      <div className="px-4 py-3 space-y-3 text-sm">
        {scheduledEmailsQuery.isLoading ? <div className="text-xs text-gray-500">Loading scheduled emails...</div> : null}
        {scheduledEmailsQuery.isError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-700">
            {getErrorMessage(scheduledEmailsQuery.error, 'Failed to load scheduled emails.')}
          </div>
        ) : null}
        {!scheduledEmailsQuery.isLoading && !scheduledEmailsQuery.isError && items.length === 0 ? (
          <div className="text-xs text-gray-500">No scheduled emails for this ticket yet. Use the reply composer to schedule one.</div>
        ) : null}

        {pending.length > 0 ? (
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Upcoming</div>
            {pending.map((item) => (
              <ScheduledEmailRow
                key={item.id}
                item={item}
                onCancel={(dispatchId) => cancelMutation.mutate(dispatchId)}
                canceling={cancelMutation.isPending}
              />
            ))}
          </div>
        ) : null}

        {history.length > 0 ? (
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">History</div>
            {history.map((item) => (
              <ScheduledEmailRow
                key={item.id}
                item={item}
                onCancel={(dispatchId) => cancelMutation.mutate(dispatchId)}
                canceling={cancelMutation.isPending}
              />
            ))}
          </div>
        ) : null}

        <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-900">
          Scheduled send creation happens in the reply composer. A successful schedule request only means the dispatch was stored, not that the email has already been sent.
        </div>
      </div>
    </div>
  )
}