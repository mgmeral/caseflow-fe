import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ticket, AlertTriangle, CheckCircle, Clock, UserX, Hourglass, ShieldAlert } from 'lucide-react'
import { clsx } from 'clsx'
import { StatCard } from '@/components/dashboard/StatCard'
import { MyTicketsTable } from '@/components/dashboard/MyTicketsTable'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { useAuthStore } from '@/store/auth.store'
import { useTickets } from '@/hooks/useTickets'
import { PriorityBadge } from '@/components/tickets/PriorityBadge'
import { AgingIndicator } from '@/components/tickets/AgingIndicator'
import type { Ticket as TicketType } from '@/types/ticket.types'

const OPEN_STATUSES = ['NEW', 'TRIAGED', 'ASSIGNED', 'IN_PROGRESS', 'REOPENED', 'new', 'open', 'in_progress']

function MiniTicketList({ tickets, emptyText }: { tickets: TicketType[]; emptyText: string }) {
  const navigate = useNavigate()
  if (tickets.length === 0) {
    return <p className="text-xs text-gray-400 text-center py-4">{emptyText}</p>
  }
  return (
    <div className="divide-y divide-gray-50">
      {tickets.slice(0, 5).map((t) => (
        <div
          key={t.id}
          onClick={() => navigate(`/tickets/${t.id}`)}
          className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer transition-colors"
        >
          <div className="flex-1 min-w-0">
            <span className="text-sm text-gray-800 truncate block">{t.subject}</span>
            <span className="text-[11px] text-gray-400">{t.customerName}</span>
          </div>
          <PriorityBadge priority={t.priority} />
          <AgingIndicator openDurationMinutes={t.openDurationMinutes} slaBreached={t.slaBreached} />
        </div>
      ))}
    </div>
  )
}

export function DashboardPage() {
  const { currentUser } = useAuthStore()

  const { data: allData, isLoading } = useTickets({
    filters: {},
    sort: { field: 'updatedAt', direction: 'desc' },
    page: 1,
    pageSize: 100,
  })

  const tickets = allData?.tickets ?? []

  const myTickets = useMemo(
    () => tickets.filter((t) => t.assignedUserId === currentUser?.id && t.status !== 'closed'),
    [tickets, currentUser?.id],
  )

  const stats = useMemo(() => {
    const total = tickets.length
    const open = tickets.filter((t) => OPEN_STATUSES.includes(t.status)).length
    const breached = tickets.filter((t) => t.slaBreached).length
    const resolved = tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'resolved').length
    const unassigned = tickets.filter((t) => !t.assignedUserId && OPEN_STATUSES.includes(t.status)).length
    const waitingLong = tickets.filter((t) => t.status === 'WAITING_CUSTOMER' && t.openDurationMinutes > 1440).length
    return { total, open, breached, resolved, unassigned, waitingLong }
  }, [tickets])

  const needsAttention = useMemo(
    () => tickets.filter((t) => t.slaBreached && OPEN_STATUSES.includes(t.status)).slice(0, 5),
    [tickets],
  )

  const unassignedTickets = useMemo(
    () => tickets.filter((t) => !t.assignedUserId && OPEN_STATUSES.includes(t.status)).slice(0, 5),
    [tickets],
  )

  const waitingTooLong = useMemo(
    () =>
      tickets
        .filter((t) => (t.status === 'WAITING_CUSTOMER' || t.status === 'pending') && t.openDurationMinutes > 1440)
        .sort((a, b) => b.openDurationMinutes - a.openDurationMinutes)
        .slice(0, 5),
    [tickets],
  )

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">
            Good day, {currentUser?.fullName.split(' ')[0]}!
          </h1>
          <p className="text-xs text-gray-500">Here's what's happening today.</p>
        </div>
      </div>

      {/* Stats row - 6 compact cards */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total" value={stats.total} icon={Ticket} color="indigo" />
        <StatCard label="Active" value={stats.open} icon={Clock} color="amber" />
        <StatCard label="SLA Breached" value={stats.breached} icon={AlertTriangle} color="red" />
        <StatCard label="Unassigned" value={stats.unassigned} icon={UserX} color="amber" />
        <StatCard label="Waiting > 24h" value={stats.waitingLong} icon={Hourglass} color="red" />
        <StatCard label="Resolved" value={stats.resolved} icon={CheckCircle} color="green" />
      </div>

      {/* Operational widgets row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {([
          { title: 'Needs Attention', icon: ShieldAlert, color: 'text-red-500', items: needsAttention, emptyText: 'No SLA breaches — looking good.' },
          { title: 'Unassigned', icon: UserX, color: 'text-amber-500', items: unassignedTickets, emptyText: 'All tickets are assigned.' },
          { title: 'Waiting Too Long', icon: Hourglass, color: 'text-orange-500', items: waitingTooLong, emptyText: 'No tickets waiting over 24 hours.' },
        ] as const).map((widget) => (
          <div key={widget.title} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-1.5">
              <widget.icon className={clsx('w-3.5 h-3.5', widget.color)} />
              <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">{widget.title}</h3>
              {widget.items.length > 0 && (
                <span className="ml-auto text-[11px] font-medium text-gray-400">{widget.items.length}</span>
              )}
            </div>
            <MiniTicketList tickets={widget.items} emptyText={widget.emptyText} />
          </div>
        ))}
      </div>

      {/* My tickets + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <MyTicketsTable tickets={myTickets} isLoading={isLoading} />
        <ActivityFeed tickets={tickets} isLoading={isLoading} />
      </div>
    </div>
  )
}
