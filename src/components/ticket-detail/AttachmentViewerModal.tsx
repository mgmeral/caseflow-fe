import { useEffect, useMemo, useRef, useState } from 'react'
import { Download, ExternalLink, FileText, Image as ImageIcon, Paperclip } from 'lucide-react'
import { Modal } from '@/components/shared/Modal'
import { Button } from '@/components/shared/Button'
import { apiClient, ApiError } from '@/services/api.client'

export interface AttachmentViewerItem {
  id: string | null
  fileName: string
  contentType: string | null
  size: number | null
  previewSupported?: boolean | null
  previewUrl?: string | null
  openUrl?: string | null
  downloadUrl: string | null
}

interface AttachmentViewerModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  attachments: AttachmentViewerItem[]
  isLoading?: boolean
  unavailableMessage?: string
}

function formatFileSize(size: number | null): string {
  if (size == null) return 'Unknown size'
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function normalizeContentType(contentType: string | null): string | null {
  return contentType?.trim().toLowerCase() ?? null
}

type PreviewKind = 'image' | 'pdf' | 'text' | 'none'

function getPreviewKind(contentType: string | null): PreviewKind {
  if (!contentType) return 'none'
  const normalizedContentType = normalizeContentType(contentType)
  if (!normalizedContentType) return 'none'
  if (normalizedContentType.startsWith('image/')) return 'image'
  if (normalizedContentType === 'application/pdf') return 'pdf'
  if (
    normalizedContentType.startsWith('text/')
    || normalizedContentType.includes('json')
    || normalizedContentType.includes('xml')
  ) {
    return 'text'
  }
  return 'none'
}

function isTextPreviewType(contentType: string | null): boolean {
  return getPreviewKind(contentType) === 'text'
}

function getAttachmentContentPath(attachment: AttachmentViewerItem | null): string | null {
  return attachment?.downloadUrl ?? attachment?.openUrl ?? attachment?.previewUrl ?? null
}

function logAttachmentDebug(event: string, details: Record<string, unknown>) {
  if (!import.meta.env.DEV || import.meta.env.MODE === 'test') return
  console.debug('[attachment-flow]', event, details)
}

function createBlobUrl(blob: Blob, fallbackContentType: string | null): { blob: Blob; url: string } {
  const typedBlob = blob.type || !fallbackContentType ? blob : blob.slice(0, blob.size, fallbackContentType)
  return {
    blob: typedBlob,
    url: URL.createObjectURL(typedBlob),
  }
}

type AttachmentAction = 'preview' | 'open' | 'download'

export function AttachmentViewerModal({
  isOpen,
  onClose,
  title,
  attachments,
  isLoading = false,
  unavailableMessage = 'Attachment metadata is not available for this item.',
}: AttachmentViewerModalProps) {
  const [selectedAttachmentId, setSelectedAttachmentId] = useState<string | null>(null)
  const [textPreview, setTextPreview] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [pendingAction, setPendingAction] = useState<Exclude<AttachmentAction, 'preview'> | null>(null)
  const objectUrlRef = useRef<string | null>(null)
  const loadedBlobRef = useRef<Blob | null>(null)
  const loadedContentPathRef = useRef<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setSelectedAttachmentId(attachments[0]?.id ?? attachments[0]?.fileName ?? null)
  }, [attachments, isOpen])

  const selectedAttachment = useMemo(
    () => attachments.find((item) => (item.id ?? item.fileName) === selectedAttachmentId) ?? attachments[0] ?? null,
    [attachments, selectedAttachmentId],
  )

  const selectedAttachmentKey = selectedAttachment?.id ?? selectedAttachment?.fileName ?? null
  const contentPath = getAttachmentContentPath(selectedAttachment)
  const hasAccessUrl = Boolean(contentPath)
  const normalizedSelectedContentType = normalizeContentType(selectedAttachment?.contentType ?? null)
  const previewKind = getPreviewKind(normalizedSelectedContentType)
  const canPreviewType = previewKind !== 'none'
  const supportsInlinePreview = Boolean(
    selectedAttachment
    && contentPath
    && (
      selectedAttachment.previewSupported != null
        ? selectedAttachment.previewSupported && canPreviewType
        : canPreviewType
    ),
  )
  const showPreviewUnavailableFallback = Boolean(
    selectedAttachment
    && hasAccessUrl
    && canPreviewType
    && !supportsInlinePreview,
  )

  const replaceObjectUrl = (nextUrl: string | null) => {
    if (objectUrlRef.current && objectUrlRef.current !== nextUrl) {
      URL.revokeObjectURL(objectUrlRef.current)
    }
    objectUrlRef.current = nextUrl
    setBlobUrl(nextUrl)
  }

  const resetLoadedContent = () => {
    loadedBlobRef.current = null
    loadedContentPathRef.current = null
    replaceObjectUrl(null)
    setTextPreview(null)
  }

  async function fetchAttachmentBlob(attachment: AttachmentViewerItem, action: AttachmentAction) {
    const attachmentPath = getAttachmentContentPath(attachment)
    if (!attachmentPath) {
      throw new Error('Attachment content is not available for this item.')
    }

    logAttachmentDebug('fetch:start', {
      action,
      attachmentId: attachment.id,
      fileName: attachment.fileName,
      endpoint: attachmentPath,
    })

    const blob = await apiClient.getBlob(attachmentPath)
    const fallbackContentType = attachment.contentType ?? 'application/octet-stream'
    const blobWithType = blob.type || !fallbackContentType ? blob : blob.slice(0, blob.size, fallbackContentType)

    logAttachmentDebug('fetch:success', {
      action,
      attachmentId: attachment.id,
      fileName: attachment.fileName,
      endpoint: attachmentPath,
      size: blobWithType.size,
      contentType: blobWithType.type || fallbackContentType,
    })

    return {
      accessPath: attachmentPath,
      blob: blobWithType,
      contentType: blobWithType.type || fallbackContentType,
    }
  }

  async function ensureAttachmentBlob(action: AttachmentAction) {
    if (!selectedAttachment || !contentPath) {
      setActionError('Attachment content is not available for this item.')
      return null
    }

    setActionError(null)

    if (
      loadedBlobRef.current
      && loadedContentPathRef.current === contentPath
      && objectUrlRef.current
    ) {
      logAttachmentDebug('fetch:cache-hit', {
        action,
        attachmentId: selectedAttachment.id,
        fileName: selectedAttachment.fileName,
        endpoint: contentPath,
      })
      return {
        blob: loadedBlobRef.current,
        url: objectUrlRef.current,
        contentType: loadedBlobRef.current.type || selectedAttachment.contentType || 'application/octet-stream',
      }
    }

    const result = await fetchAttachmentBlob(selectedAttachment, action)
    const nextObjectUrl = createBlobUrl(result.blob, result.contentType)

    loadedBlobRef.current = nextObjectUrl.blob
    loadedContentPathRef.current = result.accessPath
    replaceObjectUrl(nextObjectUrl.url)

    if (isTextPreviewType(result.contentType)) {
      setTextPreview(await nextObjectUrl.blob.text())
    } else {
      setTextPreview(null)
    }

    return {
      blob: nextObjectUrl.blob,
      url: nextObjectUrl.url,
      contentType: result.contentType,
    }
  }

  useEffect(() => {
    if (!isOpen) {
      resetLoadedContent()
      setPreviewError(null)
      setActionError(null)
      setIsPreviewLoading(false)
      setPendingAction(null)
      return
    }

    resetLoadedContent()
    setPreviewError(null)
    setActionError(null)
  }, [isOpen, selectedAttachmentKey])

  useEffect(() => {
    if (!isOpen || !supportsInlinePreview || !selectedAttachment) return

    let active = true
    setIsPreviewLoading(true)
    setPreviewError(null)

    ensureAttachmentBlob('preview')
      .then((result) => {
        if (!active || !result) return
        logAttachmentDebug('preview:ready', {
          attachmentId: selectedAttachment.id,
          fileName: selectedAttachment.fileName,
          mode: getPreviewKind(result.contentType),
        })
      })
      .catch((error: unknown) => {
        if (!active) return
        const message = error instanceof ApiError
          ? error.message
          : 'Attachment content could not be loaded.'
        setPreviewError(`Preview could not be loaded. ${message}`)
        logAttachmentDebug('preview:error', {
          attachmentId: selectedAttachment.id,
          fileName: selectedAttachment.fileName,
          endpoint: contentPath,
          message,
        })
      })
      .finally(() => {
        if (active) setIsPreviewLoading(false)
      })

    return () => {
      active = false
    }
  }, [contentPath, isOpen, selectedAttachment, supportsInlinePreview])

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
      }
    }
  }, [])

  const handleOpen = async () => {
    if (!selectedAttachment) return
    setPendingAction('open')
    try {
      const result = await ensureAttachmentBlob('open')
      if (!result) return
      const anchor = document.createElement('a')
      anchor.href = result.url
      anchor.target = '_blank'
      anchor.rel = 'noopener noreferrer'
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      logAttachmentDebug('action:open', {
        attachmentId: selectedAttachment.id,
        fileName: selectedAttachment.fileName,
        endpoint: contentPath,
      })
    } catch (error) {
      const message = error instanceof ApiError
        ? error.message
        : 'Attachment content could not be loaded.'
      setActionError(`Open failed. ${message}`)
      logAttachmentDebug('action:error', {
        action: 'open',
        attachmentId: selectedAttachment.id,
        fileName: selectedAttachment.fileName,
        endpoint: contentPath,
        message,
      })
    } finally {
      setPendingAction(null)
    }
  }

  const handleDownload = async () => {
    if (!selectedAttachment) return
    setPendingAction('download')
    try {
      const result = await ensureAttachmentBlob('download')
      if (!result) return
      const anchor = document.createElement('a')
      anchor.href = result.url
      anchor.download = selectedAttachment.fileName
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      logAttachmentDebug('action:download', {
        attachmentId: selectedAttachment.id,
        fileName: selectedAttachment.fileName,
        endpoint: contentPath,
      })
    } catch (error) {
      const message = error instanceof ApiError
        ? error.message
        : 'Attachment content could not be loaded.'
      setActionError(`Download failed. ${message}`)
      logAttachmentDebug('action:error', {
        action: 'download',
        attachmentId: selectedAttachment.id,
        fileName: selectedAttachment.fileName,
        endpoint: contentPath,
        message,
      })
    } finally {
      setPendingAction(null)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="xl">
      {attachments.length === 0 ? (
        isLoading ? (
          <div className="text-sm text-gray-500">Loading attachment details...</div>
        ) : (
          <div className="text-sm text-gray-500">{unavailableMessage}</div>
        )
      ) : (
        <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
          <div className="surface-section min-w-0 overflow-hidden rounded-xl p-0">
            <div className="table-toolbar px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Attachments
            </div>
            <div className="max-h-48 overflow-y-auto divide-y divide-white/60 sm:max-h-[26rem]">
              {attachments.map((attachment) => {
                const key = attachment.id ?? attachment.fileName
                const isSelected = key === (selectedAttachment?.id ?? selectedAttachment?.fileName)
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedAttachmentId(key)}
                    className={`w-full px-4 py-3 text-left transition-colors ${isSelected ? 'bg-[#eef5ff]' : 'hover:bg-white/70'}`}
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

          <div className="surface-section min-w-0 overflow-hidden rounded-xl p-3 sm:p-4">
            {selectedAttachment ? (
              <div className="min-w-0 space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="truncate text-base font-semibold text-gray-900">{selectedAttachment.fileName}</div>
                    <div className="mt-1 break-words text-sm text-gray-500">{selectedAttachment.contentType ?? 'Unknown content type'} · {formatFileSize(selectedAttachment.size)}</div>
                  </div>
                  <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap">
                    {hasAccessUrl && (
                      <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<ExternalLink size={13} />}
                        isLoading={pendingAction === 'open'}
                        onClick={() => void handleOpen()}
                        className="flex-1 sm:flex-none"
                      >
                        Open
                      </Button>
                    )}
                    {hasAccessUrl && (
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<Download size={13} />}
                        isLoading={pendingAction === 'download'}
                        onClick={() => void handleDownload()}
                        className="flex-1 sm:flex-none"
                      >
                        Download
                      </Button>
                    )}
                  </div>
                </div>

                {actionError ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {actionError}
                  </div>
                ) : null}

                {!hasAccessUrl ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    This attachment has metadata only. Preview/open/download is unavailable because the backend did not return an access URL.
                  </div>
                ) : supportsInlinePreview ? (
                  previewError ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                      {previewError}
                    </div>
                  ) : isPreviewLoading ? (
                    <div className="flex min-h-[18rem] items-center justify-center rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-500">
                      Loading preview...
                    </div>
                  ) : previewKind === 'image' ? (
                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white p-2">
                      <img src={blobUrl ?? undefined} alt={selectedAttachment.fileName} className="max-h-[28rem] w-full object-contain" />
                    </div>
                  ) : previewKind === 'pdf' ? (
                    <iframe src={blobUrl ?? undefined} title={selectedAttachment.fileName} className="h-[20rem] w-full rounded-lg border border-gray-200 bg-white sm:h-[24rem] lg:h-[28rem]" />
                  ) : (
                    <div className="max-h-[24rem] min-h-[18rem] overflow-auto rounded-lg border border-gray-200 bg-slate-950 p-4 text-sm text-slate-100">
                      {textPreview != null ? (
                        <pre className="whitespace-pre-wrap font-sans">{textPreview}</pre>
                      ) : (
                        <span className="text-slate-400">Loading preview...</span>
                      )}
                    </div>
                  )
                ) : showPreviewUnavailableFallback ? (
                  <div className="flex min-h-[18rem] items-center justify-center rounded-lg border border-dashed border-amber-300 bg-amber-50 p-6 text-center">
                    <div>
                      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                        <FileText size={18} />
                      </div>
                      <div className="text-sm font-medium text-amber-900">Inline preview is not available for this attachment.</div>
                      <div className="mt-1 text-xs text-amber-800">Use Open or Download to inspect the file.</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex min-h-[18rem] items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center">
                    <div>
                      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                        {previewKind === 'image' ? <ImageIcon size={18} /> : <FileText size={18} />}
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