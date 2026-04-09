import { clsx } from 'clsx'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: string
    positive: boolean
  }
  color?: 'indigo' | 'green' | 'amber' | 'red' | 'gray'
  active?: boolean
  onClick?: () => void
}

const colorMap: Record<NonNullable<StatCardProps['color']>, { bg: string; icon: string; ring: string }> = {
  indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-600', ring: 'ring-indigo-400' },
  green: { bg: 'bg-green-50', icon: 'text-green-600', ring: 'ring-green-400' },
  amber: { bg: 'bg-amber-50', icon: 'text-amber-600', ring: 'ring-amber-400' },
  red: { bg: 'bg-red-50', icon: 'text-red-600', ring: 'ring-red-400' },
  gray: { bg: 'bg-gray-100', icon: 'text-gray-600', ring: 'ring-gray-400' },
}

export function StatCard({ label, value, icon: Icon, trend, color = 'indigo', active, onClick }: StatCardProps) {
  const colors = colorMap[color]

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } } : undefined}
      className={clsx(
        'bg-white rounded-lg border shadow-soft px-3.5 py-2.5 flex items-center gap-3 transition-all',
        onClick && 'cursor-pointer hover:shadow-md',
        active ? `border-transparent ring-2 ${colors.ring}` : 'border-gray-200/60',
      )}
    >
      <div className={clsx('p-2 rounded-lg flex-shrink-0', colors.bg)}>
        <Icon className={clsx('w-4 h-4', colors.icon)} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-xs text-gray-500 truncate">{label}</div>
        <div className="text-lg font-bold text-gray-900 leading-tight">{value}</div>
      </div>

      {trend && (
        <div
          className={clsx(
            'text-xs font-medium flex-shrink-0',
            trend.positive ? 'text-green-600' : 'text-red-600',
          )}
        >
          {trend.value}
        </div>
      )}
    </div>
  )
}
