import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGet = vi.hoisted(() => vi.fn())
const mockPut = vi.hoisted(() => vi.fn())
const mockPost = vi.hoisted(() => vi.fn())
const mockPatch = vi.hoisted(() => vi.fn())
const mockDelete = vi.hoisted(() => vi.fn())

vi.mock('@/services/api.client', () => ({
  apiClient: {
    get: mockGet,
    post: mockPost,
    put: mockPut,
    patch: mockPatch,
    delete: mockDelete,
  },
}))

const { customerEmailSettingsService } = await import('@/services/customerEmailSettings.service')

describe('customerEmailSettingsService routing-owner contract', () => {
  beforeEach(() => {
    mockGet.mockReset()
    mockPut.mockReset()
    mockPost.mockReset()
    mockPatch.mockReset()
    mockDelete.mockReset()
  })

  it('upserts customer email settings via customer endpoint', async () => {
    mockPut.mockResolvedValueOnce({
      customerId: 'c1',
      isActive: true,
      allowSubdomains: true,
      unknownSenderPolicy: 'CREATE_UNMATCHED_TICKET',
      defaultGroupId: null,
      defaultGroupName: null,
      defaultPriority: null,
      updatedAt: '2025-01-01T00:00:00Z',
    })

    await customerEmailSettingsService.upsert('c1', {
      isEnabled: true,
      allowSubdomains: true,
      unknownSenderPolicy: 'ROUTE_TO_DEFAULT',
      defaultGroupId: null,
      defaultPriority: null,
    })

    expect(mockPut).toHaveBeenCalledWith('/customers/c1/email-settings', {
      isActive: true,
      allowSubdomains: true,
      unknownSenderPolicy: 'CREATE_UNMATCHED_TICKET',
      defaultGroupId: null,
      defaultPriority: null,
    })
  })

  it('lists routing rules from /customers/{id}/email-settings response', async () => {
    mockGet.mockResolvedValueOnce({
      customerId: 'c1',
      isActive: true,
      allowSubdomains: true,
      unknownSenderPolicy: 'MANUAL_REVIEW',
      defaultGroupId: null,
      defaultPriority: null,
      updatedAt: '2025-01-01T00:00:00Z',
      rules: [
        {
          id: 'r1',
          customerId: 'c1',
          senderMatchType: 'DOMAIN',
          matchValue: '@akbank.com',
          priority: 10,
          isActive: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      ],
    })

    const rules = await customerEmailSettingsService.listRoutingRules('c1')

    expect(mockGet).toHaveBeenCalledWith('/customers/c1/email-settings')
    expect(rules).toHaveLength(1)
    expect(rules[0].senderMatchType).toBe('DOMAIN_SUFFIX')
    expect(rules[0].senderMatchValue).toBe('@akbank.com')
  })

  it('performs sender pattern rule CRUD under customer context', async () => {
    mockPost.mockResolvedValueOnce({
      id: 'r1',
      customerId: 'c1',
      recipientMailboxId: 'm1',
      recipientMailboxName: 'Main',
      senderMatchType: 'DOMAIN',
      matchValue: '@akbank.com',
      priority: 10,
      isActive: true,
      notes: null,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    })
    mockPut.mockResolvedValueOnce({
      id: 'r1',
      customerId: 'c1',
      recipientMailboxId: 'm1',
      recipientMailboxName: 'Main',
      senderMatchType: 'EXACT_EMAIL',
      matchValue: 'ops@akbank.com',
      priority: 10,
      isActive: true,
      notes: null,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-02T00:00:00Z',
    })
    mockGet.mockResolvedValueOnce({
      customerId: 'c1',
      isActive: true,
      allowSubdomains: true,
      unknownSenderPolicy: 'MANUAL_REVIEW',
      defaultGroupId: null,
      defaultPriority: null,
      updatedAt: '2025-01-02T00:00:00Z',
      rules: [
        {
          id: 'r1',
          customerId: 'c1',
          senderMatchType: 'EXACT_EMAIL',
          matchValue: 'ops@akbank.com',
          priority: 10,
          isActive: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-02T00:00:00Z',
        },
      ],
    })
    mockPut.mockResolvedValueOnce({
      id: 'r1',
      customerId: 'c1',
      recipientMailboxId: 'm1',
      recipientMailboxName: 'Main',
      senderMatchType: 'EXACT_EMAIL',
      matchValue: 'ops@akbank.com',
      priority: 10,
      isActive: false,
      notes: null,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-02T00:00:00Z',
    })
    mockDelete.mockResolvedValueOnce(undefined)

    await customerEmailSettingsService.createRoutingRule('c1', {
      senderMatchType: 'DOMAIN_SUFFIX',
      senderMatchValue: '@akbank.com',
      recipientMailboxId: 'm1',
      priority: 10,
      isActive: true,
      notes: null,
    })

    await customerEmailSettingsService.updateRoutingRule('c1', 'r1', {
      senderMatchType: 'EXACT_EMAIL',
      senderMatchValue: 'ops@akbank.com',
      recipientMailboxId: 'm1',
      priority: 10,
      isActive: true,
      notes: null,
    })

    await customerEmailSettingsService.deactivateRoutingRule('c1', 'r1')
    await customerEmailSettingsService.deleteRoutingRule('c1', 'r1')

    expect(mockPost).toHaveBeenCalledWith('/customers/c1/email-settings/rules', expect.objectContaining({
      senderMatchType: 'DOMAIN',
      matchValue: '@akbank.com',
    }))
    expect(mockPut).toHaveBeenNthCalledWith(2, '/customers/c1/email-settings/rules/r1', expect.objectContaining({
      senderMatchType: 'EXACT_EMAIL',
      matchValue: 'ops@akbank.com',
      isActive: false,
    }))
    expect(mockDelete).toHaveBeenCalledWith('/customers/c1/email-settings/rules/r1')
  })
})
