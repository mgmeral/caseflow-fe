import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateCustomer, useCustomers } from '@/hooks/useCustomers'
import { SkeletonRow } from '@/components/shared/SkeletonRow'
import { EmptyState } from '@/components/shared/EmptyState'
import { Badge } from '@/components/shared/Badge'
import { Button } from '@/components/shared/Button'
import { Modal } from '@/components/shared/Modal'
import { useToast } from '@/hooks/useToast'
import { Users, Search, Plus, Settings2 } from 'lucide-react'

export function CustomerListPage() {
  const navigate = useNavigate()
  const { success, error: showError } = useToast()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const backendStatusFilter = statusFilter === 'all' ? undefined : statusFilter === 'active'
  const { customers, isLoading, isError, error } = useCustomers(debouncedSearch, backendStatusFilter)
  const createCustomer = useCreateCustomer()

  const filteredCustomers = useMemo(() => {
    let result = customers
    // Fallback client-side guard in case backend ignores isActive
    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active'
      result = result.filter((c) => c.isActive === isActive)
    }
    // Client-side search fallback for code matching (backend may only search by name)
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase()
      result = result.filter(
        (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q),
      )
    }
    return result
  }, [customers, statusFilter, debouncedSearch])

  const normalizedCode = code.trim().toUpperCase()
  const canCreate = name.trim().length >= 2 && normalizedCode.length >= 2

  const handleCreate = async () => {
    if (!canCreate) return
    try {
      const created = await createCustomer.mutateAsync({
        name: name.trim(),
        code: normalizedCode,
      })
      success('Customer created')
      setIsCreateOpen(false)
      setName('')
      setCode('')
      navigate(`/customers/${created.id}`)
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to create customer')
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900">Customers</h1>
        <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => setIsCreateOpen(true)}>
          Create Customer
        </Button>
      </div>

      {/* Search & filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm w-full sm:w-auto sm:min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
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
        ) : isError ? (
          <EmptyState
            icon={<Users className="w-8 h-8 text-gray-400" />}
            title="Could not load customers"
            description={error instanceof Error ? error.message : 'Please try again.'}
            action={{ label: 'Create Customer', onClick: () => setIsCreateOpen(true) }}
          />
        ) : filteredCustomers.length === 0 ? (
          <EmptyState
            icon={<Users className="w-8 h-8 text-gray-400" />}
            title="No customers found"
            description={search || statusFilter !== 'all'
              ? 'Try adjusting your filters, or create a new customer.'
              : 'Create your first customer to start managing routing ownership.'}
            action={{ label: 'Create Customer', onClick: () => setIsCreateOpen(true) }}
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Code</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Status</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredCustomers.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => navigate(`/customers/${c.id}`)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-gray-800">{c.name}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" size="sm">{c.code}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {c.isActive
                      ? <Badge variant="success" size="sm">Active</Badge>
                      : <Badge variant="default" size="sm">Inactive</Badge>}
                  </td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <Button variant="secondary" size="sm" leftIcon={<Settings2 size={12} />} onClick={() => navigate(`/customers/${c.id}`)}>
                      Manage
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Customer"
        size="md"
      >
        <div className="space-y-4 p-1">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Customer Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Akbank"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Customer Code *</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. AKBANK"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <p className="text-xs text-gray-500">
            Customer is the routing owner. After creation, configure sender patterns and email defaults from the customer detail page.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleCreate} isLoading={createCustomer.isPending} disabled={!canCreate}>
              Create
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
