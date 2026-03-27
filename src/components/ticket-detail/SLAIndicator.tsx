import { differenceInMinutes, format } from 'date-fns'
import { Clock, AlertTriangle } from 'lucide-react'
import { clsx } from 'clsx'

interface SLAIndicatorProps {
  createdAt: string
  slaDeadlineAt: string | null
  slaBreached: boolean
  openDurationMinutes: number
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours < 24) return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  const days = Math.floor(hours / 24)
  const remainHours = hours % 24
  return remainHours > 0 ? `${days}d ${remainHours}h` : `${days}d`
}

export function SLAIndicator({ createdAt, slaDeadlineAt, slaBreached, openDurationMinutes }: SLAIndicatorProps) {
  if (slaBreached) {
    const breachedAgo = openDurationMinutes - (slaDeadlineAt
      ? differenceInMinutes(new Date(slaDeadlineAt), new Date(createdAt))
      : 0)

    return (
      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle size={14} className="text-red-500" />
          <span className="text-xs font-semibold text-red-600">SLA Breached</span>
        </div>
        <p className="text-xs text-red-500">
          Open for {formatDuration(openDurationMinutes)}
          {slaDeadlineAt && ` · Deadline was ${format(new Date(slaDeadlineAt), 'MMM d, HH:mm')}`}
        </p>
      </div>
    )
  }

  if (slaDeadlineAt) {
    const remaining = differenceInMinutes(new Date(slaDeadlineAt), new Date())
    const isUrgent = remaining < 120

    return (
      <div className={clsx('p-3 rounded-lg border', isUrgent ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200')}>
        <div className="flex items-center gap-2 mb-1">
          <Clock size={14} className={isUrgent ? 'text-amber-500' : 'text-gray-400'} />
          <span className={clsx('text-xs font-semibold', isUrgent ? 'text-amber-600' : 'text-gray-600')}>
            SLA Deadline
          </span>
        </div>
        <p className={clsx('text-xs', isUrgent ? 'text-amber-600' : 'text-gray-500')}>
          {remaining > 0
            ? `${formatDuration(remaining)} remaining`
            : 'Deadline passed'}
          {' · '}{format(new Date(slaDeadlineAt), 'MMM d, HH:mm')}
        </p>
      </div>
    )
  }

  return (
    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
      <div className="flex items-center gap-2">
        <Clock size={14} className="text-gray-400" />
        <span className="text-xs text-gray-500">Open for {formatDuration(openDurationMinutes)}</span>
      </div>
    </div>
  )
}
