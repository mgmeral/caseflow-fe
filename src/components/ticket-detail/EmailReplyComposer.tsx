import { useEffect, useMemo, useState } from 'react'
import DOMPurify from 'dompurify'
import { CalendarClock, Send, Mail, X, Eye } from 'lucide-react'
import { Button } from '@/components/shared/Button'
import { useSendTicketReply, useTicketReplyPreview } from '@/hooks/useTicketEmails'
import { useCreateScheduledEmail } from '@/hooks/useIntegrations'
import { useMailboxes } from '@/hooks/useMailboxes'
import { useToast } from '@/hooks/useToast'
import { Modal } from '@/components/shared/Modal'
import { useTemplates } from '@/hooks/useTemplates'
import type { SendTicketReplyRequest, TicketEmailMessage } from '@/types/email.types'
import { getReplyErrorFeedback, getReplyFeedback } from '@/lib/ticketEmailUi'
import { parseNumericContractId } from '@/lib/ticketEmailContracts'
import { resolveReplySourceEmail } from '@/lib/ticketReplySource'

interface EmailReplyComposerProps {
  isOpen: boolean
  onClose: () => void
  ticketId: string
  ticketPublicId: string | null
  /** Selected inbound email merged from thread summary + detail */
  replySourceEmail?: TicketEmailMessage | null
  /** Last inbound email in thread — used to populate defaults */
  lastInbound?: TicketEmailMessage | null
  /** Ticket subject fallback */
  ticketSubject?: string
  isTicketClosed?: boolean
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

interface ComposerFeedback {
  tone: 'info' | 'success' | 'error'
  text: string
}

function buildScheduleReasons(options: {
  isTicketClosed: boolean
  hasMailbox: boolean
  mailboxValid: boolean
  hasSourceEvent: boolean
  hasBody: boolean
  templateValid: boolean
  hasScheduleTime: boolean
  isScheduleTimeValid: boolean
}): string[] {
  const reasons: string[] = []

  if (options.isTicketClosed) reasons.push('Ticket is closed.')
  if (!options.hasMailbox) reasons.push('Select a mailbox.')
  if (options.hasMailbox && !options.mailboxValid) reasons.push('Mailbox id is invalid.')
  if (!options.hasSourceEvent) reasons.push('Reply source email is missing.')
  if (!options.hasBody) reasons.push('Reply body is empty.')
  if (!options.templateValid) reasons.push('Selected template is invalid.')
  if (!options.hasScheduleTime) reasons.push('Choose a schedule time.')
  if (options.hasScheduleTime && !options.isScheduleTimeValid) reasons.push('Choose a future schedule time.')

  return reasons
}

export function EmailReplyComposer({
  isOpen,
  onClose,
  ticketId,
  ticketPublicId,
  replySourceEmail,
  lastInbound,
  ticketSubject,
  isTicketClosed = false,
}: EmailReplyComposerProps) {
  const { success, error: toastError, info } = useToast()
  const { data: mailboxData } = useMailboxes({ active: true })
  const templatesQuery = useTemplates(isOpen)
  const mailboxes = mailboxData?.items ?? []
  const templates = (templatesQuery.data ?? []).filter((template) => template.isActive)
  const sendMutation = useSendTicketReply(ticketId)
  const scheduleMutation = useCreateScheduledEmail(ticketPublicId ?? '')
  const resolvedReplySource = useMemo(
    () => resolveReplySourceEmail({ selectedInboundEmail: replySourceEmail, lastInboundEmail: lastInbound }),
    [lastInbound, replySourceEmail],
  )
  const effectiveInboundEmail = resolvedReplySource.email
  const replySourceEventId = resolvedReplySource.sourceEventId
  const defaultSubject =
    effectiveInboundEmail?.subject
      ? (effectiveInboundEmail.subject.startsWith('Re:') ? effectiveInboundEmail.subject : `Re: ${effectiveInboundEmail.subject}`)
      : ticketSubject
        ? `Re: ${ticketSubject}`
        : ''

  // Form state
  const [mailboxId, setMailboxId] = useState<string>(effectiveInboundEmail?.mailboxId ?? '')
  const [subject, setSubject] = useState(defaultSubject)
  const [body, setBody] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [selectedTemplateHtml, setSelectedTemplateHtml] = useState<string | null>(null)
  const [showTemplatePreview, setShowTemplatePreview] = useState(false)
  const [feedback, setFeedback] = useState<ComposerFeedback | null>(null)
  const [contentWasEdited, setContentWasEdited] = useState(false)
  const [lastAppliedPreviewKey, setLastAppliedPreviewKey] = useState('')
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [scheduleAt, setScheduleAt] = useState('')
  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId) ?? null
  const mailboxNumericId = parseNumericContractId(mailboxId)
  const defaultMailboxNumericId = parseNumericContractId(effectiveInboundEmail?.mailboxId)
  const selectedTemplateNumericId = parseNumericContractId(selectedTemplateId)
  const isReplyContextMissing = resolvedReplySource.hasInboundContext && replySourceEventId == null
  const isMailboxSelectionInvalid = Boolean(mailboxId) && mailboxNumericId == null
  const isTemplateSelectionInvalid = Boolean(selectedTemplateId) && selectedTemplateNumericId == null
  const hasComposedBody = Boolean(body.trim() || (selectedTemplateHtml && !contentWasEdited))
  const previewPayload = useMemo(() => {
    if (replySourceEventId == null) return null
    if (selectedTemplateId && selectedTemplateNumericId == null) return null

    return {
      sourceEventId: replySourceEventId,
      mailboxId: mailboxNumericId ?? defaultMailboxNumericId,
      templateId: selectedTemplateNumericId,
    }
  }, [defaultMailboxNumericId, mailboxNumericId, replySourceEventId, selectedTemplateId, selectedTemplateNumericId])
  const previewQuery = useTicketReplyPreview(ticketPublicId ?? '', previewPayload, isOpen && !!ticketPublicId && replySourceEventId != null)
  const selectedMailbox = mailboxes.find((mailbox) => mailbox.id === mailboxId) ?? null

