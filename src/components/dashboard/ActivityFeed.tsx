import { formatDistanceToNow } from 'date-fns'
import { TicketStatusBadge } from '@/components/tickets/TicketStatusBadge'
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
    .slice(0, 10)

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <Activity className="w-4 h-4 text-gray-400" />
        <h2 className="text-sm font-semibold text-gray-700">Recent Activity</h2>
      </div>

      <div className="divide-y divide-gray-50">
        {isLoading ? (
          <>
            <SkeletonRow colCount={2} />
            <SkeletonRow colCount={2} />
            <SkeletonRow colCount={2} />
          </>
        ) : recent.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No recent activity</p>
        ) : (
          recent.map((t) => (
            <div
              key={t.id}
              onClick={() => navigate(`/tickets/${t.id}`)}
              className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <TicketStatusBadge status={t.status} />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-800 truncate font-medium">{t.subject}</div>
                <div className="text-xs text-gray-400">{t.customerName}</div>
              </div>
              <div className="text-xs text-gray-400 flex-shrink-0">
                {formatDistanceToNow(new Date(t.updatedAt), { addSuffix: true })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
