import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

const createMutate = vi.hoisted(() => vi.fn())
const updateMutate = vi.hoisted(() => vi.fn())
const deleteMutate = vi.hoisted(() => vi.fn())

const channelsState = vi.hoisted(() => ({
  data: [
    {
      id: 1,
      name: 'Engineering Slack',
      channelType: 'SLACK',
      enabled: true,
      webhookUrlMasked: '****',
      webhookConfigured: true,
      subscribedEvents: ['TICKET_CREATED', 'TICKET_RESOLVED'],
      scopeType: 'GLOBAL',
      scopeId: null,
      createdAt: '2026-04-06T10:00:00Z',
      updatedAt: '2026-04-06T10:00:00Z',
    },
  ] as Array<Record<string, unknown>>,
  isLoading: false,
  isError: false,
  error: null as Error | null,
}))

const channelDetailState = vi.hoisted(() => ({
  data: {
    id: 1,
    name: 'Engineering Slack',
    channelType: 'SLACK',
    enabled: true,
    webhookUrlMasked: '****',
    webhookConfigured: true,
    subscribedEvents: ['TICKET_CREATED', 'TICKET_RESOLVED'],
    scopeType: 'GLOBAL',
    scopeId: null,
    createdAt: '2026-04-06T10:00:00Z',
    updatedAt: '2026-04-06T10:00:00Z',
  } as Record<string, unknown>,
  isLoading: false,
}))

vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ canManageIntegrationConfig: true }),
}))

vi.mock('@/hooks/useCustomers', () => ({
  useCustomers: () => ({ customers: [{ id: '7', name: 'Acme Corp' }] }),
}))

vi.mock('@/hooks/useUsers', () => ({
  useGroupsQuery: () => ({ data: [{ id: '5', name: 'Tier 1' }] }),
}))

vi.mock('@/hooks/useIntegrations', () => ({
  useChannelConfigs: () => channelsState,
  useChannelConfig: () => channelDetailState,
  useCreateChannelConfig: () => ({ mutate: createMutate, isPending: false }),
  useUpdateChannelConfig: () => ({ mutate: updateMutate, isPending: false }),
  useDeleteChannelConfig: () => ({ mutate: deleteMutate, isPending: false }),
}))

const { ChannelIntegrationSettingsPage } = await import('@/pages/admin/ChannelIntegrationSettingsPage')

describe('ChannelIntegrationSettingsPage', () => {
  beforeEach(() => {
    createMutate.mockReset()
    updateMutate.mockReset()
    deleteMutate.mockReset()
  })

  it('renders parsed subscribed events and hides webhook secrets', () => {
    render(<ChannelIntegrationSettingsPage />)

    expect(screen.getByText('Engineering Slack')).toBeInTheDocument()
    expect(screen.getByText('TICKET_CREATED')).toBeInTheDocument()
    expect(screen.getByText('TICKET_RESOLVED')).toBeInTheDocument()
    expect(screen.getByText('Saved and hidden')).toBeInTheDocument()
  })

  it('creates a channel config with the audited request shape', () => {
    render(<ChannelIntegrationSettingsPage />)

    fireEvent.click(screen.getByRole('button', { name: 'New Channel' }))
    expect(screen.queryByText('Scope Target')).not.toBeInTheDocument()
    expect(screen.getByText('Paste the incoming Slack webhook URL for the channel that should receive ticket events.')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Ops Teams' } })
    fireEvent.change(screen.getByLabelText('Channel Type'), { target: { value: 'TEAMS' } })
    expect(screen.getByText('Paste the Microsoft Teams incoming webhook URL for the channel that should receive ticket events.')).toBeInTheDocument()
    fireEvent.change(screen.getByPlaceholderText('https://outlook.office.com/webhook/...'), { target: { value: 'https://hooks.teams.test/ops' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))

    expect(createMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Ops Teams',
        webhookUrl: 'https://hooks.teams.test/ops',
        subscribedEvents: ['TICKET_CREATED'],
      }),
      expect.any(Object),
    )
  })

  it('updates and deletes channel configs without revealing the stored secret', () => {
    render(<ChannelIntegrationSettingsPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    expect(screen.getByText('A saved Slack webhook exists. Leave the field blank to preserve it.')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Engineering Slack Updated' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(updateMutate).toHaveBeenCalledWith(
      {
        id: 1,
        request: expect.objectContaining({
          name: 'Engineering Slack Updated',
          webhookUrl: '',
        }),
      },
      expect.any(Object),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[1] as HTMLButtonElement)
    expect(deleteMutate).toHaveBeenCalledWith(1, expect.any(Object))
  })

  it('requires a scope target when scope is not global', () => {
    render(<ChannelIntegrationSettingsPage />)

    fireEvent.click(screen.getByRole('button', { name: 'New Channel' }))
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Tier 1 Slack' } })
    fireEvent.change(screen.getByPlaceholderText('https://hooks.slack.com/services/...'), { target: { value: 'https://hooks.slack.com/services/test' } })
    fireEvent.change(screen.getByLabelText('Scope'), { target: { value: 'GROUP' } })

    expect(screen.getByText('Scope Target')).toBeInTheDocument()
    expect(screen.getByText('Required. Choose the specific group this channel applies to.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Create' }))
    expect(screen.getByText('Select a group scope target.')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Scope Target'), { target: { value: '5' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))

    expect(createMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        scopeType: 'GROUP',
        scopeId: 5,
      }),
      expect.any(Object),
    )
  })
})