  useEffect(() => {
    if (!isOpen) return

    setMailboxId(effectiveInboundEmail?.mailboxId ?? '')
    setSubject(defaultSubject)
    setBody('')
    setSelectedTemplateId('')
    setSelectedTemplateHtml(null)
    setShowTemplatePreview(false)
    setFeedback(null)
    setContentWasEdited(false)
    setLastAppliedPreviewKey('')
  }, [defaultSubject, effectiveInboundEmail?.mailboxId, isOpen])

  const resolvedToAddress = previewQuery.data?.derivedToAddress ?? effectiveInboundEmail?.replyContext?.resolvedReplyTarget ?? effectiveInboundEmail?.resolvedReplyTarget ?? ''
  const canBackendResolveRecipient = replySourceEventId != null
  const recipientState = resolvedToAddress.trim() ? 'resolved' : canBackendResolveRecipient ? 'backend-resolved' : 'unresolved'
  const parsedScheduleDate = scheduleAt ? new Date(scheduleAt) : null
  const isScheduleTimeValid = Boolean(parsedScheduleDate && !Number.isNaN(parsedScheduleDate.getTime()) && parsedScheduleDate.getTime() > Date.now())
  const scheduleOpenReasons = buildScheduleReasons({
    isTicketClosed,
    hasMailbox: Boolean(mailboxId),
    mailboxValid: !isMailboxSelectionInvalid,
    hasSourceEvent: replySourceEventId != null,
    hasBody: hasComposedBody,
    templateValid: !isTemplateSelectionInvalid,
    hasScheduleTime: true,
    isScheduleTimeValid: true,
  }).filter((reason) => reason !== 'Choose a schedule time.' && reason !== 'Choose a future schedule time.')
  const confirmScheduleReasons = buildScheduleReasons({
    isTicketClosed,
    hasMailbox: Boolean(mailboxId),
    mailboxValid: !isMailboxSelectionInvalid,
    hasSourceEvent: replySourceEventId != null,
    hasBody: hasComposedBody,
    templateValid: !isTemplateSelectionInvalid,
    hasScheduleTime: Boolean(scheduleAt),
    isScheduleTimeValid,
  })
  const scheduleAdvisory = !resolvedToAddress.trim() && canBackendResolveRecipient
    ? 'Recipient preview is unavailable right now. The backend will resolve the reply target from the source email when you schedule it.'
    : null

