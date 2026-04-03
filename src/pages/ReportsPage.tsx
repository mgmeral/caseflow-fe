import { useTickets } from '@/hooks/useTickets'
import { usePermissions } from '@/hooks/usePermissions'
import { EmptyState } from '@/components/shared/EmptyState'
import { StatCard } from '@/components/dashboard/StatCard'
import { SkeletonRow } from '@/components/shared/SkeletonRow'
import { Ticket, AlertTriangle, CheckCircle, Clock, BarChart2, ShieldOff } from 'lucide-react'
import { useMemo } from 'react'
import { useUsers } from '@/hooks/useUsers'
import { Avatar } from '@/components/shared/Avatar'

export function ReportsPage() {
  const { canViewReports } = usePermissions()
  const { data, isLoading } = useTickets({
    filters: {},
    sort: { field: 'createdAt', direction: 'desc' },
    page: 1,
    pageSize: 500,
  })
  const { users } = useUsers()

  const tickets = data?.tickets ?? []

  const stats = useMemo(() => {
    return {
      total: tickets.length,
      open: tickets.filter((t) => ['NEW', 'TRIAGED', 'ASSIGNED', 'IN_PROGRESS', 'REOPENED', 'new', 'open', 'in_progress'].includes(t.status)).length,
      resolved: tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'resolved').length,
      closed: tickets.filter((t) => t.status === 'CLOSED' || t.status === 'closed').length,
      breached: tickets.filter((t) => t.slaBreached).length,
      pending: tickets.filter((t) => t.status === 'WAITING_CUSTOMER' || t.status === 'pending').length,
    }
  }, [tickets])

  const agentStats = useMemo(() => {
    return users
      .filter((u) => u.isActive && u.permissionCodes.includes('REPLY_PUBLIC'))
      .map((u) => ({
        user: u,
        total: tickets.filter((t) => t.assignedUserId === u.id).length,
        open: tickets.filter((t) => t.assignedUserId === u.id && ['NEW', 'TRIAGED', 'ASSIGNED', 'IN_PROGRESS', 'REOPENED', 'new', 'open', 'in_progress'].includes(t.status)).length,
        resolved: tickets.filter((t) => t.assignedUserId === u.id && (t.status === 'RESOLVED' || t.status === 'resolved')).length,
      }))
      .sort((a, b) => b.total - a.total)
  }, [tickets, users])

  if (!canViewReports) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<ShieldOff className="w-8 h-8 text-gray-400" />}
          title="Access Denied"
          description="You don't have permission to view reports."
        />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Reports</h1>

      {/* Overall stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Tickets" value={stats.total} icon={Ticket} color="indigo" />
        <StatCard label="Open / Active" value={stats.open} icon={Clock} color="amber" />
        <StatCard label="Resolved" value={stats.resolved} icon={CheckCircle} color="green" />
        <StatCard label="SLA Breached" value={stats.breached} icon={AlertTriangle} color="red" />
      </div>

      {/* Agent performance */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-700">Agent Performance</h2>
        </div>

        {isLoading ? (
          <table className="w-full">
            <tbody>
              <SkeletonRow colCount={4} />
              <SkeletonRow colCount={4} />
              <SkeletonRow colCount={4} />
            </tbody>
          </table>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Agent</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Total</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Open</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Resolved</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {agentStats.map(({ user, total, open: openCount, resolved }) => (
                <tr key={user.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={user.fullName} color={user.avatarColor} size="sm" />
                      <div>
                        <div className="text-sm font-medium text-gray-800">{user.fullName}</div>
                        <div className="text-xs text-gray-400">{user.groupNames.join(', ')}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700 font-medium">{total}</td>
                  <td className="px-4 py-3 text-right text-amber-600">{openCount}</td>
                  <td className="px-4 py-3 text-right text-green-600">{resolved}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
