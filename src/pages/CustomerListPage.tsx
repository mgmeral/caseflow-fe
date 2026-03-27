import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCustomers } from '@/hooks/useCustomers'
import { SkeletonRow } from '@/components/shared/SkeletonRow'
import { EmptyState } from '@/components/shared/EmptyState'
import { Badge } from '@/components/shared/Badge'
import { Users, Search } from 'lucide-react'
import { SEGMENT_LABELS } from '@/constants/enums'

export function CustomerListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const { customers, isLoading } = useCustomers()

  const filtered = customers.filter(
    (c) => !search || c.name.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Customers</h1>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <table className="w-full">
            <tbody>
              <SkeletonRow colCount={4} />
              <SkeletonRow colCount={4} />
              <SkeletonRow colCount={4} />
            </tbody>
          </table>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Users className="w-8 h-8 text-gray-400" />}
            title="No customers found"
            description="Try adjusting your search."
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Segment</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Email</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Owner</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Open</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => navigate(`/customers/${c.id}`)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-gray-800">{c.name}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" size="sm">
                      {SEGMENT_LABELS[c.segment]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{c.emails[0] ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{c.assignedAgentName ?? '—'}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{c.openTickets}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
