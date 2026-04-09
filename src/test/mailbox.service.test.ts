import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGet = vi.hoisted(() => vi.fn())
const mockPost = vi.hoisted(() => vi.fn())
const mockPut = vi.hoisted(() => vi.fn())
const mockPatch = vi.hoisted(() => vi.fn())

vi.mock('@/services/api.client', () => ({
  apiClient: {
    get: mockGet,
    post: mockPost,
    put: mockPut,
    patch: mockPatch,
    delete: vi.fn(),
  },
}))

vi.mock('@/services/email-platform.normalizers', () => ({
  normalizeMailbox: (raw: unknown) => raw,
  normalizeMailboxList: (raw: unknown) => raw,
  normalizeInitialSyncStrategy: (value: unknown) => {
    if (value === 'START_FROM_LATEST') return 'NEW_MESSAGES_ONLY'
    if (value === 'BACKFILL_ALL') return 'SCAN_FROM_START'
    return value
  },
}))

const { mailboxService } = await import('@/services/mailbox.service')

describe('mailboxService backend contract', () => {
  beforeEach(() => {
    mockGet.mockReset()
    mockPost.mockReset()
    mockPut.mockReset()
    mockPatch.mockReset()
  })

  it('lists mailboxes via /admin/mailboxes with filter params', async () => {
    mockGet.mockResolvedValueOnce({ items: [], page: 0, size: 20, totalElements: 0, totalPages: 0 })

    await mailboxService.list({ page: 0, size: 20, activeOnly: true })

    expect(mockGet).toHaveBeenCalledWith('/admin/mailboxes?page=0&size=20&activeOnly=true')
  })

  it('gets, creates, updates and toggles mailbox via admin endpoints', async () => {
    mockGet.mockResolvedValueOnce({ id: 'm1' })
    mockPost.mockResolvedValueOnce({ id: 'm1' })
    mockPut.mockResolvedValueOnce({ id: 'm1' })
    mockPatch.mockResolvedValue({ id: 'm1' })

    await mailboxService.getById('m1')
    await mailboxService.create({
      name: 'Main',
      displayName: null,
      address: 'support@caseflow.com',
      mailProvider: 'OUTLOOK',
      authType: 'OAUTH2',
      providerType: 'IMAP',
      inboundMode: 'POLLING',
      outboundMode: 'SMTP',
      isActive: true,
      oauthTenantId: 'tenant-1',
      oauthClientId: 'client-1',
      oauthClientSecret: 'secret-1',
      smtpHost: null,
      smtpPort: null,
      smtpUsername: null,
      smtpPassword: null,
      smtpStarttls: true,
      smtpUseSsl: null,
      imapHost: 'imap.caseflow.com',
      imapPort: 993,
      imapUsername: 'support@caseflow.com',
      imapPassword: null,
      imapUseSsl: true,
      imapFolder: 'INBOX',
      pollingEnabled: true,
      pollIntervalSeconds: 60,
      defaultGroupId: null,
      defaultPriority: null,
      initialSyncStrategy: 'START_FROM_LATEST',
    })
    await mailboxService.update('m1', {
      name: 'Main',
      displayName: null,
      address: 'support@caseflow.com',
      mailProvider: 'GMAIL',
      authType: 'PASSWORD',
      providerType: 'IMAP',
      inboundMode: 'POLLING',
      outboundMode: 'SMTP',
      isActive: true,
      oauthTenantId: null,
      oauthClientId: null,
      oauthClientSecret: null,
      smtpHost: 'smtp.caseflow.com',
      smtpPort: 587,
      smtpUsername: 'smtp-user',
      smtpPassword: null,
      smtpStarttls: true,
      smtpUseSsl: true,
      imapHost: 'imap.caseflow.com',
      imapPort: 993,
      imapUsername: 'support@caseflow.com',
      imapPassword: null,
      imapUseSsl: true,
      imapFolder: 'INBOX',
      pollingEnabled: true,
      pollIntervalSeconds: 60,
      defaultGroupId: null,
      defaultPriority: null,
      initialSyncStrategy: 'START_FROM_LATEST',
    })
    await mailboxService.activate('m1')
    await mailboxService.deactivate('m1')

    expect(mockGet).toHaveBeenCalledWith('/admin/mailboxes/m1')
    expect(mockPost).toHaveBeenCalledWith('/admin/mailboxes', expect.objectContaining({
      mailProvider: 'OUTLOOK',
      authType: 'OAUTH2',
      oauthTenantId: 'tenant-1',
      oauthClientId: 'client-1',
      oauthClientSecret: 'secret-1',
      imapHost: 'imap.caseflow.com',
      smtpHost: null,
      smtpPort: null,
      smtpUsername: null,
      smtpStarttls: true,
      initialSyncStrategy: 'NEW_MESSAGES_ONLY',
    }))
    expect(mockPut).toHaveBeenCalledWith('/admin/mailboxes/m1', expect.objectContaining({
      mailProvider: 'GMAIL',
      authType: 'PASSWORD',
      oauthTenantId: null,
      imapHost: 'imap.caseflow.com',
      smtpHost: 'smtp.caseflow.com',
      smtpPort: 587,
      smtpUsername: 'smtp-user',
      smtpStarttls: true,
      initialSyncStrategy: 'NEW_MESSAGES_ONLY',
    }))
    expect(mockPatch).toHaveBeenNthCalledWith(1, '/admin/mailboxes/m1/activate', {})
    expect(mockPatch).toHaveBeenNthCalledWith(2, '/admin/mailboxes/m1/deactivate', {})
  })

  it('keeps blank edit secrets as null in update payloads', async () => {
    mockPut.mockResolvedValueOnce({ id: 'm1' })

    await mailboxService.update('m1', {
      name: 'Main',
      displayName: null,
      address: 'support@caseflow.com',
      mailProvider: 'OUTLOOK',
      authType: 'OAUTH2',
      providerType: 'IMAP',
      inboundMode: 'POLLING',
      outboundMode: 'SMTP',
      isActive: true,
      oauthTenantId: 'tenant-1',
      oauthClientId: 'client-1',
      oauthClientSecret: null,
      smtpHost: 'smtp.office365.com',
      smtpPort: 587,
      smtpUsername: 'support@caseflow.com',
      smtpPassword: null,
      smtpStarttls: true,
      smtpUseSsl: true,
      imapHost: 'outlook.office365.com',
      imapPort: 993,
      imapUsername: 'support@caseflow.com',
      imapPassword: null,
      imapUseSsl: true,
      imapFolder: 'INBOX',
      pollingEnabled: true,
      pollIntervalSeconds: 60,
      defaultGroupId: null,
      defaultPriority: null,
      initialSyncStrategy: 'NEW_MESSAGES_ONLY',
    })

    expect(mockPut).toHaveBeenCalledWith('/admin/mailboxes/m1', expect.objectContaining({
      oauthClientSecret: null,
      imapPassword: null,
      smtpPassword: null,
    }))
  })

  it('tests IMAP and SMTP mailbox connectivity via separate admin endpoints', async () => {
    mockPost.mockResolvedValueOnce({
      success: true,
      message: 'IMAP connected',
      testedAt: '2026-03-29T00:00:00Z',
    })
    mockPost.mockResolvedValueOnce({
      success: false,
      message: 'SMTP auth failed',
      testedAt: '2026-03-29T00:05:00Z',
    })

    const imapResult = await mailboxService.testImapConnection('m1')
    const smtpResult = await mailboxService.testSmtpConnection('m1')

    expect(mockPost).toHaveBeenCalledWith('/admin/mailboxes/m1/test-connection', {})
    expect(mockPost).toHaveBeenCalledWith('/admin/mailboxes/m1/test-smtp-connection', {})
    expect(imapResult.success).toBe(true)
    expect(smtpResult.success).toBe(false)
  })
})
