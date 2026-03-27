import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { TicketStatusBadge } from '@/components/tickets/TicketStatusBadge'
import { PriorityBadge } from '@/components/tickets/PriorityBadge'
import { SkeletonRow } from '@/components/shared/SkeletonRow'
import { EmptyState } from '@/components/shared/EmptyState'
import { Inbox } from 'lucide-react'
import type { Ticket } from '@/types/ticket.types'

interface MyTicketsTableProps {
  tickets: Ticket[]
  isLoading: boolean
}

export function MyTicketsTable({ tickets, isLoading }: MyTicketsTableProps) {
  const navigate = useNavigate()

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-700">My Open Tickets</h2>
      </div>

      {isLoading ? (
        <table className="w-full">
          <tbody>
            <SkeletonRow colCount={4} />
            <SkeletonRow colCount={4} />
            <SkeletonRow colCount={4} />
          </tbody>
        </table>
      ) : tickets.length === 0 ? (
        <EmptyState
          icon={<Inbox className="w-8 h-8 text-gray-400" />}
          title="No open tickets"
          description="You have no tickets assigned to you."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">#</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Subject</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Priority</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tickets.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => navigate(`/tickets/${t.id}`)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-2.5 text-gray-400 font-mono text-xs">{t.ticketNo}</td>
                  <td className="px-4 py-2.5 text-gray-800 font-medium truncate max-w-xs">
                    {t.subject}
                  </td>
                  <td className="px-4 py-2.5">
                    <TicketStatusBadge status={t.status} />
                  </td>
                  <td className="px-4 py-2.5">
                    <PriorityBadge priority={t.priority} />
                  </td>
                  <td className="px-4 py-2.5 text-gray-400 text-xs whitespace-nowrap">
                    {format(new Date(t.updatedAt), 'dd MMM, HH:mm')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
