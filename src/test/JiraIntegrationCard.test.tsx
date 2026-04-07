import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { JiraStatusResponse } from '@/types/integration.types'

const createMutate = vi.hoisted(() => vi.fn())
const retryMutate = vi.hoisted(() => vi.fn())
const jiraConfigState = vi.hoisted(() => ({
  data: { enabled: true } as { enabled: boolean } | null,
  isLoading: false,
}))
const jiraState = vi.hoisted(() => ({
  data: { jobId: null, jobStatus: 'NOT_REQUESTED', attemptCount: null, lastError: null, nextAttemptAt: null, jiraIssueKey: null, jiraUrl: null, linkedAt: null } as JiraStatusResponse,
  isLoading: false,
  isError: false,
  error: null as Error | null,
  isFetching: false,
  refetch: vi.fn(),
}))

vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ canManageIntegrationConfig: true, canSendTicketEmailReply: false }),
}))

vi.mock('@/hooks/useIntegrations', () => ({
  useTicketJiraStatus: () => jiraState,
  useJiraConfig: () => jiraConfigState,
  useCreateJiraIssue: () => ({ mutate: createMutate, isPending: false }),
  useRetryJiraIssue: () => ({ mutate: retryMutate, isPending: false }),
}))

const { JiraIntegrationCard } = await import('@/components/ticket-detail/JiraIntegrationCard')

describe('JiraIntegrationCard', () => {
  beforeEach(() => {
    createMutate.mockReset()
    retryMutate.mockReset()
    jiraState.refetch.mockReset()
    jiraConfigState.data = { enabled: true }
    jiraConfigState.isLoading = false
    jiraState.data = { jobId: null, jobStatus: 'NOT_REQUESTED', attemptCount: null, lastError: null, nextAttemptAt: null, jiraIssueKey: null, jiraUrl: null, linkedAt: null }
    jiraState.isLoading = false
    jiraState.isError = false
    jiraState.isFetching = false
  })

  it('renders the not requested state and triggers create', () => {
    render(<MemoryRouter><JiraIntegrationCard ticketPublicId="ticket-public-1" /></MemoryRouter>)

    expect(screen.getByText('No Jira issue linked yet.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Create Jira Issue' }))
    expect(createMutate).toHaveBeenCalledTimes(1)
  })

  it('renders pending and succeeded states honestly', () => {
    jiraState.data = { jobId: 42, jobStatus: 'PENDING', attemptCount: null, lastError: null, nextAttemptAt: null, jiraIssueKey: null, jiraUrl: null, linkedAt: null }
    const { rerender } = render(<MemoryRouter><JiraIntegrationCard ticketPublicId="ticket-public-1" /></MemoryRouter>)

    expect(screen.getByText(/Jira issue creation in progress/)).toBeInTheDocument()

    jiraState.data = {
      jobId: 42,
      jobStatus: 'SUCCEEDED',
      attemptCount: 1,
      lastError: null,
      nextAttemptAt: null,
      jiraIssueKey: 'TEST-42',
      jiraUrl: 'https://jira.example.com/browse/TEST-42',
      linkedAt: '2026-04-06T10:00:00Z',
    }
    rerender(<MemoryRouter><JiraIntegrationCard ticketPublicId="ticket-public-1" /></MemoryRouter>)

    expect(screen.getByText('TEST-42')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open in Jira' })).toHaveAttribute('href', 'https://jira.example.com/browse/TEST-42')
  })

  it('renders failed state and triggers retry', () => {
    jiraState.data = {
      jobId: 42,
      jobStatus: 'FAILED',
      attemptCount: 2,
      lastError: 'Jira auth test failed: 401',
      nextAttemptAt: '2026-04-06T11:00:00Z',
      jiraIssueKey: null,
      jiraUrl: null,
      linkedAt: null,
    }

    render(<MemoryRouter><JiraIntegrationCard ticketPublicId="ticket-public-1" /></MemoryRouter>)

    expect(screen.getByText('Jira auth test failed: 401')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Retry Jira Create' }))
    expect(retryMutate).toHaveBeenCalledTimes(1)
  })

  it('blocks create when Jira config is missing for integration admins and links to settings', () => {
    jiraConfigState.data = null

    render(<MemoryRouter><JiraIntegrationCard ticketPublicId="ticket-public-1" /></MemoryRouter>)

    expect(screen.getByText(/Jira integration is not configured/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open Settings' })).toHaveAttribute('href', '/admin/integrations/jira')
    expect(screen.getByRole('button', { name: 'Create Jira Issue' })).toBeDisabled()
    expect(createMutate).not.toHaveBeenCalled()
  })
})