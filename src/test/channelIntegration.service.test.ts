import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGet = vi.fn()
const mockPost = vi.fn()
const mockPut = vi.fn()
const mockDelete = vi.fn()

vi.mock('@/services/api.client', () => ({
  apiClient: {
    get: mockGet,
    post: mockPost,
    put: mockPut,
    patch: vi.fn(),
    delete: mockDelete,
  },
}))

const { channelIntegrationService } = await import('@/services/channelIntegration.service')

describe('channelIntegrationService', () => {
  beforeEach(() => {
    mockGet.mockReset()
    mockPost.mockReset()
    mockPut.mockReset()
    mockDelete.mockReset()
  })

  it('parses subscribedEvents JSON strings from list responses', async () => {
    mockGet.mockResolvedValueOnce([
      {
        id: 1,
        name: 'Engineering Slack',
        channelType: 'SLACK',
        enabled: true,
        webhookUrl: '****',
        subscribedEvents: '["TICKET_CREATED","TICKET_RESOLVED"]',
        scopeType: 'GLOBAL',
        scopeId: null,
        createdAt: '2026-04-06T10:00:00Z',
        updatedAt: '2026-04-06T10:00:00Z',
      },
    ])

    const result = await channelIntegrationService.listChannelConfigs()

    expect(mockGet).toHaveBeenCalledWith('/admin/integrations/channels')
    expect(result[0]?.subscribedEvents).toEqual(['TICKET_CREATED', 'TICKET_RESOLVED'])
    expect(result[0]?.webhookConfigured).toBe(true)
  })

  it('uses exact create/update/delete routes with numeric channel ids', async () => {
    mockPost.mockResolvedValue({ id: 1, name: 'Slack', channelType: 'SLACK', enabled: true, webhookUrl: '****', subscribedEvents: '[]', scopeType: 'GLOBAL', scopeId: null, createdAt: '2026-04-06T10:00:00Z', updatedAt: '2026-04-06T10:00:00Z' })
    mockPut.mockResolvedValue({ id: 2, name: 'Teams', channelType: 'TEAMS', enabled: true, webhookUrl: '****', subscribedEvents: '[]', scopeType: 'CUSTOMER', scopeId: 7, createdAt: '2026-04-06T10:00:00Z', updatedAt: '2026-04-06T10:00:00Z' })
    mockDelete.mockResolvedValue(undefined)

    await channelIntegrationService.createChannelConfig({
      name: 'Slack',
      channelType: 'SLACK',
      webhookUrl: 'https://hooks.slack.com/services/test',
      subscribedEvents: ['TICKET_CREATED'],
      scopeType: 'GLOBAL',
      scopeId: null,
      enabled: true,
    })
    await channelIntegrationService.updateChannelConfig(2, {
      name: 'Teams',
      channelType: 'TEAMS',
      webhookUrl: '',
      subscribedEvents: ['TICKET_CLOSED'],
      scopeType: 'CUSTOMER',
      scopeId: 7,
      enabled: true,
    })
    await channelIntegrationService.deleteChannelConfig(2)

    expect(mockPost).toHaveBeenCalledWith('/admin/integrations/channels', expect.objectContaining({ channelType: 'SLACK' }))
    expect(mockPut).toHaveBeenCalledWith('/admin/integrations/channels/2', expect.objectContaining({ scopeId: 7 }))
    expect(mockDelete).toHaveBeenCalledWith('/admin/integrations/channels/2')
  })
})