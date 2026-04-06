import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGet = vi.fn()
const mockPost = vi.fn()
const mockPut = vi.fn()

vi.mock('@/services/api.client', () => ({
  apiClient: {
    get: mockGet,
    post: mockPost,
    put: mockPut,
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

const { jiraIntegrationService } = await import('@/services/jiraIntegration.service')

describe('jiraIntegrationService', () => {
  beforeEach(() => {
    mockGet.mockReset()
    mockPost.mockReset()
    mockPut.mockReset()
  })

  it('uses ticketPublicId for Jira status/create/retry endpoints', async () => {
    mockGet.mockResolvedValue({ jobId: 1, jobStatus: 'NOT_REQUESTED' })
    mockPost.mockResolvedValue({ jobId: 1, jobStatus: 'PENDING' })

    await jiraIntegrationService.getTicketJiraStatus('ticket-public-1')
    await jiraIntegrationService.createJiraIssue('ticket-public-1')
    await jiraIntegrationService.retryJiraIssue('ticket-public-1')

    expect(mockGet).toHaveBeenCalledWith('/tickets/ticket-public-1/jira')
    expect(mockPost).toHaveBeenNthCalledWith(1, '/tickets/ticket-public-1/jira/create', {})
    expect(mockPost).toHaveBeenNthCalledWith(2, '/tickets/ticket-public-1/jira/retry', {})
  })

  it('treats 204 config responses as an empty Jira config', async () => {
    mockGet.mockResolvedValueOnce(undefined)

    await expect(jiraIntegrationService.getJiraConfig()).resolves.toBeNull()
    expect(mockGet).toHaveBeenCalledWith('/admin/integrations/jira/config')
  })

  it('saves config and tests connection via exact admin routes', async () => {
    mockPut.mockResolvedValue({ id: 1, enabled: true, baseUrl: 'https://jira.example.com', authType: 'BASIC', username: 'user@example.com', apiToken: '****', projectKey: 'TEST', issueType: 'Task', defaultLabels: null, appBaseUrl: null, updatedAt: '2026-04-06T10:00:00Z' })
    mockPost.mockResolvedValueOnce({ success: true, message: 'Connection successful' })

    await jiraIntegrationService.saveJiraConfig({
      enabled: true,
      baseUrl: 'https://jira.example.com',
      authType: 'BASIC',
      username: 'user@example.com',
      apiToken: null,
      projectKey: 'TEST',
      issueType: 'Task',
      defaultLabels: null,
      appBaseUrl: null,
    })
    await jiraIntegrationService.testJiraConnection()

    expect(mockPut).toHaveBeenCalledWith('/admin/integrations/jira/config', expect.objectContaining({ projectKey: 'TEST' }))
    expect(mockPost).toHaveBeenCalledWith('/admin/integrations/jira/test', {})
  })
})