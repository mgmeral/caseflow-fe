import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { AttachmentViewerModal } from '@/components/ticket-detail/AttachmentViewerModal'

describe('AttachmentViewerModal', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders preview/download actions and closes from the modal close button', () => {
    const onClose = vi.fn()

    render(
      <AttachmentViewerModal
        isOpen
        onClose={onClose}
        title="Email Attachments"
        attachments={[
          {
            id: 'a1',
            fileName: 'invoice.pdf',
            contentType: 'application/pdf',
            size: 2048,
            downloadUrl: '/files/invoice.pdf',
          },
        ]}
      />,
    )

    expect(screen.getAllByText('invoice.pdf')[0]).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open' }).closest('a')).toHaveAttribute('href', '/files/invoice.pdf')
    expect(screen.getByRole('button', { name: 'Download' }).closest('a')).toHaveAttribute('href', '/files/invoice.pdf')

    fireEvent.click(screen.getByRole('button', { name: 'Close modal' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('loads inline text preview for previewable text attachments', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, text: async () => 'Preview text body' } as Response)

    render(
      <AttachmentViewerModal
        isOpen
        onClose={vi.fn()}
        title="Email Attachments"
        attachments={[
          {
            id: 'a2',
            fileName: 'message.txt',
            contentType: 'text/plain',
            size: 14,
            downloadUrl: '/files/message.txt',
          },
        ]}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('Preview text body')).toBeInTheDocument()
    })
  })
})