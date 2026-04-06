import { ExternalLink, Loader2, PlugZap, RefreshCcw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/shared/Button'
import { Badge } from '@/components/shared/Badge'
import { useCreateJiraIssue, useJiraConfig, useRetryJiraIssue, useTicketJiraStatus } from '@/hooks/useIntegrations'
import { usePermissions } from '@/hooks/usePermissions'
import { getErrorMessage } from '@/lib/errors'

interface JiraIntegrationCardProps {
  ticketPublicId: string | null
}

function statusVariant(status: string): 'default' | 'info' | 'warning' | 'success' | 'error' {
  switch (status) {
    case 'PENDING':
    case 'PROCESSING':
      return 'info'
    case 'SUCCEEDED':
      return 'success'
    case 'FAILED':
    case 'PERMANENTLY_FAILED':
      return 'error'
    case 'CANCELED':
      return 'warning'
    default:
      return 'default'
  }
}

export function JiraIntegrationCard({ ticketPublicId }: JiraIntegrationCardProps) {
  const { canManageIntegrationConfig, canSendTicketEmailReply } = usePermissions()
  const canTrigger = canManageIntegrationConfig || canSendTicketEmailReply
  const statusQuery = useTicketJiraStatus(ticketPublicId ?? '', !!ticketPublicId)
  const configQuery = useJiraConfig()
  const createMutation = useCreateJiraIssue(ticketPublicId ?? '')
  const retryMutation = useRetryJiraIssue(ticketPublicId ?? '')

  if (!ticketPublicId) {
    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Jira</h3>
        </div>
        <div className="px-4 py-3 text-xs text-gray-400">Ticket integration state is unavailable until the backend provides a public ticket identifier.</div>
      </div>
    )
  }

  const isMutating = createMutation.isPending || retryMutation.isPending
  const status = statusQuery.data?.jobStatus ?? 'NOT_REQUESTED'
  const showRetry = status === 'FAILED' || status === 'PERMANENTLY_FAILED'
  const isPending = status === 'PENDING' || status === 'PROCESSING'
  const configKnown = !canManageIntegrationConfig || !configQuery.isLoading
  const configReady = !canManageIntegrationConfig || Boolean(configQuery.data?.enabled)
  const showConfigWarning = canManageIntegrationConfig && configKnown && !configReady
  const actionDisabled = isMutating || isPending || !configReady || !configKnown

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Jira</h3>
        {statusQuery.data ? <Badge variant={statusVariant(status)}>{status}</Badge> : null}
      </div>
      <div className="px-4 py-3 space-y-3 text-sm">
        {statusQuery.isLoading ? (
          <div className="flex items-center gap-2 text-gray-500"><Loader2 size={14} className="animate-spin" /> Loading Jira status...</div>
        ) : statusQuery.isError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-700">{getErrorMessage(statusQuery.error, 'Failed to load Jira status.')}</div>
        ) : status === 'SUCCEEDED' ? (
          <>
            <div className="text-gray-800">
              <div className="font-semibold">{statusQuery.data?.jiraIssueKey}</div>
              {statusQuery.data?.jiraUrl ? (
                <a href={statusQuery.data.jiraUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800">
                  Open in Jira
                  <ExternalLink size={13} />
                </a>
              ) : null}
            </div>
            {statusQuery.data?.linkedAt ? <div className="text-xs text-gray-500">Linked {new Date(statusQuery.data.linkedAt).toLocaleString()}</div> : null}
          </>
        ) : status === 'NOT_REQUESTED' ? (
          <div className="text-gray-600">No Jira issue has been created for this ticket yet.</div>
        ) : isPending ? (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-blue-800">
            Jira issue creation is in progress. The backend has accepted the request and this card will refresh until the job resolves.
          </div>
        ) : status === 'CANCELED' ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800">Jira issue creation was canceled.</div>
        ) : (
          <div className="space-y-2">
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-700">
              {statusQuery.data?.lastError ?? 'Jira issue creation failed.'}
            </div>
            {statusQuery.data?.nextAttemptAt ? <div className="text-xs text-gray-500">Next attempt: {new Date(statusQuery.data.nextAttemptAt).toLocaleString()}</div> : null}
          </div>
        )}

        {canManageIntegrationConfig && configQuery.isLoading ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
            Checking Jira configuration readiness...
          </div>
        ) : null}

        {showConfigWarning ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800 text-xs">
            Jira integration is not configured or is disabled. Complete the admin Jira settings before creating issues from tickets.
            <div className="mt-2">
              <Link to="/admin/integrations/jira" className="font-semibold text-amber-900 underline underline-offset-2">
                Open Jira Settings
              </Link>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {canTrigger && status === 'NOT_REQUESTED' ? (
            <Button variant="primary" size="sm" leftIcon={<PlugZap size={14} />} onClick={() => createMutation.mutate()} isLoading={createMutation.isPending} disabled={actionDisabled}>
              Create Jira Issue
            </Button>
          ) : null}
          {canTrigger && showRetry ? (
            <Button variant="secondary" size="sm" leftIcon={<RefreshCcw size={14} />} onClick={() => retryMutation.mutate()} isLoading={retryMutation.isPending} disabled={actionDisabled}>
              Retry Jira Create
            </Button>
          ) : null}
          <Button variant="ghost" size="sm" onClick={() => statusQuery.refetch()} disabled={statusQuery.isFetching || isMutating}>
            Refresh Status
          </Button>
        </div>
      </div>
    </div>
  )
}