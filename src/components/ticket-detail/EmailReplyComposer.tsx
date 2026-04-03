import { useEffect, useState } from 'react'
import DOMPurify from 'dompurify'
import { Send, Mail, X, Eye } from 'lucide-react'
import { Button } from '@/components/shared/Button'
import { useSendTicketReply } from '@/hooks/useTicketEmails'
import { useMailboxes } from '@/hooks/useMailboxes'
import { useToast } from '@/hooks/useToast'
import { Modal } from '@/components/shared/Modal'
import { useTemplatePreview, useTemplates } from '@/hooks/useTemplates'
import type { SendTicketReplyRequest, TicketEmailMessage } from '@/types/email.types'

function getReplyStatusMessage(status: string, message: string | null) {
  switch (status) {
    case 'QUEUED':
      return { kind: 'success' as const, text: 'Reply accepted and queued for delivery.' }
    case 'PROCESSING':
    case 'SENDING':
      return { kind: 'success' as const, text: 'Reply accepted and is being sent.' }
    case 'SENT':
      return { kind: 'success' as const, text: 'Reply sent.' }
    case 'DISPATCHED':
      return { kind: 'success' as const, text: 'Reply dispatched to outbound delivery.' }
    case 'DELIVERED':
      return { kind: 'success' as const, text: 'Reply delivered.' }
    case 'FAILED':
    case 'PERMANENTLY_FAILED':
      return { kind: 'error' as const, text: message ?? 'Reply failed to send.' }
    case 'UNKNOWN':
      return { kind: 'success' as const, text: 'Reply request completed, but the backend did not return a send status yet.' }
    default:
      return { kind: 'success' as const, text: `Reply accepted (${status}).` }
  }
}

interface EmailReplyComposerProps {
  isOpen: boolean
  onClose: () => void
  ticketId: string
  /** Last inbound email in thread — used to populate defaults */
  lastInbound?: TicketEmailMessage | null
  /** Ticket subject fallback */
  ticketSubject?: string
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

interface ComposerFeedback {
  tone: 'info' | 'success' | 'error'
  text: string
}

export function EmailReplyComposer({
  isOpen,
  onClose,
  ticketId,
  lastInbound,
  ticketSubject,
}: EmailReplyComposerProps) {
  const { success, error: toastError } = useToast()
  const { data: mailboxData } = useMailboxes({ active: true })
  const templatesQuery = useTemplates(isOpen)
  const mailboxes = mailboxData?.items ?? []
  const templates = (templatesQuery.data ?? []).filter((template) => template.isActive)
  const sendMutation = useSendTicketReply(ticketId)
  const replySourceEventId = lastInbound?.sourceEventId ?? null
  const defaultSubject =
    lastInbound?.subject
      ? (lastInbound.subject.startsWith('Re:') ? lastInbound.subject : `Re: ${lastInbound.subject}`)
      : ticketSubject
        ? `Re: ${ticketSubject}`
        : ''

  // Form state
  const [mailboxId, setMailboxId] = useState<string>(lastInbound?.mailboxId ?? '')
  const [subject, setSubject] = useState(defaultSubject)
  const [body, setBody] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [selectedTemplateHtml, setSelectedTemplateHtml] = useState<string | null>(null)
  const [showTemplatePreview, setShowTemplatePreview] = useState(false)
  const [feedback, setFeedback] = useState<ComposerFeedback | null>(null)
  const previewQuery = useTemplatePreview(selectedTemplateId || null, isOpen && showTemplatePreview && !!selectedTemplateId)

  useEffect(() => {
    if (!isOpen) return

    setMailboxId(lastInbound?.mailboxId ?? '')
    setSubject(defaultSubject)
    setBody('')
    setSelectedTemplateId('')
    setSelectedTemplateHtml(null)
    setShowTemplatePreview(false)
    setFeedback(null)
  }, [defaultSubject, isOpen, lastInbound?.mailboxId])

  if (!isOpen) return null

  const handleSend = () => {
    if (!replySourceEventId) {
      toastError('No inbound email context is available for a real threaded reply.')
      return
    }
    if (!mailboxId) {
      toastError('Select the mailbox that should send this reply.')
      return
    }
    if (!body.trim()) {
      toastError('Message body cannot be empty.')
      return
    }

    const payload: SendTicketReplyRequest = {
      mailboxId: mailboxId || null,
      sourceEventId: replySourceEventId,
      subject: subject.trim(),
      textBody: body.trim(),
      ...(selectedTemplateHtml ? { htmlBody: selectedTemplateHtml } : {}),
      inReplyToMessageId: lastInbound?.messageId ?? undefined,
    }

    setFeedback({ tone: 'info', text: 'Sending reply...' })

    sendMutation.mutate(payload, {
      onSuccess: (result) => {
        const feedback = getReplyStatusMessage(result.status, result.message)
        setFeedback({ tone: feedback.kind, text: feedback.text })

        if (feedback.kind === 'error') {
          toastError(feedback.text)
          return
        }

        success(feedback.text)
        setSubject(defaultSubject)
        setBody('')
        setSelectedTemplateId('')
        setSelectedTemplateHtml(null)
      },
      onError: (err) => {
        const message = err instanceof Error ? err.message : 'Failed to send reply'
        setFeedback({ tone: 'error', text: message })
        toastError(message)
      },
    })
  }

  const resetAndClose = () => {
    setMailboxId(lastInbound?.mailboxId ?? '')
    setSubject(defaultSubject)
    setBody('')
    setSelectedTemplateId('')
    setSelectedTemplateHtml(null)
    setShowTemplatePreview(false)
    setFeedback(null)
    onClose()
  }

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId)
    setFeedback(null)

