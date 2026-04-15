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
    case 'QUEUED':
      return 'warning'
    case 'SENDING':
    case 'PROCESSING':
    case 'DISPATCHED':
      return 'info'
    case 'SENT':
    case 'DELIVERED':
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
    pending: items.filter((item) => !['SENT', 'DELIVERED', 'FAILED', 'PERMANENTLY_FAILED', 'CANCELED'].includes(item.status ?? '')),
    history: items.filter((item) => ['SENT', 'DELIVERED', 'FAILED', 'PERMANENTLY_FAILED', 'CANCELED'].includes(item.status ?? '')),
  }
}

function formatOperationalTimestamp(value: string | null | undefined): string {
  return value ? new Date(value).toLocaleString() : '—'
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
          <div className="mt-1 text-xs text-gray-500 truncate">Recipient {item.resolvedRecipient ?? item.toAddress}</div>
          <div className="mt-1 text-xs text-gray-500 truncate">Mailbox {item.mailboxName ?? 'Unknown mailbox'}{item.mailboxAddress ? ` (${item.mailboxAddress})` : ''}</div>
          <div className="mt-1 text-xs text-gray-500 truncate">From {item.fromAddress ?? item.mailboxAddress ?? 'Backend-managed sender'}</div>
        </div>
        <Badge variant={statusVariant(item.status ?? 'CANCELED')}>{item.status ?? 'UNKNOWN'}</Badge>
      </div>
      <div className="mt-3 grid gap-1 text-xs text-gray-500 md:grid-cols-2">
        <div>Created {formatOperationalTimestamp(item.createdAt)}</div>
        <div>Send not before {formatOperationalTimestamp(item.sendNotBefore)}</div>
        <div>Sent at {formatOperationalTimestamp(item.sentAt)}</div>
        <div>Canceled at {formatOperationalTimestamp(item.canceledAt)}</div>
      </div>
      {(item.failureReason || item.failureCategory) ? (
        <div className="mt-2 rounded-md border border-red-200 bg-red-50 px-2.5 py-2 text-xs text-red-800">
          <div>Failure reason: {item.failureReason ?? 'Unavailable'}</div>
          <div>Failure category: {item.failureCategory ?? 'Unavailable'}</div>
        </div>
      ) : null}
      {(item.status === 'PENDING' || item.status === 'QUEUED') ? (
        <div className="mt-3">
          <Button variant="secondary" size="sm" leftIcon={<MailX size={13} />} onClick={() => onCancel(Number(item.id))} isLoading={canceling}>
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
      <div className="rounded-xl bg-white border border-gray-200/60 shadow-soft overflow-hidden">
        <div className="px-4 py-2.5">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Scheduled Emails</h3>
        </div>
        <div className="px-4 pb-3 text-xs text-gray-400">Unavailable — no public ticket identifier.</div>
      </div>
    )
  }

  const items = scheduledEmailsQuery.data ?? []
  const { pending, history } = splitScheduledEmails(items)

  return (
    <div className="rounded-xl bg-white border border-gray-200/60 shadow-soft overflow-hidden">
      <div className="px-4 py-2.5 flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Scheduled Emails</h3>
        <Badge variant={ticketStatus === 'CLOSED' ? 'default' : 'outline'}>{ticketStatus === 'CLOSED' ? 'Closed' : 'Active'}</Badge>
      </div>
      <div className="px-4 pb-3 space-y-2.5 text-sm">
        {scheduledEmailsQuery.isLoading ? <div className="text-xs text-gray-500">Loading scheduled emails...</div> : null}
        {scheduledEmailsQuery.isError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-700">
            {getErrorMessage(scheduledEmailsQuery.error, 'Failed to load scheduled emails.')}
          </div>
        ) : null}
        {!scheduledEmailsQuery.isLoading && !scheduledEmailsQuery.isError && items.length === 0 ? (
          <div className="text-xs text-gray-400">No scheduled emails yet.</div>
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

        <div className="rounded-md border border-blue-100 bg-blue-50/60 px-3 py-2 text-[11px] text-blue-800">
          Schedules are created from the real threaded reply composer and use backend-resolved mailbox and recipient routing.
        </div>
      </div>
    </div>
  )
}