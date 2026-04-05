import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { AttachmentViewerModal } from '@/components/ticket-detail/AttachmentViewerModal'
import { apiClient, ApiError } from '@/services/api.client'

describe('AttachmentViewerModal', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:attachment-preview')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  })

  it('renders preview/download actions and closes from the modal close button', async () => {
    const onClose = vi.fn()
    const getBlobSpy = vi.spyOn(apiClient, 'getBlob').mockResolvedValue(new Blob(['pdf'], { type: 'application/pdf' }))
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

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
            previewSupported: true,
            previewUrl: '/files/invoice-preview.pdf',
            openUrl: '/files/invoice-open.pdf',
            downloadUrl: '/files/invoice.pdf',
          },
        ]}
      />,
    )

    expect(screen.getAllByText('invoice.pdf')[0]).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Open' }))

    await waitFor(() => {
      expect(getBlobSpy).toHaveBeenCalledWith('/files/invoice.pdf')
    })

    expect(clickSpy).toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Close modal' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('loads inline text preview for previewable text attachments via the authenticated client', async () => {
    const getBlobSpy = vi.spyOn(apiClient, 'getBlob').mockResolvedValue(new Blob(['Preview text body'], { type: 'text/plain' }))

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
            previewSupported: true,
            previewUrl: '/files/message-preview.txt',
            downloadUrl: '/files/message.txt',
          },
        ]}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('Preview text body')).toBeInTheDocument()
    })

    expect(getBlobSpy).toHaveBeenCalledWith('/files/message.txt')
  })

  it('supports selecting a different attachment and previewing it inline', async () => {
    vi.spyOn(apiClient, 'getBlob')
      .mockResolvedValueOnce(new Blob(['invoice'], { type: 'application/pdf' }))
      .mockResolvedValueOnce(new Blob(['Selected note body'], { type: 'text/plain' }))

    render(
      <AttachmentViewerModal
        isOpen
        onClose={vi.fn()}
        title="Email Attachments"
        attachments={[
          {
            id: 'a1',
            fileName: 'invoice.pdf',
            contentType: 'application/pdf',
            size: 2048,
            previewSupported: true,
            previewUrl: '/files/invoice-preview.pdf',
            downloadUrl: '/files/invoice.pdf',
          },
          {
            id: 'a2',
            fileName: 'notes.txt',
            contentType: 'text/plain',
            size: 24,
            previewSupported: true,
            previewUrl: '/files/notes-preview.txt',
            downloadUrl: '/files/notes.txt',
          },
        ]}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /notes.txt/i }))

    await waitFor(() => {
      expect(screen.getByText('Selected note body')).toBeInTheDocument()
    })
  })

  it('renders inline image preview from a blob URL', async () => {
    vi.spyOn(apiClient, 'getBlob').mockResolvedValue(new Blob(['image-bytes'], { type: 'image/png' }))

    render(
      <AttachmentViewerModal
        isOpen
        onClose={vi.fn()}
        title="Email Attachments"
        attachments={[
          {
            id: 'img-1',
            fileName: 'preview.png',
            contentType: 'image/png',
            size: 256,
            previewSupported: true,
            downloadUrl: '/files/preview.png',
          },
        ]}
      />,
    )

    await waitFor(() => {
      expect(screen.getByRole('img', { name: 'preview.png' })).toHaveAttribute('src', 'blob:attachment-preview')
    })
  })

  it('renders inline image preview for uppercase MIME types when previewSupported is true', async () => {
    vi.spyOn(apiClient, 'getBlob').mockResolvedValue(new Blob(['image-bytes'], { type: 'IMAGE/JPEG' }))

    render(
      <AttachmentViewerModal
        isOpen
        onClose={vi.fn()}
        title="Email Attachments"
        attachments={[
          {
            id: 'img-2',
            fileName: 'camera.jpg',
            contentType: 'IMAGE/JPEG',
            size: 512,
            previewSupported: true,
            downloadUrl: '/api/tickets/t1/emails/e1/attachments/a1/content',
          },
        ]}
      />,
    )

    await waitFor(() => {
      expect(screen.getByRole('img', { name: 'camera.jpg' })).toHaveAttribute('src', 'blob:attachment-preview')
    })
  })

  it('renders inline pdf preview from a blob URL', async () => {
    vi.spyOn(apiClient, 'getBlob').mockResolvedValue(new Blob(['pdf'], { type: 'application/pdf' }))

    render(
      <AttachmentViewerModal
        isOpen
        onClose={vi.fn()}
        title="Email Attachments"
        attachments={[
          {
            id: 'pdf-1',
            fileName: 'manual.pdf',
            contentType: 'application/pdf',
            size: 512,
            previewSupported: true,
            downloadUrl: '/files/manual.pdf',
          },
        ]}
      />,
    )

    await waitFor(() => {
      expect(screen.getByTitle('manual.pdf')).toHaveAttribute('src', 'blob:attachment-preview')
    })
  })

  it('renders inline pdf preview for uppercase MIME types when previewSupported is true', async () => {
    vi.spyOn(apiClient, 'getBlob').mockResolvedValue(new Blob(['pdf'], { type: 'APPLICATION/PDF' }))

    render(
      <AttachmentViewerModal
        isOpen
        onClose={vi.fn()}
        title="Email Attachments"
        attachments={[
          {
            id: 'pdf-2',
            fileName: 'scan.pdf',
            contentType: 'APPLICATION/PDF',
            size: 2048,
            previewSupported: true,
            downloadUrl: '/api/tickets/t1/emails/e1/attachments/a2/content',
          },
        ]}
      />,
    )

    await waitFor(() => {
      expect(screen.getByTitle('scan.pdf')).toHaveAttribute('src', 'blob:attachment-preview')
    })
  })

  it('shows a metadata-only fallback when no access URL is returned', () => {
    render(
      <AttachmentViewerModal
        isOpen
        onClose={vi.fn()}
        title="Email Attachments"
        attachments={[
          {
            id: 'a3',
            fileName: 'archive.zip',
            contentType: 'application/zip',
            size: 128,
            previewSupported: false,
            downloadUrl: null,
          },
        ]}
      />,
    )

    expect(screen.getByText('This attachment has metadata only. Preview/open/download is unavailable because the backend did not return an access URL.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Open' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Download' })).not.toBeInTheDocument()
  })

  it('shows open and download actions when preview is unavailable for a previewable file', () => {
    render(
      <AttachmentViewerModal
        isOpen
        onClose={vi.fn()}
        title="Email Attachments"
        attachments={[
          {
            id: 'a4',
            fileName: 'statement.pdf',
            contentType: 'application/pdf',
            size: 512,
            previewSupported: false,
            downloadUrl: '/files/statement.pdf',
          },
        ]}
      />,
    )

    expect(screen.getByText('Inline preview is not available for this attachment.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Download' })).toBeInTheDocument()
  })

  it('shows open/download fallback for non-previewable file types', () => {
    render(
      <AttachmentViewerModal
        isOpen
        onClose={vi.fn()}
        title="Email Attachments"
        attachments={[
          {
            id: 'a5',
            fileName: 'archive.zip',
            contentType: 'application/zip',
            size: 4096,
            previewSupported: true,
            downloadUrl: '/files/archive.zip',
          },
        ]}
      />,
    )

    expect(screen.getByText('Inline preview is not available for this file type.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Download' })).toBeInTheDocument()
  })

  it('keeps fallback behavior for uppercase non-previewable MIME types', () => {
    render(
      <AttachmentViewerModal
        isOpen
        onClose={vi.fn()}
        title="Email Attachments"
        attachments={[
          {
            id: 'a5b',
            fileName: 'archive.zip',
            contentType: 'APPLICATION/ZIP',
            size: 4096,
            previewSupported: true,
            downloadUrl: '/api/tickets/t1/emails/e1/attachments/a3/content',
          },
        ]}
      />,
    )

    expect(screen.getByText('Inline preview is not available for this file type.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Download' })).toBeInTheDocument()
  })

  it('shows a graceful fallback when content fetch fails for a previewable attachment', async () => {
    vi.spyOn(apiClient, 'getBlob').mockRejectedValue(new ApiError(401, 'unauthorized', 'Unauthorized'))

    render(
      <AttachmentViewerModal
        isOpen
        onClose={vi.fn()}
        title="Email Attachments"
        attachments={[
          {
            id: 'a6',
            fileName: 'broken.pdf',
            contentType: 'application/pdf',
            size: 512,
            previewSupported: true,
            downloadUrl: '/files/broken.pdf',
          },
        ]}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('Preview could not be loaded. Unauthorized')).toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: 'Open' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Download' })).toBeInTheDocument()
  })

  it('shows a clear error when open fails after a content fetch error', async () => {
    vi.spyOn(apiClient, 'getBlob').mockRejectedValue(new ApiError(500, 'attachment_error', 'Attachment fetch failed'))

    render(
      <AttachmentViewerModal
        isOpen
        onClose={vi.fn()}
        title="Email Attachments"
        attachments={[
          {
            id: 'a7',
            fileName: 'report.pdf',
            contentType: 'application/pdf',
            size: 1024,
            previewSupported: false,
            downloadUrl: '/files/report.pdf',
          },
        ]}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Open' }))

    await waitFor(() => {
      expect(screen.getByText('Open failed. Attachment fetch failed')).toBeInTheDocument()
    })
  })

  it('shows a loading state while attachment metadata is being hydrated', () => {
    render(
      <AttachmentViewerModal
        isOpen
        onClose={vi.fn()}
        title="Email Attachments"
        attachments={[]}
        isLoading
      />,
    )

    expect(screen.getByText('Loading attachment details...')).toBeInTheDocument()
  })
})