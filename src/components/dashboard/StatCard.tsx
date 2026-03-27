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
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
      <div className={clsx('p-3 rounded-lg flex-shrink-0', colors.bg)}>
        <Icon className={clsx('w-5 h-5', colors.icon)} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-sm text-gray-500 truncate">{label}</div>
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
