import { beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { useTicketEmailAttachments } from '@/hooks/useTicketEmails'

const mockGetDetail = vi.fn()

vi.mock('@/services/ticketEmail.service', () => ({
  ticketEmailService: {
    listThread: vi.fn(),
    getDetail: (...args: unknown[]) => mockGetDetail(...args),
    sendReply: vi.fn(),
  },
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useTicketEmailAttachments', () => {
  beforeEach(() => {
    mockGetDetail.mockReset()
  })

  it('hydrates attachments with the real email document id instead of the thread event id', async () => {
    mockGetDetail.mockResolvedValueOnce({
      id: '74',
      emailDocumentId: 'email-74',
      ticketId: 't1',
      threadKey: null,
      messageId: '<m1>',
      providerMessageId: null,
      mailboxId: null,
      mailboxName: null,
      sourceEventId: '74',
      direction: 'INBOUND',
      subject: 'Help',
      from: 'customer@test.com',
      to: ['support@test.com'],
      cc: [],
      bcc: [],
      bodyText: 'Need help',
      bodyHtml: null,
      sanitizedHtmlBody: null,
      rawHtmlBody: null,
      bodyPreview: 'Need help',
      failureReason: null,
      sentAt: null,
      receivedAt: '2026-04-01T00:00:00Z',
      processingStatus: null,
      dispatchStatus: null,
      attachmentCount: 1,
      attachments: [
        {
          id: 'att-1',
          fileName: 'invoice.pdf',
          contentType: 'application/pdf',
          size: 1024,
          sizeBytes: 1024,
          previewSupported: true,
          previewUrl: '/api/tickets/t1/emails/email-74/attachments/att-1/content',
          openUrl: '/api/tickets/t1/emails/email-74/attachments/att-1/content',
          downloadUrl: '/api/tickets/t1/emails/email-74/attachments/att-1/content',
        },
      ],
    })

    const wrapper = createWrapper()
    const { result } = renderHook(
      () => useTicketEmailAttachments('ticket-public-1', [
        {
          id: '74',
          emailDocumentId: 'email-74',
          ticketId: 't1',
          detailType: 'INBOUND' as const,
          threadKey: null,
          messageId: '<m1>',
          providerMessageId: null,
          mailboxId: null,
          mailboxName: null,
          sourceEventId: '74',
          direction: 'INBOUND',
          subject: 'Help',
          from: 'customer@test.com',
          to: ['support@test.com'],
          cc: [],
          bcc: [],
          bodyText: null,
          bodyHtml: null,
          sanitizedHtmlBody: null,
          rawHtmlBody: null,
          bodyPreview: 'Need help',
          sentAt: null,
          receivedAt: '2026-04-01T00:00:00Z',
          processingStatus: null,
          dispatchStatus: null,
          attachmentCount: 1,
          attachments: [],
        },
      ]),
      { wrapper },
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(mockGetDetail).toHaveBeenCalledWith('ticket-public-1', 'email-74', 'INBOUND')
    expect(mockGetDetail).not.toHaveBeenCalledWith('ticket-public-1', '74', 'INBOUND')
    expect(result.current.attachments).toEqual([
      expect.objectContaining({
        emailId: 'email-74',
        fileName: 'invoice.pdf',
        downloadUrl: '/api/tickets/t1/emails/email-74/attachments/att-1/content',
      }),
    ])
  })
})