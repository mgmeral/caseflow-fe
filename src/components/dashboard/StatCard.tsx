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
}

const colorMap: Record<NonNullable<StatCardProps['color']>, { bg: string; icon: string }> = {
  indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-600' },
  green: { bg: 'bg-green-50', icon: 'text-green-600' },
  amber: { bg: 'bg-amber-50', icon: 'text-amber-600' },
  red: { bg: 'bg-red-50', icon: 'text-red-600' },
  gray: { bg: 'bg-gray-100', icon: 'text-gray-600' },
}

export function StatCard({ label, value, icon: Icon, trend, color = 'indigo' }: StatCardProps) {
  const colors = colorMap[color]

  return (
    <div className="bg-white rounded-lg border border-gray-200/60 shadow-soft px-3.5 py-2.5 flex items-center gap-3">
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