  useEffect(() => {
    if (!isOpen || !previewPayload) return

    if (previewQuery.data) {
      const nextPreviewKey = JSON.stringify([
        previewPayload.sourceEventId,
        previewPayload.mailboxId,
        previewPayload.templateId,
        previewQuery.data.subject,
        previewQuery.data.bodyText,
        previewQuery.data.bodyHtml,
      ])

      if (lastAppliedPreviewKey === nextPreviewKey) {
        return
      }

      setSubject(previewQuery.data.subject.trim() || selectedTemplate?.subjectTemplate.trim() || defaultSubject)

      const previewPlainText = previewQuery.data.bodyText?.trim()
      const previewHtml = previewQuery.data.bodyHtml?.trim() || null
      setBody(previewPlainText || stripHtml(previewHtml ?? selectedTemplate?.htmlTemplate ?? '') || selectedTemplate?.plainTextTemplate.trim() || '')
      setSelectedTemplateHtml(previewHtml ?? selectedTemplate?.htmlTemplate ?? null)
      setContentWasEdited(false)
      setLastAppliedPreviewKey(nextPreviewKey)
      return
    }

    if (selectedTemplate && previewQuery.isError) {
      setSubject(selectedTemplate.subjectTemplate.trim() || defaultSubject)
      setBody(selectedTemplate.plainTextTemplate.trim() || stripHtml(selectedTemplate.htmlTemplate))
      setSelectedTemplateHtml(selectedTemplate.htmlTemplate || null)
      setContentWasEdited(false)
    }
  }, [defaultSubject, isOpen, lastAppliedPreviewKey, previewPayload, previewQuery.data, previewQuery.isError, selectedTemplate])

  if (!isOpen) return null

  const handleSend = () => {
    if (replySourceEventId == null) {
      toastError('This message cannot be replied to because its inbound event reference is missing.')
      return
    }
    if (!mailboxId) {
      toastError('Select the mailbox that should send this reply.')
      return
    }
    if (mailboxNumericId == null) {
      toastError('Reply context is invalid. Mailbox id must be numeric.')
      return
    }
    if (selectedTemplateId && selectedTemplateNumericId == null) {
      toastError('Selected template id is invalid.')
      return
    }
    if (!body.trim() && !(selectedTemplateHtml && !contentWasEdited)) {
      toastError('Reply body cannot be empty.')
      return
    }

    const payload: SendTicketReplyRequest = {
      mailboxId: mailboxNumericId,
      sourceEventId: replySourceEventId,
      subject: subject.trim(),
      textBody: body.trim() || null,
      ...(selectedTemplateHtml && !contentWasEdited ? { htmlBody: selectedTemplateHtml } : {}),
      contentWasEdited,
      templateId: selectedTemplateNumericId,
    }

    setFeedback({ tone: 'info', text: 'Sending reply...' })

    sendMutation.mutate(payload, {
      onSuccess: (result) => {
        const feedback = getReplyFeedback(result.status, result.message)
        setFeedback({ tone: feedback.tone, text: feedback.text })

        if (feedback.tone === 'error') {
          toastError(feedback.text)
          return
        }

        if (feedback.tone === 'success') {
          success(feedback.text)
        } else {
          info(feedback.text)
        }
        setSubject(defaultSubject)
        setBody('')
        setSelectedTemplateId('')
        setSelectedTemplateHtml(null)
        setContentWasEdited(false)
      },
      onError: (err) => {
        const message = getReplyErrorFeedback(err, {
          action: 'send',
          mailboxLabel: selectedMailbox ? `${selectedMailbox.name} (${selectedMailbox.address})` : null,
          hasMailbox: Boolean(mailboxId),
          sourceEventState: replySourceEventId == null ? 'missing' : 'valid',
          templateLabel: selectedTemplate?.name ?? null,
          templateState: selectedTemplateId ? (selectedTemplateNumericId == null ? 'invalid' : 'valid') : 'missing',
          hasSubject: Boolean(subject.trim()),
          hasBody: Boolean(body.trim() || (selectedTemplateHtml && !contentWasEdited)),
        })
        setFeedback({ tone: 'error', text: message })
        toastError(message)
      },
    })
  }

