import { format } from 'date-fns'
import { ArrowRightLeft, CheckCircle2, Clock3, FileText, Mail, MailWarning, MessageSquare, PlusCircle, RefreshCcw, UserRoundCog } from 'lucide-react'
import type { TicketActivityItem } from '@/types/ticket.types'

interface TicketActivityTimelineProps {
  activities: TicketActivityItem[]
}

function iconFor(kind: TicketActivityItem['kind']) {
  switch (kind) {
    case 'created':
      return <PlusCircle size={14} className="text-blue-600" />
    case 'status_changed':
      return <RefreshCcw size={14} className="text-indigo-600" />
    case 'assigned':
      return <UserRoundCog size={14} className="text-violet-600" />
    case 'transferred':
      return <ArrowRightLeft size={14} className="text-amber-600" />
    case 'note_added':
      return <FileText size={14} className="text-gray-600" />
    case 'reply_queued':
    case 'reply_sending':
      return <Clock3 size={14} className="text-slate-500" />
    case 'reply_sent':
      return <CheckCircle2 size={14} className="text-emerald-600" />
    case 'reply_failed':
      return <MailWarning size={14} className="text-red-600" />
    case 'customer_reply':
      return <Mail size={14} className="text-emerald-600" />
    case 'template_used':
      return <FileText size={14} className="text-fuchsia-600" />
    default:
      return <MessageSquare size={14} className="text-gray-500" />
  }
}

export function TicketActivityTimeline({ activities }: TicketActivityTimelineProps) {
  if (activities.length === 0) {
    return <p className="text-xs text-gray-400 text-center py-2">No history yet.</p>
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div key={activity.id} className="flex gap-3 border-b border-gray-100 pb-3 last:border-0 last:pb-0">
          <div className="mt-0.5 shrink-0">{iconFor(activity.kind)}</div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium text-gray-800">{activity.summary}</div>
            {activity.detail && <div className="mt-1 text-xs text-gray-500 whitespace-pre-wrap">{activity.detail}</div>}
            <div className="mt-1 text-[11px] text-gray-400">
              {activity.actor ? `${activity.actor} · ` : ''}
              {format(new Date(activity.timestamp), 'MMM d, HH:mm')}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}