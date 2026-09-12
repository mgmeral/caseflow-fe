import { differenceInMinutes, format } from 'date-fns'
import { Clock, AlertTriangle, ShieldAlert, ShieldCheck } from 'lucide-react'
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
    const deadlineMinutes = slaDeadlineAt
      ? differenceInMinutes(new Date(slaDeadlineAt), new Date(createdAt))
      : null
    const overdueMins = deadlineMinutes != null ? openDurationMinutes - deadlineMinutes : null

    return (
      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2 mb-1">
          <ShieldAlert size={14} className="text-red-500" />
          <span className="text-xs font-semibold text-red-600">SLA Breached</span>
          {overdueMins != null && overdueMins > 0 && (
            <span className="ml-auto text-[10px] font-semibold text-red-500 bg-red-100 border border-red-200 px-1.5 py-0.5 rounded-full">
              +{formatDuration(overdueMins)} over
            </span>
          )}
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
    const isAtRisk = remaining >= 0 && remaining < 120
    const isOverdue = remaining < 0

    if (isAtRisk) {
      return (
        <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={14} className="text-amber-500" />
            <span className="text-xs font-semibold text-amber-700">
              At Risk — {formatDuration(remaining)} remaining
            </span>
          </div>
          <p className="text-xs text-amber-600">
            Deadline: {format(new Date(slaDeadlineAt), 'MMM d, HH:mm')}
          </p>
        </div>
      )
    }

    if (isOverdue) {
      return (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert size={14} className="text-red-500" />
            <span className="text-xs font-semibold text-red-600">SLA Deadline Passed</span>
          </div>
          <p className="text-xs text-red-500">
            Deadline was {format(new Date(slaDeadlineAt), 'MMM d, HH:mm')}
          </p>
        </div>
      )
    }

    return (
      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck size={14} className="text-green-500" />
          <span className="text-xs font-semibold text-gray-600">SLA On Track</span>
        </div>
        <p className="text-xs text-gray-500">
          {formatDuration(remaining)} remaining · {format(new Date(slaDeadlineAt), 'MMM d, HH:mm')}
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
