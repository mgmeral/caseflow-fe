import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useIngressEvents, useIngressEventDetail } from '@/hooks/useIngressEvents'
import { usePermissions } from '@/hooks/usePermissions'
import { useToast } from '@/hooks/useToast'
import { ingressEventService, type IngressEventListFilters } from '@/services/ingressEvent.service'
import { EmptyState } from '@/components/shared/EmptyState'
import { SkeletonRow } from '@/components/shared/SkeletonRow'
import { Button } from '@/components/shared/Button'
import { Badge } from '@/components/shared/Badge'
import { Drawer } from '@/components/shared/Drawer'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import {
  ShieldOff, Search, ChevronLeft, ChevronRight, RefreshCw,
  Mail, ExternalLink, AlertTriangle, ShieldAlert, Play,
} from 'lucide-react'
import { format } from 'date-fns'

type StatusVariant = 'success' | 'error' | 'warning' | 'info' | 'default'

const PROCESSING_STATUSES = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'FAILED_RETRYABLE', 'QUARANTINED']

function processingBadge(status: string): { variant: StatusVariant; label: string } {
  switch (status) {
    case 'PENDING': return { variant: 'default', label: 'Pending' }
    case 'PROCESSING': return { variant: 'info', label: 'Processing' }
    case 'COMPLETED': return { variant: 'success', label: 'Completed' }
    case 'FAILED': return { variant: 'error', label: 'Failed' }
    case 'FAILED_RETRYABLE': return { variant: 'warning', label: 'Failed (Retryable)' }
    case 'QUARANTINED': return { variant: 'warning', label: 'Quarantined' }
    default: return { variant: 'default', label: status }
  }
}

