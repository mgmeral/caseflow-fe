import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldOff,
  SkipForward,
  Unlock,
  XCircle,
} from 'lucide-react'
import { usePermissions } from '@/hooks/usePermissions'
import { useToast } from '@/hooks/useToast'
import { getErrorMessage } from '@/lib/errors'
import { ingressService, type IngressEvent } from '@/services/ingress.service'
import { useMailboxes } from '@/hooks/useMailboxes'
import type { IngressEventStatus, IngressEventListFilters } from '@/types/api.types'
import { Button } from '@/components/shared/Button'
import { EmptyState } from '@/components/shared/EmptyState'
import { Modal } from '@/components/shared/Modal'
import { SkeletonRow } from '@/components/shared/SkeletonRow'
import { Badge } from '@/components/shared/Badge'

const STATUS_OPTIONS: Array<{ value: IngressEventStatus | ''; label: string }> = [
  { value: '', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'REPROCESSING', label: 'Reprocessing' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'FAILED_RETRYABLE', label: 'Failed (retryable)' },
  { value: 'QUARANTINED', label: 'Quarantined' },
  { value: 'RELEASED', label: 'Released' },
  { value: 'SKIPPED', label: 'Skipped' },
]

const PAGE_SIZE = 20

function statusVariant(status: IngressEventStatus): 'success' | 'error' | 'warning' | 'default' {
  switch (status) {
    case 'COMPLETED': return 'success'
    case 'FAILED':
    case 'FAILED_RETRYABLE': return 'error'
    case 'QUARANTINED': return 'warning'
    case 'PENDING':
    case 'PROCESSING':
    case 'REPROCESSING':
    case 'RELEASED': return 'default'
    default: return 'default'
  }
}

function statusIcon(status: IngressEventStatus) {
  switch (status) {
    case 'COMPLETED': return <CheckCircle2 size={12} />
    case 'FAILED':
    case 'FAILED_RETRYABLE': return <XCircle size={12} />
    case 'QUARANTINED': return <Ban size={12} />
    case 'PENDING': return <Clock size={12} />
    case 'PROCESSING':
    case 'REPROCESSING': return <RefreshCw size={12} className="animate-spin" />
    case 'RELEASED': return <Unlock size={12} />
    case 'SKIPPED': return <SkipForward size={12} />
    default: return null
  }
}

function canRetry(status: IngressEventStatus): boolean {
  return status === 'FAILED' || status === 'FAILED_RETRYABLE' || status === 'QUARANTINED'
}

function canQuarantine(status: IngressEventStatus): boolean {
  return status === 'PENDING' || status === 'FAILED' || status === 'FAILED_RETRYABLE'
}

function canRelease(status: IngressEventStatus): boolean {
  return status === 'QUARANTINED'
}

function formatTimestamp(ts: string | null): string {
  if (!ts) return '—'
  try {
    return new Date(ts).toLocaleString()
  } catch {
    return ts
  }
}

