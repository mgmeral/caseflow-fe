import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ticket, CheckCircle, Clock, UserX, Hourglass, CheckCircle2 } from 'lucide-react'
import { StatCard } from '@/components/dashboard/StatCard'
import { useAuthStore } from '@/store/auth.store'
import { useDashboardStats } from '@/hooks/useDashboard'
import { PriorityBadge } from '@/components/tickets/PriorityBadge'
import { TicketStatusBadge } from '@/components/tickets/TicketStatusBadge'

type DashboardFilter = 'active' | 'unassigned' | 'waiting' | 'resolved'

export function DashboardPage() {
  const { currentUser } = useAuthStore()
  const navigate = useNavigate()
  const statsQuery = useDashboardStats()

  const stats = statsQuery.data
  const myActionItems = useMemo(() => stats?.myActionRequiredItems ?? [], [stats?.myActionRequiredItems])

  const navigateToTickets = (filter: DashboardFilter) => {
    navigate(`/tickets?dashboardFilter=${filter}`)
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">
            Good day, {currentUser?.fullName.split(' ')[0]}!
          </h1>
          <p className="text-xs text-gray-500">Backend-driven operational snapshot.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard label="Total" value={stats?.totalTickets ?? 0} icon={Ticket} color="indigo" />
        <StatCard
          label="Active"
          value={stats?.activeTickets ?? 0}
          icon={Clock}
          color="amber"
          onClick={() => navigateToTickets('active')}
        />
        <StatCard
          label="Unassigned"
          value={stats?.unassignedTickets ?? 0}
          icon={UserX}
          color="amber"
          onClick={() => navigateToTickets('unassigned')}
        />
        <StatCard
          label="Waiting > 24h"
          value={stats?.waitingOver24h ?? 0}
          icon={Hourglass}
          color="red"
          onClick={() => navigateToTickets('waiting')}
        />
        <StatCard
          label="Resolved"
          value={stats?.resolvedTickets ?? 0}
          icon={CheckCircle}
          color="green"
          onClick={() => navigateToTickets('resolved')}
        />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">My Action Required</h2>
          <span className="text-xs text-gray-400">
            {statsQuery.isLoading ? '...' : stats?.myActionRequired ?? myActionItems.length}
          </span>
        </div>

        {statsQuery.isLoading ? (
          <div className="px-4 py-6 text-center text-xs text-gray-400">Loading operational queue…</div>
        ) : myActionItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <CheckCircle2 className="w-6 h-6 text-green-300 mb-1.5" />
            <p className="text-xs text-gray-400">No tickets currently require your action.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {myActionItems.slice(0, 5).map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => navigate(`/tickets/${ticket.id}`)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-800 truncate font-medium">{ticket.subject}</div>
                  <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-gray-400">
                    <span>{ticket.ticketNo}</span>
                    <span className="text-gray-200">·</span>
                    <span>{ticket.customerName}</span>
                  </div>
                </div>
                <PriorityBadge priority={ticket.priority} />
                <TicketStatusBadge status={ticket.status} />
              </div>
            ))}
            <div className="px-3 py-2">
              <button
                type="button"
                onClick={() => navigate('/tickets')}
                className="text-xs text-indigo-600 hover:text-indigo-800 underline"
              >
                View all tickets →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}