export function IngressEventsPage() {
  const { canViewIngressEvents, canManageIngressEvents } = usePermissions()
  const { success, error } = useToast()
  const queryClient = useQueryClient()

  const [filters, setFilters] = useState<IngressEventListFilters>({ page: 0, size: 20 })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const { data, isLoading } = useIngressEvents({ ...filters, search: search || undefined, processingStatus: statusFilter || undefined })

  const events = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 0
  const currentPage = filters.page ?? 0

  // Detail drawer
  const [selectedId, setSelectedId] = useState('')
  const { data: detail, isLoading: loadingDetail } = useIngressEventDetail(selectedId)

  // Actions
  const [processId, setProcessId] = useState<string | null>(null)
  const [releaseId, setReleaseId] = useState<string | null>(null)
  const [quarantineId, setQuarantineId] = useState<string | null>(null)
  const [quarantineReason, setQuarantineReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  if (!canViewIngressEvents) {
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

  const invalidateEvents = () => {
    queryClient.invalidateQueries({ queryKey: ['ingress-events'] })
    if (selectedId) queryClient.invalidateQueries({ queryKey: ['ingress-event', selectedId] })
  }

  const handleProcess = async (id: string) => {
    setActionLoading(true)
    try {
      await ingressEventService.process(id)
      success('Event queued for processing')
      invalidateEvents()
    } catch (err) {
      error(err instanceof Error ? err.message : 'Process failed')
    } finally {
      setActionLoading(false)
      setProcessId(null)
    }
  }

  const handleRelease = async (id: string) => {
    setActionLoading(true)
    try {
      await ingressEventService.release(id)
      success('Event released from quarantine')
      invalidateEvents()
    } catch (err) {
      error(err instanceof Error ? err.message : 'Release failed')
    } finally {
      setActionLoading(false)
      setReleaseId(null)
    }
  }

  const handleQuarantine = async (id: string) => {
    if (!quarantineReason.trim()) return
    setActionLoading(true)
    try {
      await ingressEventService.quarantine(id, quarantineReason.trim())
      success('Event quarantined')
      invalidateEvents()
    } catch (err) {
      error(err instanceof Error ? err.message : 'Quarantine failed')
    } finally {
      setActionLoading(false)
      setQuarantineId(null)
      setQuarantineReason('')
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Ingress Events</h1>
        <p className="text-sm text-gray-500 mt-0.5">{total} event{total !== 1 ? 's' : ''}</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by message ID, subject, sender…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setFilters((f) => ({ ...f, page: 0 })) }}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setFilters((f) => ({ ...f, page: 0 })) }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="">All statuses</option>
          {PROCESSING_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Mailbox</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Sender</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Subject</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Source</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Received</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Attempts</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Failure</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <>
                  <SkeletonRow colCount={9} />
                  <SkeletonRow colCount={9} />
                  <SkeletonRow colCount={9} />
                </>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12">
                    <EmptyState
                      icon={<Mail className="w-8 h-8 text-gray-400" />}
                      title="No ingress events"
                      description="No email ingress events match your filters."
                    />
                  </td>
                </tr>
              ) : (
                events.map((evt) => {
                  const badge = processingBadge(evt.processingStatus)
                  return (
                    <tr key={evt.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSelectedId(evt.id)}>
                      <td className="px-4 py-3"><Badge variant={badge.variant} size="sm">{badge.label}</Badge></td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{evt.mailboxName ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-700 text-xs truncate max-w-[180px]">{evt.sender ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-700 truncate max-w-[200px]">{evt.subject ?? '—'}</td>
                      <td className="px-4 py-3"><Badge variant="info" size="sm">{evt.sourceType ?? '—'}</Badge></td>
                      <td className="px-4 py-3 text-xs text-gray-500">{format(new Date(evt.receivedAt), 'MMM d, HH:mm')}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{evt.processingAttempts ?? 0}</td>
                      <td className="px-4 py-3 text-xs text-red-500 truncate max-w-[180px]">{evt.failureReason ?? evt.lastError ?? ''}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          {canManageIngressEvents && (evt.processingStatus === 'FAILED' || evt.processingStatus === 'FAILED_RETRYABLE') && (
                            <button onClick={() => setProcessId(evt.id)} className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-indigo-600" title="Retry processing">
                              <RefreshCw size={13} />
                            </button>
                          )}
                          {canManageIngressEvents && evt.processingStatus === 'QUARANTINED' && (
                            <button onClick={() => setReleaseId(evt.id)} className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-green-600" title="Release">
                              <Play size={13} />
                            </button>
                          )}
                          {canManageIngressEvents && evt.processingStatus !== 'COMPLETED' && (
                            <button onClick={() => { setQuarantineId(evt.id); setQuarantineReason('') }} className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-orange-600" title="Quarantine">
                              <ShieldAlert size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-500">
            <span>Page {currentPage + 1} of {totalPages}</span>
            <div className="flex items-center gap-1">
              <button disabled={currentPage === 0} onClick={() => setFilters((f) => ({ ...f, page: currentPage - 1 }))} className="p-1 rounded hover:bg-gray-200 disabled:opacity-40">
                <ChevronLeft size={14} />
              </button>
              <button disabled={currentPage >= totalPages - 1} onClick={() => setFilters((f) => ({ ...f, page: currentPage + 1 }))} className="p-1 rounded hover:bg-gray-200 disabled:opacity-40">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      <Drawer
        isOpen={!!selectedId}
        onClose={() => setSelectedId('')}
        title="Ingress Event Detail"
      >
        {loadingDetail ? (
          <div className="p-4"><SkeletonRow colCount={2} /><SkeletonRow colCount={2} /></div>
        ) : detail ? (
          <div className="space-y-5 text-sm">
            <div className="space-y-3">
              <DetailRow label="ID" value={detail.id} mono />
              <DetailRow label="Status">
                <Badge variant={processingBadge(detail.processingStatus).variant} size="sm">{processingBadge(detail.processingStatus).label}</Badge>
              </DetailRow>
              <DetailRow label="Source Type" value={detail.sourceType ?? '—'} />
              <DetailRow label="Source UID" value={detail.sourceUid ?? '—'} mono />
              <DetailRow label="Internet Message ID" value={detail.internetMessageId ?? '—'} mono />
              <DetailRow label="Subject" value={detail.subject ?? '—'} />
              <DetailRow label="Sender" value={detail.sender ?? '—'} />
              <DetailRow label="Recipients" value={detail.recipients.join(', ') || '—'} />
              {detail.cc.length > 0 && <DetailRow label="CC" value={detail.cc.join(', ')} />}
              <DetailRow label="Mailbox" value={`${detail.mailboxName ?? '—'} (${detail.mailboxEmail ?? '—'})`} />
              <DetailRow label="Received" value={format(new Date(detail.receivedAt), 'yyyy-MM-dd HH:mm:ss')} />
              {detail.processedAt && <DetailRow label="Processed" value={format(new Date(detail.processedAt), 'yyyy-MM-dd HH:mm:ss')} />}
              <DetailRow label="Attempts" value={String(detail.processingAttempts ?? detail.retryCount)} />
              {detail.lastAttemptAt && <DetailRow label="Last Attempt" value={format(new Date(detail.lastAttemptAt), 'yyyy-MM-dd HH:mm:ss')} />}
            </div>

            {(detail.failureReason || detail.lastError) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center gap-1.5 text-red-700 font-medium text-xs mb-1">
                  <AlertTriangle size={12} /> Failure Reason
                </div>
                <p className="text-xs text-red-600">{detail.failureReason ?? detail.lastError}</p>
              </div>
            )}

            {detail.relatedTicketId && (
              <DetailRow label="Related Ticket">
                <a href={`/tickets/${detail.relatedTicketId}`} className="text-indigo-600 hover:underline flex items-center gap-1">
                  {detail.relatedTicketId} <ExternalLink size={10} />
                </a>
              </DetailRow>
            )}

            {detail.payloadExcerpt && (
              <div>
                <div className="text-xs font-medium text-gray-600 mb-1">Payload Excerpt</div>
                <pre className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-700 whitespace-pre-wrap max-h-40 overflow-y-auto">{detail.payloadExcerpt}</pre>
              </div>
            )}

            {Object.keys(detail.rawHeaders).length > 0 && (
              <div>
                <div className="text-xs font-medium text-gray-600 mb-1">Raw Headers</div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs space-y-0.5 max-h-40 overflow-y-auto">
                  {Object.entries(detail.rawHeaders).map(([k, v]) => (
                    <div key={k}><span className="text-gray-500">{k}:</span> <span className="text-gray-700">{v}</span></div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            {canManageIngressEvents && (detail.processingStatus === 'FAILED' || detail.processingStatus === 'FAILED_RETRYABLE') && (
              <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                <Button variant="secondary" size="sm" leftIcon={<RefreshCw size={12} />} onClick={() => setProcessId(detail.id)}>
                  Retry Processing
                </Button>
                <Button variant="secondary" size="sm" leftIcon={<ShieldAlert size={12} />} onClick={() => { setQuarantineId(detail.id); setQuarantineReason('') }}>
                  Quarantine
                </Button>
              </div>
            )}
            {canManageIngressEvents && detail.processingStatus === 'QUARANTINED' && (
              <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                <Button variant="secondary" size="sm" leftIcon={<Play size={12} />} onClick={() => setReleaseId(detail.id)}>
                  Release
                </Button>
              </div>
            )}
          </div>
        ) : (
          <EmptyState
            icon={<Mail className="w-6 h-6 text-gray-400" />}
            title="Not found"
            description="This ingress event could not be loaded."
          />
        )}
      </Drawer>

      {/* Process confirmation */}
      <ConfirmModal
        isOpen={processId !== null}
        onClose={() => setProcessId(null)}
        title="Process Ingress Event"
        message="This will process the ingress event through the routing pipeline. Continue?"
        confirmLabel="Process"
        isLoading={actionLoading}
        onConfirm={() => processId && handleProcess(processId)}
      />

      {/* Release confirmation */}
      <ConfirmModal
        isOpen={releaseId !== null}
        onClose={() => setReleaseId(null)}
        title="Release Quarantined Event"
        message="This will release the event from quarantine and allow it to be processed. Continue?"
        confirmLabel="Release"
        isLoading={actionLoading}
        onConfirm={() => releaseId && handleRelease(releaseId)}
      />

      {/* Quarantine modal */}
      <ConfirmModal
        isOpen={quarantineId !== null}
        onClose={() => { setQuarantineId(null); setQuarantineReason('') }}
        title="Quarantine Ingress Event"
        message=""
        confirmLabel="Quarantine"
        isDestructive
        isLoading={actionLoading}
        onConfirm={() => quarantineId && handleQuarantine(quarantineId)}
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600">This will quarantine the event. Please provide a reason:</p>
          <textarea
            value={quarantineReason}
            onChange={(e) => setQuarantineReason(e.target.value)}
            rows={3}
            placeholder="Reason for quarantine…"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
      </ConfirmModal>
    </div>
  )
}

function DetailRow({ label, value, mono, children }: { label: string; value?: string; mono?: boolean; children?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-gray-500 shrink-0">{label}</span>
      {children ?? <span className={`text-gray-800 text-right ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>}
    </div>
  )
}
