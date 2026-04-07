import { format, isSameDay } from 'date-fns'
import { AlertTriangle, Activity, ArrowRightLeft, BellRing, CalendarClock, CheckCircle2, Clock3, FileText, Mail, MailWarning, MessageSquare, PlusCircle, PlugZap, RefreshCcw, UserRoundCog } from 'lucide-react'
import { clsx } from 'clsx'
import type { TicketActivityItem } from '@/types/ticket.types'

interface TicketActivityTimelineProps {
  activities: TicketActivityItem[]
  isLoading?: boolean
}

type EventCategory = 'system' | 'communication' | 'workflow' | 'integration' | 'error'

function iconMeta(kind: TicketActivityItem['kind']): { icon: React.ReactNode; bg: string; category: EventCategory } {
  switch (kind) {
    case 'created':
      return { icon: <PlusCircle size={12} />, bg: 'bg-blue-50 text-blue-600 ring-blue-100', category: 'system' }
    case 'status_changed':
      return { icon: <RefreshCcw size={12} />, bg: 'bg-indigo-50 text-indigo-600 ring-indigo-100', category: 'workflow' }
    case 'priority_changed':
      return { icon: <RefreshCcw size={12} />, bg: 'bg-amber-50 text-amber-600 ring-amber-100', category: 'workflow' }
    case 'assigned':
      return { icon: <UserRoundCog size={12} />, bg: 'bg-violet-50 text-violet-600 ring-violet-100', category: 'workflow' }
    case 'transferred':
      return { icon: <ArrowRightLeft size={12} />, bg: 'bg-amber-50 text-amber-600 ring-amber-100', category: 'workflow' }
    case 'note_added':
      return { icon: <FileText size={12} />, bg: 'bg-gray-50 text-gray-500 ring-gray-100', category: 'communication' }
    case 'reply_queued':
    case 'reply_sending':
      return { icon: <Clock3 size={12} />, bg: 'bg-gray-50 text-gray-500 ring-gray-100', category: 'communication' }
    case 'reply_sent':
      return { icon: <CheckCircle2 size={12} />, bg: 'bg-emerald-50 text-emerald-600 ring-emerald-100', category: 'communication' }
    case 'reply_failed':
      return { icon: <MailWarning size={12} />, bg: 'bg-red-50 text-red-600 ring-red-100', category: 'error' }
    case 'customer_reply':
      return { icon: <Mail size={12} />, bg: 'bg-emerald-50 text-emerald-600 ring-emerald-100', category: 'communication' }
    case 'template_used':
      return { icon: <FileText size={12} />, bg: 'bg-fuchsia-50 text-fuchsia-600 ring-fuchsia-100', category: 'communication' }
    case 'jira_requested':
    case 'jira_created':
      return { icon: <PlugZap size={12} />, bg: 'bg-sky-50 text-sky-600 ring-sky-100', category: 'integration' }
    case 'jira_failed':
      return { icon: <AlertTriangle size={12} />, bg: 'bg-red-50 text-red-600 ring-red-100', category: 'error' }
    case 'notification_sent':
      return { icon: <BellRing size={12} />, bg: 'bg-emerald-50 text-emerald-600 ring-emerald-100', category: 'system' }
    case 'notification_failed':
      return { icon: <BellRing size={12} />, bg: 'bg-red-50 text-red-600 ring-red-100', category: 'error' }
    case 'scheduled_email_created':
    case 'scheduled_email_canceled':
    case 'scheduled_email_failed':
      return { icon: <CalendarClock size={12} />, bg: 'bg-amber-50 text-amber-600 ring-amber-100', category: 'integration' }
    default:
      return { icon: <MessageSquare size={12} />, bg: 'bg-gray-50 text-gray-500 ring-gray-100', category: 'system' }
  }
}

function DateDivider({ date }: { date: Date }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="flex-1 h-px bg-gray-100" />
      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
        {format(date, 'EEEE, MMM d')}
      </span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  )
}

function TimelineEvent({ activity, isLast }: { activity: TicketActivityItem; isLast: boolean }) {
  const meta = iconMeta(activity.kind)
  const isError = meta.category === 'error'

  return (
    <div className="relative flex gap-3 group">
      {/* Connector line */}
      {!isLast && (
        <div className="absolute left-[13px] top-7 bottom-0 w-px bg-gray-100" />
      )}

      {/* Icon node */}
      <div
        className={clsx(
          'relative z-10 flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full ring-1',
          meta.bg,
        )}
      >
        {meta.icon}
      </div>

      {/* Content */}
      <div
        className={clsx(
          'flex-1 min-w-0 pb-4',
          isLast && 'pb-0',
        )}
      >
        <div
          className={clsx(
            'rounded-lg px-3 py-2',
            isError ? 'bg-red-50/60 border border-red-100' : 'hover:bg-gray-50/80',
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="text-[13px] font-medium text-gray-800 leading-snug">{activity.summary}</div>
            <span className="shrink-0 text-[10px] text-gray-400 pt-0.5 tabular-nums">
              {format(new Date(activity.timestamp), 'HH:mm')}
            </span>
          </div>

          {activity.detail && (
            <div className="mt-1 text-xs text-gray-500 leading-relaxed whitespace-pre-wrap">{activity.detail}</div>
          )}

          {activity.linkUrl ? (
            <a
              href={activity.linkUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1.5 inline-flex text-xs font-medium text-indigo-600 hover:text-indigo-800"
            >
              {activity.linkLabel ?? 'Open link'}
            </a>
          ) : null}

          {activity.actor && (
            <div className="mt-1 text-[11px] text-gray-400">{activity.actor}</div>
          )}
        </div>
      </div>
    </div>
  )
}

export function TicketActivityTimeline({ activities, isLoading = false }: TicketActivityTimelineProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-2 py-8">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-indigo-500" />
        <p className="text-xs text-gray-400">Loading activity…</p>
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="py-8 text-center">
        <Activity size={20} className="mx-auto text-gray-300 mb-2" />
        <p className="text-sm text-gray-400">No activity recorded yet.</p>
      </div>
    )
  }

  return (
    <div>
      {activities.map((activity, idx) => {
        const prev = activities[idx - 1]
        const currentDate = new Date(activity.timestamp)
        const showDateDivider = !prev || !isSameDay(new Date(prev.timestamp), currentDate)

        return (
          <div key={activity.id}>
            {showDateDivider && <DateDivider date={currentDate} />}
            <TimelineEvent activity={activity} isLast={idx === activities.length - 1} />
          </div>
        )
      })}
    </div>
  )
}