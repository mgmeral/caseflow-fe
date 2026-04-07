import { formatDistanceToNow } from 'date-fns'
import { TicketStatusBadge } from '@/components/tickets/TicketStatusBadge'
import { PriorityBadge } from '@/components/tickets/PriorityBadge'
import { useNavigate } from 'react-router-dom'
import type { Ticket } from '@/types/ticket.types'
import { SkeletonRow } from '@/components/shared/SkeletonRow'
import { Activity } from 'lucide-react'

interface ActivityFeedProps {
  tickets: Ticket[]
  isLoading: boolean
}

export function ActivityFeed({ tickets, isLoading }: ActivityFeedProps) {
  const navigate = useNavigate()

  const recent = [...tickets]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 12)

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
        <Activity className="w-3.5 h-3.5 text-gray-400" />
        <h2 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Recent Activity</h2>
      </div>

      <div className="divide-y divide-gray-50">
        {isLoading ? (
          <>
            <SkeletonRow colCount={2} />
            <SkeletonRow colCount={2} />
            <SkeletonRow colCount={2} />
          </>
        ) : recent.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">No recent activity</p>
        ) : (
          recent.map((t) => (
            <div
              key={t.id}
              onClick={() => navigate(`/tickets/${t.id}`)}
              className="flex items-center gap-2.5 px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-gray-800 truncate font-medium">{t.subject}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] text-gray-400">{t.customerName}</span>
                  <span className="text-gray-200">·</span>
                  <span className="text-[11px] text-gray-400">{t.lastActionSummary || 'Updated'}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <PriorityBadge priority={t.priority} />
                <TicketStatusBadge status={t.status} />
              </div>
              <div className="text-[11px] text-gray-400 flex-shrink-0 tabular-nums w-16 text-right">
                {formatDistanceToNow(new Date(t.updatedAt), { addSuffix: true })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