  const resetAndClose = () => {
    setMailboxId(effectiveInboundEmail?.mailboxId ?? '')
    setSubject(defaultSubject)
    setBody('')
    setSelectedTemplateId('')
    setSelectedTemplateHtml(null)
    setShowTemplatePreview(false)
    setFeedback(null)
    setContentWasEdited(false)
    setLastAppliedPreviewKey('')
    setShowScheduleModal(false)
    setScheduleAt('')
    onClose()
  }

  const handleSchedule = () => {
    if (isTicketClosed) {
      toastError('Scheduled email is not available for closed tickets.')
      return
    }
    if (!ticketPublicId) {
      toastError('Scheduled email requires the ticket public identifier.')
      return
    }
    if (replySourceEventId == null) {
      toastError('This message cannot be replied to because its inbound event reference is missing.')
      return
    }
    if (!mailboxId) {
      toastError('Select the mailbox that should send this scheduled email.')
      return
    }
    if (mailboxNumericId == null) {
      toastError('Reply context is invalid. Mailbox id must be numeric.')
      return
    }
    if (selectedTemplateId && selectedTemplateNumericId == null) {
      toastError('Selected template id is invalid.')
      return
    }
    if (!body.trim() && !(selectedTemplateHtml && !contentWasEdited)) {
      toastError('Reply body cannot be empty.')
      return
    }
    if (!scheduleAt) {
      toastError('Choose a future send time.')
      return
    }

    const scheduledTimestamp = new Date(scheduleAt)
    if (Number.isNaN(scheduledTimestamp.getTime()) || scheduledTimestamp.getTime() <= Date.now()) {
      toastError('Scheduled send time must be in the future.')
      return
    }

    scheduleMutation.mutate(
      {
        mailboxId: mailboxNumericId,
        toAddress: resolvedToAddress.trim() || null,
        subject: subject.trim(),
        textBody: body.trim(),
        htmlBody: selectedTemplateHtml && !contentWasEdited ? selectedTemplateHtml : null,
        sendNotBefore: scheduledTimestamp.toISOString(),
        sourceEventId: replySourceEventId,
        templateId: selectedTemplateNumericId,
        contentWasEdited,
      },
      {
        onSuccess: (result) => {
          const message = `Email scheduled for ${new Date(result.sendNotBefore).toLocaleString()}.`
          setFeedback({ tone: 'success', text: message })
          success(message)
          setShowScheduleModal(false)
          setScheduleAt('')
          setSubject(defaultSubject)
          setBody('')
          setSelectedTemplateId('')
          setSelectedTemplateHtml(null)
          setContentWasEdited(false)
        },
        onError: (error) => {
          const message = getReplyErrorFeedback(error, {
            action: 'schedule',
            mailboxLabel: selectedMailbox ? `${selectedMailbox.name} (${selectedMailbox.address})` : null,
            hasMailbox: Boolean(mailboxId),
            sourceEventState: replySourceEventId == null ? 'missing' : 'valid',
            templateLabel: selectedTemplate?.name ?? null,
            templateState: selectedTemplateId ? (selectedTemplateNumericId == null ? 'invalid' : 'valid') : 'missing',
            hasSubject: Boolean(subject.trim()),
            hasBody: hasComposedBody,
            recipientState,
            hasScheduleTime: Boolean(scheduleAt),
          })
          setFeedback({ tone: 'error', text: message })
          toastError(message)
        },
      },
    )
  }

