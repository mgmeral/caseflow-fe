import { useParams, useNavigate } from 'react-router-dom'
import { useCustomerDetail, useCustomerTickets } from '@/hooks/useCustomers'
import { TicketStatusBadge } from '@/components/tickets/TicketStatusBadge'
import { PriorityBadge } from '@/components/tickets/PriorityBadge'
import { Badge } from '@/components/shared/Badge'
import { SkeletonRow } from '@/components/shared/SkeletonRow'
import { EmptyState } from '@/components/shared/EmptyState'
import { ArrowLeft, Ticket, Phone, Mail, User } from 'lucide-react'
import { format } from 'date-fns'
import { SEGMENT_LABELS } from '@/constants/enums'

export function CustomerDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { customer, isLoading } = useCustomerDetail(id)
  const { tickets, isLoading: ticketsLoading } = useCustomerTickets(id)

  if (isLoading) {
    return (
      <div className="p-6">
        <table className="w-full">
          <tbody>
            <SkeletonRow colCount={3} />
          </tbody>
        </table>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="p-6">
        <EmptyState title="Customer not found" description="This customer doesn't exist." />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <button
        onClick={() => navigate('/customers')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft size={14} />
        Back to Customers
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-gray-900">{customer.name}</h1>
              <Badge variant="outline" size="sm">{SEGMENT_LABELS[customer.segment]}</Badge>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <span>{customer.openTickets} open / {customer.totalTickets} total tickets</span>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-2 text-sm">
          {customer.emails.length > 0 && (
            <div className="flex items-center gap-2 text-gray-600">
              <Mail size={14} className="text-gray-400" />
              {customer.emails.join(', ')}
            </div>
          )}
          {customer.phone && (
            <div className="flex items-center gap-2 text-gray-600">
              <Phone size={14} className="text-gray-400" />
              {customer.phone}
            </div>
          )}
          {customer.assignedAgentName && (
            <div className="flex items-center gap-2 text-gray-600">
              <User size={14} className="text-gray-400" />
              Account Owner: {customer.assignedAgentName}
            </div>
          )}
          {customer.notes && (
            <div className="text-gray-500 text-xs italic mt-2">{customer.notes}</div>
          )}
        </div>
      </div>

      {/* Tickets */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Tickets</h2>
        </div>

        {ticketsLoading ? (
          <table className="w-full">
            <tbody>
              <SkeletonRow colCount={5} />
            </tbody>
          </table>
        ) : tickets.length === 0 ? (
          <EmptyState
            icon={<Ticket className="w-8 h-8 text-gray-400" />}
            title="No tickets"
            description="No tickets found for this customer."
          />
        ) : (
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
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-400">{t.ticketNo}</td>
                  <td className="px-4 py-2.5 font-medium text-gray-800 truncate max-w-xs">{t.subject}</td>
                  <td className="px-4 py-2.5"><TicketStatusBadge status={t.status} /></td>
                  <td className="px-4 py-2.5"><PriorityBadge priority={t.priority} /></td>
                  <td className="px-4 py-2.5 text-gray-400 text-xs">{format(new Date(t.updatedAt), 'dd MMM, HH:mm')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
