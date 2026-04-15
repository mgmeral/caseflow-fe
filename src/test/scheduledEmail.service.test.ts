import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGet = vi.fn()
const mockPost = vi.fn()
const mockDelete = vi.fn()

vi.mock('@/services/api.client', () => ({
  apiClient: {
    get: mockGet,
    post: mockPost,
    put: vi.fn(),
    patch: vi.fn(),
    delete: mockDelete,
  },
}))

const { scheduledEmailService } = await import('@/services/scheduledEmail.service')

describe('scheduledEmailService', () => {
  beforeEach(() => {
    mockGet.mockReset()
    mockPost.mockReset()
    mockDelete.mockReset()
  })

  it('lists and creates scheduled emails with ticketPublicId routes', async () => {
    mockGet.mockResolvedValueOnce([])
    mockPost.mockResolvedValueOnce({ id: 1, ticketId: 100, mailboxId: 1, toAddress: 'customer@example.com', subject: 'Follow-up', status: 'PENDING', sendNotBefore: '2026-04-10T09:00:00Z', canceledAt: null, sentAt: null, createdAt: '2026-04-06T10:00:00Z' })

    await scheduledEmailService.listScheduledEmails('ticket-public-1')
    await scheduledEmailService.createScheduledEmail('ticket-public-1', {
      mailboxId: 1,
      toAddress: ' customer@example.com ',
      subject: ' Follow-up ',
      textBody: ' Hello ',
      htmlBody: ' <p>Hello</p> ',
      sendNotBefore: '2026-04-10T09:00:00Z',
      sourceEventId: 101,
      templateId: 5,
      contentWasEdited: false,
    })

    expect(mockGet).toHaveBeenCalledWith('/tickets/ticket-public-1/scheduled-emails')
    expect(mockPost).toHaveBeenCalledWith('/tickets/ticket-public-1/scheduled-emails', expect.objectContaining({
      mailboxId: 1,
      toAddress: 'customer@example.com',
      subject: 'Follow-up',
      textBody: 'Hello',
      htmlBody: '<p>Hello</p>',
      sourceEventId: 101,
      templateId: 5,
      contentWasEdited: false,
    }))
  })

  it('throws before sending when sourceEventId is not numeric', async () => {
    await expect(
      scheduledEmailService.createScheduledEmail('ticket-public-1', {
        mailboxId: 1,
        toAddress: 'customer@example.com',
        subject: 'Follow-up',
        textBody: 'Hello',
        htmlBody: null,
        sendNotBefore: '2026-04-10T09:00:00Z',
        sourceEventId: 'evt-1' as unknown as number,
        templateId: null,
        contentWasEdited: false,
      }),
    ).rejects.toThrow('Reply context is invalid. Source event id must be numeric.')

    expect(mockPost).not.toHaveBeenCalled()
  })

  it('allows scheduled creation without a preview recipient when sourceEventId can resolve it backend-side', async () => {
    mockPost.mockResolvedValueOnce({ id: 2, ticketId: 100, mailboxId: 1, toAddress: 'customer@example.com', subject: 'Follow-up', status: 'PENDING', sendNotBefore: '2026-04-10T09:00:00Z', canceledAt: null, sentAt: null, createdAt: '2026-04-06T10:00:00Z' })

    await scheduledEmailService.createScheduledEmail('ticket-public-1', {
      mailboxId: 1,
      toAddress: null,
      subject: 'Follow-up',
      textBody: 'Hello',
      htmlBody: null,
      sendNotBefore: '2026-04-10T09:00:00Z',
      sourceEventId: 101,
      templateId: null,
      contentWasEdited: false,
    })

    expect(mockPost).toHaveBeenCalledWith('/tickets/ticket-public-1/scheduled-emails', expect.not.objectContaining({
      toAddress: expect.anything(),
    }))
  })

  it('cancels scheduled email with ticketPublicId and dispatchId', async () => {
    mockDelete.mockResolvedValueOnce({ id: 5, ticketId: 100, mailboxId: 1, toAddress: 'customer@example.com', subject: 'Follow-up', status: 'CANCELED', sendNotBefore: '2026-04-10T09:00:00Z', canceledAt: '2026-04-06T11:00:00Z', sentAt: null, createdAt: '2026-04-06T10:00:00Z' })

    await scheduledEmailService.cancelScheduledEmail('ticket-public-1', 5)

    expect(mockDelete).toHaveBeenCalledWith('/tickets/ticket-public-1/scheduled-emails/5')
  })
})