    const template = templates.find((item) => item.id === templateId)
    if (!template) {
      setSelectedTemplateHtml(null)
      setSubject(defaultSubject)
      setBody('')
      return
    }

    setSubject(template.subjectTemplate.trim() || defaultSubject)
    setBody(template.plainTextTemplate.trim() || stripHtml(template.htmlTemplate))
    setSelectedTemplateHtml(template.htmlTemplate || null)
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={resetAndClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Mail size={16} className="text-indigo-500" />
              <span className="text-sm font-semibold text-gray-800">Send Email Reply</span>
            </div>
            <button type="button" onClick={resetAndClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
              <X size={18} />
            </button>
          </div>

          {/* Form */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Mailbox */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Send From (Mailbox)</label>
              <select
                value={mailboxId}
                onChange={(e) => setMailboxId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="">— Auto / Default —</option>
                {mailboxes.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} ({m.address})</option>
                ))}
              </select>
            </div>

            {replySourceEventId ? (
              <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900">
                Reply target is derived from the selected inbound email context. Manual To entry is disabled in real reply mode.
              </div>
            ) : (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                No inbound email context is available. This screen only supports real threaded replies, so direct outreach is not enabled here.
              </div>
            )}

            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Real mode supports direct replies only. CC, BCC, and attachments are hidden until the backend supports them.
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="block text-xs font-medium text-gray-600">Template</label>
                {selectedTemplateId && (
                  <button type="button" className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800" onClick={() => setShowTemplatePreview(true)}>
                    <Eye size={12} />
                    Preview
                  </button>
                )}
              </div>
              <select
                value={selectedTemplateId}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="">No template</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>{template.name}</option>
                ))}
              </select>
              {templatesQuery.isError && (
                <p className="mt-1 text-xs text-amber-700">Template list is unavailable for this session.</p>
              )}
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Subject</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {/* Body */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Body *</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={10}
                autoFocus
                placeholder="Type your reply…"
                className="w-full text-sm resize-none border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSend()
                }}
              />
            </div>

            {feedback && (
              <div className={`rounded-lg px-3 py-2 text-xs ${feedback.tone === 'error' ? 'border border-red-200 bg-red-50 text-red-800' : feedback.tone === 'success' ? 'border border-emerald-200 bg-emerald-50 text-emerald-800' : 'border border-sky-200 bg-sky-50 text-sky-800'}`}>
                {feedback.text}
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <span className="text-xs text-gray-400">Ctrl + Enter to send</span>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={resetAndClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Send size={13} />}
                onClick={handleSend}
                isLoading={sendMutation.isPending}
                disabled={!mailboxId || !replySourceEventId || !body.trim() || sendMutation.isPending}
              >
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={showTemplatePreview} onClose={() => setShowTemplatePreview(false)} title="Template Preview" size="xl">
        {!selectedTemplateId ? (
          <div className="text-sm text-gray-500">Select a template first.</div>
        ) : previewQuery.isLoading ? (
          <div className="text-sm text-gray-500">Loading preview...</div>
        ) : previewQuery.isError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">Template preview is unavailable.</div>
        ) : previewQuery.data ? (
          <div className="space-y-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Subject</div>
              <div className="mt-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800">{previewQuery.data.subject || '—'}</div>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">HTML</div>
                <div className="min-h-[16rem] rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-800">
                  {previewQuery.data.html ? (
                    <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(previewQuery.data.html) }} />
                  ) : (
                    <span className="text-gray-400">HTML preview is empty.</span>
                  )}
                </div>
              </div>
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Plain Text</div>
                <div className="min-h-[16rem] rounded-lg border border-gray-200 bg-slate-950 p-3 text-sm text-slate-100">
                  {previewQuery.data.plainText ? (
                    <pre className="whitespace-pre-wrap font-sans">{previewQuery.data.plainText}</pre>
                  ) : (
                    <span className="text-slate-400">Plain text preview is empty.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  )
}
