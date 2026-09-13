import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ticket, CheckCircle, Clock, UserX, Hourglass, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react'
import { StatCard } from '@/components/dashboard/StatCard'
import { useAuthStore } from '@/store/auth.store'
import { useDashboardStats } from '@/hooks/useDashboard'
import { PriorityBadge } from '@/components/tickets/PriorityBadge'
import { TicketStatusBadge } from '@/components/tickets/TicketStatusBadge'

type DashboardFilter = 'active' | 'unassigned' | 'waiting' | 'resolved' | 'closed' | 'staleOpen24h' | 'slaBreached' | 'slaAtRisk'

export function DashboardPage() {
  const { currentUser } = useAuthStore()
  const navigate = useNavigate()
  const statsQuery = useDashboardStats()

  const stats = statsQuery.data
  const myActionItems = useMemo(() => stats?.myActionRequiredItems ?? [], [stats?.myActionRequiredItems])
  // Roles that orchestrate rather than personally own tickets (Supervisor/Admin) get an
  // operationally-urgent queue here instead of a literal "assigned to me" one, which is
  // almost always empty for them — see DashboardService.getStats on the backend.
  const isOperationalQueue = currentUser?.ticketScope === 'ALL' || currentUser?.ticketScope === 'OWN_GROUPS'
  const actionSectionTitle = isOperationalQueue ? 'Needs Attention' : 'My Action Required'
  const actionSectionEmptyText = isOperationalQueue
    ? 'Nothing urgent — no unassigned or at-risk tickets right now.'
    : 'No tickets currently require your action.'

  const navigateToTickets = (filter: DashboardFilter) => {
    navigate(`/tickets?dashboardFilter=${filter}`)
  }

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Good day, {currentUser?.fullName.split(' ')[0]}!
          </h1>
          <p className="page-subtitle">Backend-driven operational snapshot.</p>
        </div>
      </div>

      <div className="grid grid-cols-4 lg:grid-cols-8 gap-3">
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
          label="Open > 24h"
          value={stats?.waitingOver24h ?? 0}
          icon={Hourglass}
          color="red"
          onClick={() => navigateToTickets('staleOpen24h')}
        />
        <StatCard
          label="Resolved"
          value={stats?.resolvedTickets ?? 0}
          icon={CheckCircle}
          color="green"
          onClick={() => navigateToTickets('resolved')}
        />
        <StatCard
          label="Closed"
          value={stats?.closedTickets ?? 0}
          icon={CheckCircle2}
          color="gray"
          onClick={() => navigateToTickets('closed')}
        />
        {stats?.slaDataAvailable && (
          <StatCard
            label="SLA Breached"
            value={stats.slaBreached}
            icon={ShieldAlert}
            color="red"
            onClick={() => navigateToTickets('slaBreached')}
          />
        )}
        {stats?.slaDataAvailable && (
          <StatCard
            label="At Risk"
            value={stats.atRisk}
            icon={AlertTriangle}
            color="amber"
            onClick={() => navigateToTickets('slaAtRisk')}
          />
        )}
      </div>

      <div className="section-shell">
        <div className="section-header">
          <h2 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">{actionSectionTitle}</h2>
          <span className="text-xs text-gray-400">
            {statsQuery.isLoading ? '...' : stats?.myActionRequired ?? myActionItems.length}
          </span>
        </div>

        {statsQuery.isLoading ? (
          <div className="px-4 py-6 text-center text-xs text-gray-400">Loading operational queue…</div>
        ) : myActionItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <CheckCircle2 className="w-6 h-6 text-green-300 mb-1.5" />
            <p className="text-xs text-gray-400">{actionSectionEmptyText}</p>
          </div>
        ) : (
            <div className="divide-y divide-white/50">
            {myActionItems.slice(0, 5).map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => navigate(`/tickets/${ticket.id}`)}
                  className="flex cursor-pointer items-center gap-2 px-4 py-3 transition-colors hover:bg-[rgba(255,255,255,0.74)]"
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
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
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