export function IngressEventPage() {
  const { canManageEmailConfig } = usePermissions()
  const { success, error } = useToast()
  const queryClient = useQueryClient()

  const [filters, setFilters] = useState<IngressEventListFilters>({
    page: 0,
    size: PAGE_SIZE,
    status: null,
    mailboxId: null,
  })
  const [search, setSearch] = useState('')
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<IngressEvent | null>(null)

  const queryKey = ['ingressEvents', filters]
  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => ingressService.list(filters),
    placeholderData: (prev) => prev,
  })

  const { data: mailboxListResult } = useMailboxes()
  const mailboxes = mailboxListResult?.items ?? []

  if (!canManageEmailConfig) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<ShieldOff className="w-8 h-8 text-gray-400" />}
          title="Access Denied"
          description="You don't have permission to view ingress events."
        />
      </div>
    )
  }

  const items = data?.items ?? []
  const totalPages = data?.totalPages ?? 1
  const currentPage = data?.page ?? 0
  const totalElements = data?.total ?? 0

  const visibleItems = search.trim()
    ? items.filter((item) => {
        const q = search.trim().toLowerCase()
        return [item.fromAddress, item.toAddress, item.subject, item.messageId, item.mailboxName, item.errorMessage, item.failureReason]
          .some((v) => v?.toLowerCase().includes(q))
      })
    : items

  const performAction = async (
    id: string,
    fn: () => Promise<{ success: boolean; message: string | null }>,
    successLabel: string,
  ) => {
    setActionInProgress(id)
    try {
      const result = await fn()
      if (result.success) {
        success(result.message ?? successLabel)
      } else {
        error(result.message ?? 'Action failed')
      }
      await queryClient.invalidateQueries({ queryKey: ['ingressEvents'] })
    } catch (err) {
      error(getErrorMessage(err))
    } finally {
      setActionInProgress(null)
    }
  }

  return (
    <div className="admin-page-shell">
      <div className="admin-page-header relative z-10">
        <div>
          <h1 className="admin-page-title">Ingress Events</h1>
          <p className="admin-page-subtitle">
            {isLoading ? 'Loading…' : `${totalElements.toLocaleString()} event${totalElements !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<RefreshCw size={14} />}
          onClick={() => queryClient.invalidateQueries({ queryKey: ['ingressEvents'] })}
        >
          Refresh
        </Button>
      </div>

      {/* Filter bar */}
      <div className="admin-panel-soft space-y-3 px-4 py-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Status filter */}
          <select
            className="h-8 rounded-md border border-gray-300 bg-white px-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={filters.status ?? ''}
            onChange={(e) => setFilters((current) => ({ ...current, page: 0, status: e.target.value as IngressEventStatus || null }))}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Mailbox filter */}
          <select
            className="h-8 rounded-md border border-gray-300 bg-white px-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={filters.mailboxId ?? ''}
            onChange={(e) => setFilters((current) => ({ ...current, page: 0, mailboxId: e.target.value || null }))}
          >
            <option value="">All mailboxes</option>
            {mailboxes.map((mb) => (
              <option key={mb.id} value={mb.id}>{mb.name} ({mb.address})</option>
            ))}
          </select>

          {/* Search box (client-side, within current page) */}
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search current page…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-52 rounded-md border border-gray-300 bg-white pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {(filters.status || filters.mailboxId) && (
            <button
              onClick={() => setFilters({ page: 0, size: PAGE_SIZE, status: null, mailboxId: null })}
              className="text-xs text-indigo-600 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="admin-panel overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Mailbox</th>
              <th className="px-4 py-3">From / Subject</th>
              <th className="px-4 py-3">Retries</th>
              <th className="px-4 py-3">Received</th>
              <th className="px-4 py-3">Processed</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && <SkeletonRow colCount={7} />}
            {isError && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-red-600">
                  <AlertTriangle size={16} className="inline mr-1" />
                  Failed to load ingress events.
                </td>
              </tr>
            )}
            {!isLoading && !isError && visibleItems.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                  No events found.
                </td>
              </tr>
            )}
            {visibleItems.map((event) => (
              <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Badge variant={statusVariant(event.status)} className="flex items-center gap-1">
                      {statusIcon(event.status)}
                      {event.status}
                    </Badge>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-700">
                  <div className="font-medium truncate max-w-[140px]">{event.mailboxName ?? '—'}</div>
                  {event.mailboxAddress && (
                    <div className="text-xs text-gray-400 truncate max-w-[140px]">{event.mailboxAddress}</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setSelectedEvent(event)}
                    className="text-left hover:text-indigo-600"
                  >
                    <div className="text-gray-700 truncate max-w-[220px]">{event.fromAddress ?? '—'}</div>
                    {event.subject && (
                      <div className="text-xs text-gray-400 truncate max-w-[220px]">{event.subject}</div>
                    )}
                    {(event.errorMessage || event.failureReason) && (
                      <div className="text-xs text-red-500 truncate max-w-[220px] mt-0.5">
                        {event.errorMessage ?? event.failureReason}
                      </div>
                    )}
                  </button>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {event.maxRetries != null
                    ? `${event.retryCount} / ${event.maxRetries}`
                    : event.retryCount}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                  {formatTimestamp(event.receivedAt ?? event.createdAt)}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                  {formatTimestamp(event.processedAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {canRetry(event.status) && (
                      <button
                        onClick={() => performAction(event.id, () => ingressService.retry(event.id), 'Retry triggered')}
                        disabled={actionInProgress === event.id}
                        title="Retry"
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-indigo-600 disabled:opacity-40"
                      >
                        {actionInProgress === event.id
                          ? <RefreshCw size={14} className="animate-spin" />
                          : <RefreshCw size={14} />}
                      </button>
                    )}
                    {canQuarantine(event.status) && (
                      <button
                        onClick={() => performAction(event.id, () => ingressService.quarantine(event.id), 'Event quarantined')}
                        disabled={actionInProgress === event.id}
                        title="Quarantine"
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-amber-600 disabled:opacity-40"
                      >
                        <Ban size={14} />
                      </button>
                    )}
                    {canRelease(event.status) && (
                      <button
                        onClick={() => performAction(event.id, () => ingressService.release(event.id), 'Event released')}
                        disabled={actionInProgress === event.id}
                        title="Release from quarantine"
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-green-600 disabled:opacity-40"
                      >
                        <Unlock size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedEvent(event)}
                      title="View details"
                      className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-indigo-600"
                    >
                      <Search size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-500">
          <span>Page {currentPage + 1} of {totalPages}</span>
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage === 0}
              onClick={() => setFilters((current) => ({ ...current, page: currentPage - 1 }))}
              className="p-1 rounded hover:bg-gray-200 disabled:opacity-40"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              disabled={currentPage >= totalPages - 1}
              onClick={() => setFilters((current) => ({ ...current, page: currentPage + 1 }))}
              className="p-1 rounded hover:bg-gray-200 disabled:opacity-40"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Event detail modal */}
      <Modal
        isOpen={selectedEvent !== null}
        onClose={() => setSelectedEvent(null)}
        title="Ingress Event Detail"
        size="lg"
        variant="admin"
        footer={(
          <div className="flex items-center justify-between w-full">
            <div className="flex gap-2">
              {selectedEvent && canRetry(selectedEvent.status) && (
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<RefreshCw size={14} />}
                  isLoading={actionInProgress === selectedEvent.id}
                  onClick={() => {
                    if (!selectedEvent) return
                    performAction(selectedEvent.id, () => ingressService.retry(selectedEvent.id), 'Retry triggered')
                    setSelectedEvent(null)
                  }}
                >
                  Retry
                </Button>
              )}
              {selectedEvent && canRelease(selectedEvent.status) && (
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Unlock size={14} />}
                  isLoading={actionInProgress === selectedEvent.id}
                  onClick={() => {
                    if (!selectedEvent) return
                    performAction(selectedEvent.id, () => ingressService.release(selectedEvent.id), 'Event released')
                    setSelectedEvent(null)
                  }}
                >
                  Release
                </Button>
              )}
              {selectedEvent && canQuarantine(selectedEvent.status) && (
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Ban size={14} />}
                  isLoading={actionInProgress === selectedEvent.id}
                  onClick={() => {
                    if (!selectedEvent) return
                    performAction(selectedEvent.id, () => ingressService.quarantine(selectedEvent.id), 'Event quarantined')
                    setSelectedEvent(null)
                  }}
                >
                  Quarantine
                </Button>
              )}
            </div>
            <Button variant="secondary" size="sm" onClick={() => setSelectedEvent(null)}>Close</Button>
          </div>
        )}
      >
        {selectedEvent && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase">Event ID</div>
                <div className="font-mono text-gray-900">{selectedEvent.id}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase">Status</div>
                <div className="flex items-center gap-1 mt-0.5">
                  <Badge variant={statusVariant(selectedEvent.status)} className="flex items-center gap-1">
                    {statusIcon(selectedEvent.status)}
                    {selectedEvent.status}
                  </Badge>
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase">Mailbox</div>
                <div>{selectedEvent.mailboxName ?? '—'}</div>
                {selectedEvent.mailboxAddress && (
                  <div className="text-xs text-gray-400">{selectedEvent.mailboxAddress}</div>
                )}
              </div>
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase">Linked Ticket</div>
                <div>{selectedEvent.ticketId ? `#${selectedEvent.ticketId}` : '—'}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase">From</div>
                <div className="truncate">{selectedEvent.fromAddress ?? '—'}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase">To</div>
                <div className="truncate">{selectedEvent.toAddress ?? '—'}</div>
              </div>
              <div className="col-span-2">
                <div className="text-xs font-medium text-gray-500 uppercase">Subject</div>
                <div>{selectedEvent.subject ?? '—'}</div>
              </div>
              {selectedEvent.messageId && (
                <div className="col-span-2">
                  <div className="text-xs font-medium text-gray-500 uppercase">Message-ID</div>
                  <div className="font-mono text-xs break-all text-gray-600">{selectedEvent.messageId}</div>
                </div>
              )}
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase">Retries</div>
                <div>
                  {selectedEvent.maxRetries != null
                    ? `${selectedEvent.retryCount} / ${selectedEvent.maxRetries}`
                    : selectedEvent.retryCount}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase">Received</div>
                <div>{formatTimestamp(selectedEvent.receivedAt ?? selectedEvent.createdAt)}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase">Processed</div>
                <div>{formatTimestamp(selectedEvent.processedAt)}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase">Last Updated</div>
                <div>{formatTimestamp(selectedEvent.updatedAt)}</div>
              </div>
            </div>

            {(selectedEvent.errorMessage || selectedEvent.failureReason) && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2">
                <div className="text-xs font-medium text-red-700 uppercase mb-1">Error</div>
                {selectedEvent.failureReason && (
                  <div className="text-sm font-medium text-red-800">{selectedEvent.failureReason}</div>
                )}
                {selectedEvent.errorMessage && (
                  <div className="text-xs text-red-700 mt-1 break-all">{selectedEvent.errorMessage}</div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
