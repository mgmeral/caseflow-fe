import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { TicketStatusBadge } from '@/components/tickets/TicketStatusBadge'
import { PriorityBadge } from '@/components/tickets/PriorityBadge'
import { SkeletonRow } from '@/components/shared/SkeletonRow'
import { Inbox } from 'lucide-react'
import type { Ticket } from '@/types/ticket.types'

interface MyTicketsTableProps {
  tickets: Ticket[]
  isLoading: boolean
}

export function MyTicketsTable({ tickets, isLoading }: MyTicketsTableProps) {
  const navigate = useNavigate()

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">My Open Tickets</h2>
        <span className="text-xs text-gray-400">{!isLoading && `${tickets.length}`}</span>
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
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
          <Inbox className="w-6 h-6 text-gray-300 mb-1.5" />
          <p className="text-xs text-gray-400">No open tickets assigned to you.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="text-left px-3 py-1.5 text-[11px] font-medium text-gray-400 uppercase tracking-wide">Subject</th>
                <th className="text-left px-3 py-1.5 text-[11px] font-medium text-gray-400 uppercase tracking-wide">Status</th>
                <th className="text-left px-3 py-1.5 text-[11px] font-medium text-gray-400 uppercase tracking-wide">Priority</th>
                <th className="text-left px-3 py-1.5 text-[11px] font-medium text-gray-400 uppercase tracking-wide">Updated</th>
              </tr>
            </thead>
            <tbody className="table-body-striped divide-y divide-white/60">
              {tickets.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => navigate(`/tickets/${t.id}`)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-3 py-1.5">
                    <div className="text-sm text-gray-800 font-medium truncate max-w-[240px]">{t.subject}</div>
                    <div className="text-[11px] text-gray-400 font-mono">{t.ticketNo}</div>
                  </td>
                  <td className="px-3 py-1.5">
                    <TicketStatusBadge status={t.status} />
                  </td>
                  <td className="px-3 py-1.5">
                    <PriorityBadge priority={t.priority} />
                  </td>
                  <td className="px-3 py-1.5 text-gray-400 text-xs whitespace-nowrap">
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
