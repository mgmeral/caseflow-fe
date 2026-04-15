import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateCustomer, useCustomers } from '@/hooks/useCustomers'
import { SkeletonRow } from '@/components/shared/SkeletonRow'
import { EmptyState } from '@/components/shared/EmptyState'
import { Badge } from '@/components/shared/Badge'
import { Button } from '@/components/shared/Button'
import { ColorField, normalizeOptionalHexColor } from '@/components/shared/ColorField'
import { Modal } from '@/components/shared/Modal'
import { useToast } from '@/hooks/useToast'
import { Users, Search, Plus, Settings2 } from 'lucide-react'

function CustomerColorDot({ colorHex }: { colorHex: string | null }) {
  return (
    <span
      className="inline-block h-2.5 w-2.5 rounded-full border border-gray-200"
      style={{ backgroundColor: colorHex ?? '#e5e7eb' }}
      aria-hidden="true"
    />
  )
}

export function CustomerListPage() {
  const navigate = useNavigate()
  const { success, error: showError } = useToast()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [colorHex, setColorHex] = useState('')

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const backendStatusFilter = statusFilter === 'all' ? undefined : statusFilter === 'active'
  const { customers, isLoading, isError, error } = useCustomers(debouncedSearch, backendStatusFilter)
  const createCustomer = useCreateCustomer()

  const normalizedCode = code.trim().toUpperCase()
  const normalizedColorHex = normalizeOptionalHexColor(colorHex)
  const isColorValid = !colorHex.trim() || Boolean(normalizedColorHex)
  const canCreate = name.trim().length >= 2 && normalizedCode.length >= 2 && isColorValid

  const closeCreateModal = () => {
    setIsCreateOpen(false)
    setName('')
    setCode('')
    setColorHex('')
  }

  const handleCreate = async () => {
    if (!canCreate) return
    try {
      const created = await createCustomer.mutateAsync({
        name: name.trim(),
        code: normalizedCode,
        colorHex: normalizedColorHex,
      })
      success('Customer created')
      closeCreateModal()
      navigate(`/customers/${created.id}`)
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to create customer')
    }
  }

  return (
    <div className="page-shell">
      <div className="page-header gap-4">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">Routing owners, color identity, and onboarding controls in the same soft visual system.</p>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => setIsCreateOpen(true)}>
          Create Customer
        </Button>
      </div>

      <div className="surface-card flex flex-wrap items-center gap-3 px-4 py-4">
        <div className="relative w-full max-w-sm sm:w-auto sm:min-w-[300px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ui-input ui-input-with-icon"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
          className="ui-select w-auto min-w-[180px]"
        >
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="table-shell">
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
        ) : customers.length === 0 ? (
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
              <tr className="border-b border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.76)_0%,rgba(244,248,255,0.64)_100%)]">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Code</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Status</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Action</th>
              </tr>
            </thead>
            <tbody className="table-body-striped divide-y divide-white/50">
              {customers.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => navigate(`/customers/${c.id}`)}
                  className="cursor-pointer transition-colors hover:bg-white/60"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <CustomerColorDot colorHex={c.colorHex} />
                      <span className="font-medium text-gray-800">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="inline-flex items-center gap-1.5">
                      <Badge variant="outline" size="sm">{c.code}</Badge>
                      {c.colorHex ? <span className="text-[11px] text-gray-400 font-mono">{c.colorHex}</span> : null}
                    </div>
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
        onClose={closeCreateModal}
        title="Create Customer"
        size="md"
      >
        <div className="space-y-4 p-1">
          <div>
            <label className="ui-label normal-case tracking-[0.04em]">Customer Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Akbank"
              className="ui-input"
            />
          </div>
          <div>
            <label className="ui-label normal-case tracking-[0.04em]">Customer Code *</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. AKBANK"
              className="ui-input font-mono uppercase"
            />
          </div>
          <ColorField value={colorHex} onChange={setColorHex} label="Customer Color" />
          <p className="text-xs text-gray-500">
            Customer is the routing owner. After creation, configure sender patterns and email defaults from the customer detail page.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={closeCreateModal}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleCreate} isLoading={createCustomer.isPending} disabled={!canCreate}>
              Create
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
