import { Mail, Phone, Tag } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { Ticket } from '@/types/ticket.types'
import { CUSTOMER_SEGMENT_LABELS } from '@/constants/enums'
import { Badge } from '@/components/shared/Badge'

interface CustomerInfoCardProps {
  ticket: Ticket
}

export function CustomerInfoCard({ ticket }: CustomerInfoCardProps) {
  const navigate = useNavigate()

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <button
            type="button"
            onClick={() => navigate(`/customers/${ticket.customerId}`)}
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
          >
            {ticket.customerName}
          </button>
          <div className="mt-1">
            <Badge variant="info" size="sm">
              {CUSTOMER_SEGMENT_LABELS[ticket.customerSegment] ?? ticket.customerSegment}
            </Badge>
          </div>
        </div>
      </div>

      <div className="space-y-1.5 text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <Tag size={13} className="text-gray-400 shrink-0" />
          <span className="text-gray-500">Source:</span>
          <span className="capitalize">{ticket.sourceType}</span>
        </div>

        {ticket.tags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mt-2 pt-2 border-t border-gray-100">
            {ticket.tags.map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded border border-gray-200"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