  const handleTemplateChange = (templateId: string) => {
    const parsedTemplateId = parseNumericContractId(templateId)

    setSelectedTemplateId(templateId)
    setFeedback(null)
    setShowTemplatePreview(false)

    if (templateId && parsedTemplateId == null) {
      setSelectedTemplateId('')
      setSelectedTemplateHtml(null)
      setSubject(defaultSubject)
      setBody('')
      setContentWasEdited(false)
      setLastAppliedPreviewKey('')
      toastError('Selected template id is invalid.')
      return
    }

    const template = templates.find((item) => item.id === templateId)
    if (!template) {
      setSelectedTemplateHtml(null)
      setSubject(defaultSubject)
      setBody('')
      setContentWasEdited(false)
      setLastAppliedPreviewKey('')
      return
    }

    setSubject(template.subjectTemplate.trim() || defaultSubject)
    setBody(template.plainTextTemplate.trim() || stripHtml(template.htmlTemplate))
    setSelectedTemplateHtml(template.htmlTemplate || null)
    setContentWasEdited(false)
    setLastAppliedPreviewKey('')
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-slate-950/34 backdrop-blur-sm" onClick={resetAndClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="operational-modal flex max-h-[85vh] w-full max-w-2xl flex-col">
          {/* Header */}
          <div className="operational-modal-header flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-2">
              <Mail size={16} className="text-indigo-500" />
              <span className="text-sm font-semibold text-gray-800">Send Email Reply</span>
            </div>
            <button type="button" onClick={resetAndClose} className="ui-icon-button h-9 w-9" aria-label="Close">
              <X size={18} />
            </button>
          </div>

          {/* Form */}
          <div className="operational-modal-body flex-1 overflow-y-auto p-5 space-y-4">
            {/* Mailbox */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Send From (Mailbox)</label>
              <select
                value={mailboxId}
                onChange={(e) => setMailboxId(e.target.value)}
                className="ui-select"
              >
                <option value="">— Auto / Default —</option>
                {mailboxes.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} ({m.address})</option>
                ))}
              </select>
            </div>

            {replySourceEventId == null && isReplyContextMissing ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                This message cannot be replied to because its inbound event reference is missing.
              </div>
            ) : replySourceEventId == null ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                No inbound email context is available. This screen only supports real threaded replies, so direct outreach is not enabled here.
              </div>
            ) : null}

            {isTicketClosed ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Scheduled send is disabled because the ticket is closed.
              </div>
            ) : null}

            {previewQuery.data?.warnings?.length ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 space-y-1">
                {previewQuery.data.warnings.map((warning) => (
                  <div key={warning}>{warning}</div>
                ))}
              </div>
            ) : null}

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
                className="ui-select"
              >
                <option value="">No template</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>{template.name}</option>
                ))}
              </select>
              {templatesQuery.isError && (
                <p className="mt-1 text-xs text-amber-700">Template list is unavailable for this session.</p>
              )}
              {previewQuery.isLoading && (
                <p className="mt-1 text-xs text-gray-500">Loading backend reply preview. You can still continue once mailbox, source email, and body are ready.</p>
              )}
              {previewQuery.data && !previewQuery.isLoading && (
                <p className="mt-1 text-xs text-emerald-700">Using backend reply preview for subject, body, and recipient resolution.</p>
              )}
              {previewQuery.isError && (
                <p className="mt-1 text-xs text-amber-700">Template preview is unavailable. Using saved template content.</p>
              )}
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Subject</label>
              <input
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value)
                  setContentWasEdited(true)
                }}
                className="ui-input"
              />
            </div>

            {/* Body */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Body *</label>
              <textarea
                value={body}
                onChange={(e) => {
                  setBody(e.target.value)
                  setContentWasEdited(true)
                }}
                rows={10}
                autoFocus
                placeholder="Type your reply…"
                className="ui-textarea min-h-[220px] text-sm resize-none"
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
          <div className="operational-modal-footer flex items-center justify-between px-5 py-4">
            <div className="space-y-1">
              <span className="text-xs text-gray-400 block">Ctrl + Enter to send</span>
              {scheduleOpenReasons.length > 0 ? (
                <span className="block text-xs text-amber-700">Schedule unavailable: {scheduleOpenReasons.join(' ')}</span>
              ) : scheduleAdvisory ? (
                <span className="block text-xs text-sky-700">{scheduleAdvisory}</span>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={resetAndClose}>
                Cancel
              </Button>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<CalendarClock size={13} />}
                onClick={() => setShowScheduleModal(true)}
                disabled={scheduleOpenReasons.length > 0 || scheduleMutation.isPending}
              >
                Schedule
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Send size={13} />}
                onClick={handleSend}
                isLoading={sendMutation.isPending}
                disabled={!mailboxId || replySourceEventId == null || !hasComposedBody || sendMutation.isPending || isMailboxSelectionInvalid || isTemplateSelectionInvalid}
              >
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        title="Schedule Email"
        footer={(
          <>
            <Button variant="secondary" size="sm" onClick={() => setShowScheduleModal(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleSchedule} isLoading={scheduleMutation.isPending} disabled={confirmScheduleReasons.length > 0}>
              Confirm Schedule
            </Button>
          </>
        )}
      >
        <div className="space-y-4">
          <div className="surface-section rounded-xl px-3 py-2 text-sm text-slate-700 space-y-1">
            <div><span className="font-medium">To:</span> {resolvedToAddress || 'Will be resolved from source email'}</div>
            <div><span className="font-medium">Subject:</span> {subject || 'Untitled reply'}</div>
          </div>
          {scheduleAdvisory ? (
            <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-800">
              {scheduleAdvisory}
            </div>
          ) : null}
          <label className="block text-sm text-gray-700 space-y-1">
            <span className="font-medium">Send Not Before</span>
            <input
              type="datetime-local"
              value={scheduleAt}
              onChange={(event) => setScheduleAt(event.target.value)}
              className="ui-input"
            />
          </label>
          <div className="text-xs text-gray-500">
            The backend will store this dispatch and send it no earlier than the selected time. Scheduled creation does not mean delivery has already happened.
          </div>
          {confirmScheduleReasons.length > 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Schedule is blocked until: {confirmScheduleReasons.join(' ')}
            </div>
          ) : null}
        </div>
      </Modal>

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
              <div className="surface-section mt-1 rounded-lg px-3 py-2 text-sm text-gray-800">{previewQuery.data.subject || '—'}</div>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">HTML</div>
                <div className="surface-section min-h-[16rem] rounded-lg p-3 text-sm text-gray-800">
                  {previewQuery.data.bodyHtml ? (
                    <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(previewQuery.data.bodyHtml) }} />
                  ) : (
                    <span className="text-gray-400">HTML preview is empty.</span>
                  )}
                </div>
              </div>
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Plain Text</div>
                <div className="min-h-[16rem] rounded-lg border border-gray-200 bg-slate-950 p-3 text-sm text-slate-100">
                  {previewQuery.data.bodyText ? (
                    <pre className="whitespace-pre-wrap font-sans">{previewQuery.data.bodyText}</pre>
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
