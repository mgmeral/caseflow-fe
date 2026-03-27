import { format } from 'date-fns'
import { ArrowRight } from 'lucide-react'
import type { TransferRecord } from '@/types/ticket.types'

interface TransferHistoryPanelProps {
  transfers: TransferRecord[]
}

export function TransferHistoryPanel({ transfers }: TransferHistoryPanelProps) {
  if (transfers.length === 0) return null

  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Transfer History
      </h3>
      <div className="space-y-3">
        {transfers.map((transfer, i) => (
          <div key={transfer.id}>
            {i > 0 && <div className="border-t border-gray-100 mb-3" />}
            <div className="text-sm">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="font-medium text-gray-700">{transfer.fromGroupName}</span>
                <ArrowRight size={12} className="text-gray-400" />
                <span className="font-medium text-gray-700">{transfer.toGroupName}</span>
              </div>
              <p className="text-xs text-gray-600 mb-0.5">"{transfer.reason}"</p>
              {transfer.note && (
                <p className="text-xs text-gray-400 italic mb-0.5">{transfer.note}</p>
              )}
              <p className="text-xs text-gray-400">
                By {transfer.transferredByName} · {format(new Date(transfer.createdAt), 'MMM d, HH:mm')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
