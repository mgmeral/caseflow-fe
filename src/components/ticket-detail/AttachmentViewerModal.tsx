import { useEffect, useMemo, useState } from 'react'
import { Download, ExternalLink, FileText, Image as ImageIcon, Paperclip } from 'lucide-react'
import { Modal } from '@/components/shared/Modal'
import { Button } from '@/components/shared/Button'

export interface AttachmentViewerItem {
  id: string | null
  fileName: string
  contentType: string | null
  size: number | null
  downloadUrl: string | null
}

interface AttachmentViewerModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  attachments: AttachmentViewerItem[]
  unavailableMessage?: string
}

function formatFileSize(size: number | null): string {
  if (size == null) return 'Unknown size'
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function canPreviewInline(contentType: string | null): boolean {
  if (!contentType) return false
  return contentType.startsWith('image/')
    || contentType === 'application/pdf'
    || contentType.startsWith('text/')
    || contentType.includes('json')
    || contentType.includes('xml')
}

export function AttachmentViewerModal({
  isOpen,
  onClose,
  title,
  attachments,
  unavailableMessage = 'Attachment metadata is not available for this item.',
}: AttachmentViewerModalProps) {
  const [selectedAttachmentId, setSelectedAttachmentId] = useState<string | null>(null)
  const [textPreview, setTextPreview] = useState<string | null>(null)
  const [textPreviewError, setTextPreviewError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setSelectedAttachmentId(attachments[0]?.id ?? attachments[0]?.fileName ?? null)
  }, [attachments, isOpen])

  const selectedAttachment = useMemo(
    () => attachments.find((item) => (item.id ?? item.fileName) === selectedAttachmentId) ?? attachments[0] ?? null,
    [attachments, selectedAttachmentId],
  )

  useEffect(() => {
    setTextPreview(null)
    setTextPreviewError(null)

    if (!isOpen || !selectedAttachment?.downloadUrl || !selectedAttachment.contentType) return
    const isText = selectedAttachment.contentType.startsWith('text/')
      || selectedAttachment.contentType.includes('json')
      || selectedAttachment.contentType.includes('xml')

    if (!isText) return

    let active = true

    fetch(selectedAttachment.downloadUrl)
      .then((response) => {
        if (!response.ok) throw new Error('Preview request failed')
        return response.text()
      })
      .then((content) => {
        if (active) setTextPreview(content)
      })
      .catch(() => {
        if (active) setTextPreviewError('Text preview could not be loaded.')
      })

    return () => {
      active = false
    }
  }, [isOpen, selectedAttachment])

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="xl">
      {attachments.length === 0 ? (
        <div className="text-sm text-gray-500">{unavailableMessage}</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Attachments
            </div>
            <div className="max-h-[26rem] overflow-y-auto divide-y divide-gray-100">
              {attachments.map((attachment) => {
                const key = attachment.id ?? attachment.fileName
                const isSelected = key === (selectedAttachment?.id ?? selectedAttachment?.fileName)
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedAttachmentId(key)}
                    className={`w-full px-4 py-3 text-left transition-colors ${isSelected ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
                  >
                    <div className="flex items-start gap-2">
                      <Paperclip size={14} className="mt-0.5 shrink-0 text-gray-400" />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-gray-900">{attachment.fileName}</div>
                        <div className="mt-1 text-xs text-gray-500">{attachment.contentType ?? 'Unknown content type'}</div>
                        <div className="text-xs text-gray-400">{formatFileSize(attachment.size)}</div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            {selectedAttachment ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold text-gray-900">{selectedAttachment.fileName}</div>
                    <div className="mt-1 text-sm text-gray-500">{selectedAttachment.contentType ?? 'Unknown content type'} · {formatFileSize(selectedAttachment.size)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedAttachment.downloadUrl && (
                      <a href={selectedAttachment.downloadUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="secondary" size="sm" leftIcon={<ExternalLink size={13} />}>
                          Open
                        </Button>
                      </a>
                    )}
                    {selectedAttachment.downloadUrl && (
                      <a href={selectedAttachment.downloadUrl} download={selectedAttachment.fileName}>
                        <Button variant="primary" size="sm" leftIcon={<Download size={13} />}>
                          Download
                        </Button>
                      </a>
                    )}
                  </div>
                </div>

                {!selectedAttachment.downloadUrl ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    This attachment has metadata only. Open/download is unavailable because the backend did not return a download URL.
                  </div>
                ) : canPreviewInline(selectedAttachment.contentType) ? (
                  selectedAttachment.contentType?.startsWith('image/') ? (
                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white p-2">
                      <img src={selectedAttachment.downloadUrl} alt={selectedAttachment.fileName} className="max-h-[28rem] w-full object-contain" />
                    </div>
                  ) : selectedAttachment.contentType === 'application/pdf' ? (
                    <iframe src={selectedAttachment.downloadUrl} title={selectedAttachment.fileName} className="h-[28rem] w-full rounded-lg border border-gray-200 bg-white" />
                  ) : (
                    <div className="min-h-[18rem] rounded-lg border border-gray-200 bg-slate-950 p-4 text-sm text-slate-100">
                      {textPreviewError ? (
                        <span className="text-red-300">{textPreviewError}</span>
                      ) : textPreview != null ? (
                        <pre className="whitespace-pre-wrap font-sans">{textPreview}</pre>
                      ) : (
                        <span className="text-slate-400">Loading preview...</span>
                      )}
                    </div>
                  )
                ) : (
                  <div className="flex min-h-[18rem] items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center">
                    <div>
                      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                        {selectedAttachment.contentType?.startsWith('image/') ? <ImageIcon size={18} /> : <FileText size={18} />}
                      </div>
                      <div className="text-sm font-medium text-gray-700">Inline preview is not available for this file type.</div>
                      <div className="mt-1 text-xs text-gray-500">Use Open or Download to inspect the attachment.</div>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </Modal>
  )
}