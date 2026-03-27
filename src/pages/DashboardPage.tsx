import { useMemo } from 'react'
import { Ticket, Users, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { StatCard } from '@/components/dashboard/StatCard'
import { MyTicketsTable } from '@/components/dashboard/MyTicketsTable'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { useAuthStore } from '@/store/auth.store'
import { useTickets } from '@/hooks/useTickets'

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
    const open = tickets.filter((t) => ['new', 'open', 'in_progress'].includes(t.status)).length
    const breached = tickets.filter((t) => t.slaBreached).length
    const resolved = tickets.filter((t) => t.status === 'resolved').length
    const pending = tickets.filter((t) => t.status === 'pending').length
    return { total, open, breached, resolved, pending }
  }, [tickets])

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          Good day, {currentUser?.fullName.split(' ')[0]}!
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Here's what's happening today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Tickets"
          value={stats.total}
          icon={Ticket}
          color="indigo"
        />
        <StatCard
          label="Active"
          value={stats.open}
          icon={Clock}
          color="amber"
        />
        <StatCard
          label="SLA Breached"
          value={stats.breached}
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          label="Resolved"
          value={stats.resolved}
          icon={CheckCircle}
          color="green"
        />
      </div>

      {/* My tickets + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MyTicketsTable tickets={myTickets} isLoading={isLoading} />
        <ActivityFeed tickets={tickets} isLoading={isLoading} />
      </div>
    </div>
  )
}
