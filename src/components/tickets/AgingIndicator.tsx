import { differenceInMinutes } from 'date-fns'
import { clsx } from 'clsx'

interface AgingIndicatorProps {
  openDurationMinutes: number
  slaBreached: boolean
  slaDeadlineAt?: string | null
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

function getColorClass(minutes: number, slaBreached: boolean): string {
  if (slaBreached) return 'text-red-600 font-semibold'
  if (minutes < 240) return 'text-green-600'
  if (minutes < 480) return 'text-yellow-600'
  if (minutes < 1440) return 'text-orange-600'
  return 'text-red-600 font-semibold'
}

export function AgingIndicator({ openDurationMinutes, slaBreached, slaDeadlineAt }: AgingIndicatorProps) {
  const minutesRemaining = slaDeadlineAt && !slaBreached
    ? differenceInMinutes(new Date(slaDeadlineAt), new Date())
    : null
  const isAtRisk = minutesRemaining !== null && minutesRemaining > 0 && minutesRemaining < 120

  return (
    <span className={clsx('flex items-center gap-1 text-xs whitespace-nowrap', getColorClass(openDurationMinutes, slaBreached))}>
      {formatDuration(openDurationMinutes)}
      {slaBreached && (
        <span className="px-1 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded border border-red-200 leading-none">
          SLA
        </span>
      )}
      {isAtRisk && !slaBreached && (
        <span className="px-1 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded border border-amber-200 leading-none">
          AT RISK
        </span>
      )}
    </span>
  )
}
