import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

const saveMutate = vi.hoisted(() => vi.fn())
const testMutate = vi.hoisted(() => vi.fn())

const jiraState = vi.hoisted(() => ({
  data: null as Record<string, unknown> | null,
  isLoading: false,
  isError: false,
  error: null as Error | null,
}))

vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ canManageIntegrationConfig: true }),
}))

vi.mock('@/hooks/useIntegrations', () => ({
  useJiraConfig: () => jiraState,
  useSaveJiraConfig: () => ({ mutate: saveMutate, isPending: false, isSuccess: false }),
  useTestJiraConnection: () => ({ mutate: testMutate, isPending: false }),
}))

const { JiraIntegrationSettingsPage } = await import('@/pages/admin/JiraIntegrationSettingsPage')

describe('JiraIntegrationSettingsPage', () => {
  beforeEach(() => {
    saveMutate.mockReset()
    testMutate.mockReset()
    jiraState.data = null
    jiraState.isLoading = false
    jiraState.isError = false
    jiraState.error = null
  })

  it('handles a 204-equivalent empty config by showing an empty form', () => {
    render(<JiraIntegrationSettingsPage />)

    expect(screen.getByPlaceholderText('https://jira.example.com')).toHaveValue('')
    expect(screen.getByText('Not configured')).toBeInTheDocument()
    expect(screen.getByText('No Jira configuration has been saved yet.')).toBeInTheDocument()
  })

  it('shows masked token guidance and saves with a null apiToken when left blank', () => {
    jiraState.data = {
      id: 1,
      enabled: true,
      baseUrl: 'https://jira.example.com',
      authType: 'BASIC',
      username: 'user@example.com',
      apiToken: '****',
      projectKey: 'TEST',
      issueType: 'Task',
      defaultLabels: 'caseflow',
      appBaseUrl: 'https://app.example.com',
      updatedAt: '2026-04-06T10:00:00Z',
    }

    render(<JiraIntegrationSettingsPage />)

  expect(screen.getByText('A token is already stored securely. Leaving this blank preserves it.')).toBeInTheDocument()
  expect(screen.getByDisplayValue('BASIC')).toHaveAttribute('readonly')
    fireEvent.click(screen.getByRole('button', { name: 'Save Configuration' }))

    expect(saveMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        apiToken: null,
        baseUrl: 'https://jira.example.com',
        projectKey: 'TEST',
      }),
      expect.any(Object),
    )
  })

  it('shows test connection feedback from the backend result', () => {
    jiraState.data = {
      id: 1,
      enabled: true,
      baseUrl: 'https://jira.example.com',
      authType: 'BASIC',
      username: 'user@example.com',
      apiToken: '****',
      projectKey: 'TEST',
      issueType: 'Task',
      defaultLabels: 'caseflow',
      appBaseUrl: 'https://app.example.com',
      updatedAt: '2026-04-06T10:00:00Z',
    }

    testMutate.mockImplementation((_value: undefined, options?: { onSuccess?: (result: { success: boolean; message: string }) => void }) => {
      options?.onSuccess?.({ success: false, message: 'Jira auth test failed: 401' })
    })

    render(<JiraIntegrationSettingsPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Test Connection' }))

    expect(screen.getByText('Jira auth test failed: 401')).toBeInTheDocument()
  })

  it('normalizes default labels into chips and still saves them as a string', () => {
    render(<JiraIntegrationSettingsPage />)

    const labelInput = screen.getByPlaceholderText('Type a label and press Enter')
    fireEvent.change(labelInput, { target: { value: 'caseflow, support team' } })
    fireEvent.keyDown(labelInput, { key: 'Enter' })

    expect(screen.getByText('caseflow')).toBeInTheDocument()
    expect(screen.getByText('support-team')).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText('https://jira.example.com'), { target: { value: 'https://jira.example.com' } })
    fireEvent.change(screen.getByPlaceholderText('TEST'), { target: { value: 'support' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save Configuration' }))

    expect(saveMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultLabels: 'caseflow,support-team',
        projectKey: 'SUPPORT',
      }),
      expect.any(Object),
    )
  })

  it('does not call the test endpoint before a config has been saved', () => {
    render(<JiraIntegrationSettingsPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Test Connection' }))

    expect(testMutate).not.toHaveBeenCalled()
    expect(screen.getByText('Save the Jira configuration before testing the connection. The test endpoint currently checks the saved configuration.')).toBeInTheDocument()
  })
})