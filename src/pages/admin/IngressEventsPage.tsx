import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useIngressEvents, useIngressEventDetail } from '@/hooks/useIngressEvents'
import { usePermissions } from '@/hooks/usePermissions'
import { useToast } from '@/hooks/useToast'
import { ingressEventService, type IngressEventListFilters } from '@/services/ingressEvent.service'
import type { IngressEventDetail } from '@/types/email.types'
import { EmptyState } from '@/components/shared/EmptyState'
import { SkeletonRow } from '@/components/shared/SkeletonRow'
import { Button } from '@/components/shared/Button'
import { Badge } from '@/components/shared/Badge'
import { Drawer } from '@/components/shared/Drawer'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import {
  ShieldOff, Search, ChevronLeft, ChevronRight, RefreshCw, ShieldAlert,
  Unlock, Mail, ExternalLink, AlertTriangle,
} from 'lucide-react'
import { format } from 'date-fns'

type StatusVariant = 'success' | 'error' | 'warning' | 'info' | 'default'

function statusBadge(status: string): { variant: StatusVariant; label: string } {
  switch (status) {
    case 'RECEIVED': return { variant: 'info', label: 'Received' }
    case 'PARSED': return { variant: 'info', label: 'Parsed' }
    case 'ROUTED': return { variant: 'success', label: 'Routed' }
    case 'FAILED': return { variant: 'error', label: 'Failed' }
    case 'QUARANTINED': return { variant: 'warning', label: 'Quarantined' }
    case 'REPLAYED': return { variant: 'info', label: 'Replayed' }
    case 'RELEASED': return { variant: 'success', label: 'Released' }
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
  const { data, isLoading } = useIngressEvents({ ...filters, search: search || undefined, status: statusFilter || undefined })

  const events = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 0
  const currentPage = filters.page ?? 0

  // Detail drawer
  const [selectedId, setSelectedId] = useState('')
  const { data: detail, isLoading: loadingDetail } = useIngressEventDetail(selectedId)

  // Action modals
  const [replayingId, setReplayingId] = useState<string | null>(null)
  const [quarantineId, setQuarantineId] = useState<string | null>(null)
  const [quarantineReason, setQuarantineReason] = useState('')
  const [releaseId, setReleaseId] = useState<string | null>(null)
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

  const handleReplay = async (id: string) => {
    setActionLoading(true)
    try {
      await ingressEventService.replay(id)
      success('Event replayed')
      invalidateEvents()
    } catch (err) {
      error(err instanceof Error ? err.message : 'Replay failed')
    } finally {
      setActionLoading(false)
      setReplayingId(null)
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

  const handleRelease = async (id: string) => {
    setActionLoading(true)
    try {
      await ingressEventService.release(id)
      success('Event released')
      invalidateEvents()
    } catch (err) {
      error(err instanceof Error ? err.message : 'Release failed')
    } finally {
      setActionLoading(false)
      setReleaseId(null)
    }
  }

  const STATUSES = ['', 'RECEIVED', 'PARSED', 'ROUTED', 'FAILED', 'QUARANTINED', 'REPLAYED', 'RELEASED']

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
          {STATUSES.filter(Boolean).map((s) => (
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
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Provider</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Received</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Error</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <>
                  <SkeletonRow colCount={8} />
                  <SkeletonRow colCount={8} />
                  <SkeletonRow colCount={8} />
                </>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12">
                    <EmptyState
                      icon={<Mail className="w-8 h-8 text-gray-400" />}
                      title="No ingress events"
                      description="No email ingress events match your filters."
                    />
                  </td>
                </tr>
              ) : (
                events.map((evt) => {
                  const badge = statusBadge(evt.status)
                  return (
                    <tr key={evt.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSelectedId(evt.id)}>
                      <td className="px-4 py-3"><Badge variant={badge.variant} size="sm">{badge.label}</Badge></td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{evt.mailboxName ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-700 text-xs truncate max-w-[180px]">{evt.sender ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-700 truncate max-w-[200px]">{evt.subject ?? '—'}</td>
                      <td className="px-4 py-3"><Badge variant="info" size="sm">{evt.providerType ?? '—'}</Badge></td>
                      <td className="px-4 py-3 text-xs text-gray-500">{format(new Date(evt.receivedAt), 'MMM d, HH:mm')}</td>
                      <td className="px-4 py-3 text-xs text-red-500 truncate max-w-[180px]">{evt.lastErrorSummary ?? ''}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          {canManageIngressEvents && (
                            <>
                              {(evt.status === 'FAILED' || evt.status === 'QUARANTINED') && (
                                <button onClick={() => setReplayingId(evt.id)} className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-indigo-600" title="Replay">
                                  <RefreshCw size={13} />
                                </button>
                              )}
                              {evt.status !== 'QUARANTINED' && evt.status !== 'ROUTED' && (
                                <button onClick={() => setQuarantineId(evt.id)} className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-amber-600" title="Quarantine">
                                  <ShieldAlert size={13} />
                                </button>
                              )}
                              {evt.status === 'QUARANTINED' && (
                                <button onClick={() => setReleaseId(evt.id)} className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-green-600" title="Release">
                                  <Unlock size={13} />
                                </button>
                              )}
                            </>
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
                <Badge variant={statusBadge(detail.status).variant} size="sm">{statusBadge(detail.status).label}</Badge>
              </DetailRow>
              <DetailRow label="Message ID" value={detail.messageId} mono />
              <DetailRow label="Subject" value={detail.subject ?? '—'} />
              <DetailRow label="Sender" value={detail.sender ?? '—'} />
              <DetailRow label="Recipients" value={detail.recipients.join(', ') || '—'} />
              {detail.cc.length > 0 && <DetailRow label="CC" value={detail.cc.join(', ')} />}
              <DetailRow label="Mailbox" value={`${detail.mailboxName ?? '—'} (${detail.mailboxAddress ?? '—'})`} />
              <DetailRow label="Provider" value={detail.providerType ?? '—'} />
              <DetailRow label="Received" value={format(new Date(detail.receivedAt), 'yyyy-MM-dd HH:mm:ss')} />
              {detail.processedAt && <DetailRow label="Processed" value={format(new Date(detail.processedAt), 'yyyy-MM-dd HH:mm:ss')} />}
            </div>

            {detail.lastErrorSummary && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center gap-1.5 text-red-700 font-medium text-xs mb-1">
                  <AlertTriangle size={12} /> Last Error
                </div>
                <p className="text-xs text-red-600">{detail.lastErrorSummary}</p>
              </div>
            )}

            {detail.quarantineReason && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="text-xs font-medium text-amber-700 mb-1">Quarantine Reason</div>
                <p className="text-xs text-amber-600">{detail.quarantineReason}</p>
                {detail.quarantinedAt && (
                  <p className="text-xs text-amber-500 mt-1">Quarantined: {format(new Date(detail.quarantinedAt), 'yyyy-MM-dd HH:mm:ss')}</p>
                )}
              </div>
            )}

            {detail.replayedAt && (
              <DetailRow label="Replayed At" value={format(new Date(detail.replayedAt), 'yyyy-MM-dd HH:mm:ss')} />
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
            {canManageIngressEvents && (
              <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                {(detail.status === 'FAILED' || detail.status === 'QUARANTINED') && (
                  <Button variant="secondary" size="sm" leftIcon={<RefreshCw size={12} />} onClick={() => setReplayingId(detail.id)}>
                    Replay
                  </Button>
                )}
                {detail.status !== 'QUARANTINED' && detail.status !== 'ROUTED' && (
                  <Button variant="secondary" size="sm" leftIcon={<ShieldAlert size={12} />} onClick={() => setQuarantineId(detail.id)}>
                    Quarantine
                  </Button>
                )}
                {detail.status === 'QUARANTINED' && (
                  <Button variant="secondary" size="sm" leftIcon={<Unlock size={12} />} onClick={() => setReleaseId(detail.id)}>
                    Release
                  </Button>
                )}
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

      {/* Replay confirmation */}
      <ConfirmModal
        isOpen={replayingId !== null}
        onClose={() => setReplayingId(null)}
        title="Replay Ingress Event"
        message="This will re-process the ingress event through the routing pipeline. Continue?"
        confirmLabel="Replay"
        isLoading={actionLoading}
        onConfirm={() => replayingId && handleReplay(replayingId)}
      />

      {/* Quarantine with reason */}
      {quarantineId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Quarantine Ingress Event</h3>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Reason *</label>
              <textarea
                value={quarantineReason}
                onChange={(e) => setQuarantineReason(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="Enter quarantine reason…"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => { setQuarantineId(null); setQuarantineReason('') }}>Cancel</Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => quarantineId && handleQuarantine(quarantineId)}
                isLoading={actionLoading}
                disabled={!quarantineReason.trim()}
                className="bg-amber-500 hover:bg-amber-600"
              >
                Quarantine
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Release confirmation */}
      <ConfirmModal
        isOpen={releaseId !== null}
        onClose={() => setReleaseId(null)}
        title="Release Quarantined Event"
        message="This will release the event from quarantine and re-process it. Continue?"
        confirmLabel="Release"
        isLoading={actionLoading}
        onConfirm={() => releaseId && handleRelease(releaseId)}
      />
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
