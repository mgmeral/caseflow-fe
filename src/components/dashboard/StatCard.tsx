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
        'premium-stat-card flex items-center gap-3 px-3.5 py-3 transition-all duration-200',
        onClick && 'cursor-pointer hover:-translate-y-[2px] hover:shadow-elevated',
        active ? `border-transparent ring-2 ${colors.ring}` : 'border-gray-200/60',
      )}
    >
      <div className={clsx('flex-shrink-0 rounded-xl p-2 shadow-soft ring-1 ring-white/70', colors.bg)}>
        <Icon className={clsx('w-4 h-4', colors.icon)} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="premium-stat-kicker">{label}</div>
        <div className="premium-stat-value">{value}</div>
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
