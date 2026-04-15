import { useState } from 'react'
import { format } from 'date-fns'
import { Mail, MailCheck, Paperclip, Clock, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Drawer } from '@/components/shared/Drawer'
import { Badge } from '@/components/shared/Badge'
import { SkeletonRow } from '@/components/shared/SkeletonRow'
import type { TicketEmailMessage } from '@/types/email.types'
import { AttachmentViewerModal } from './AttachmentViewerModal'
import { getDispatchStatusMeta, getEmailDisplayHtml, getEmailDisplayText, isFailedDispatch } from '@/lib/ticketEmailUi'

interface EmailDetailDrawerProps {
  isOpen: boolean
  onClose: () => void
  email: TicketEmailMessage | null
  isLoading: boolean
}

function dispatchStatusDisplay(status: string | null) {
  const meta = getDispatchStatusMeta(status)

  if (!meta) return null

  switch (meta.category) {
    case 'pending':
      return { icon: <Clock size={12} />, label: meta.label, color: 'text-gray-500' }
    case 'active':
      return { icon: <Clock size={12} />, label: meta.label, color: 'text-blue-500' }
    case 'success':
      return { icon: <CheckCircle2 size={12} />, label: meta.label, color: 'text-green-600' }
    case 'error':
      return { icon: <AlertCircle size={12} />, label: meta.label, color: 'text-red-500' }
    default:
      return null
  }
}

export function EmailDetailDrawer({ isOpen, onClose, email, isLoading }: EmailDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<'body' | 'raw'>('body')
  const [showAttachments, setShowAttachments] = useState(false)
  const timestamp = email ? (email.receivedAt ?? email.sentAt ?? null) : null
  const dispatch = email && email.direction === 'OUTBOUND' ? dispatchStatusDisplay(email.dispatchStatus) : null
  const displayHtml = email ? getEmailDisplayHtml(email) : null
  const displayText = email ? getEmailDisplayText(email) : null
  const rawHtml = email?.rawHtmlBody ?? null
  const failedReason = email && email.direction === 'OUTBOUND' && isFailedDispatch(email.dispatchStatus)
    ? email.failureReason
    : null

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Email Detail" width="w-full max-w-3xl">
      {isLoading ? (
        <table className="w-full"><tbody><SkeletonRow colCount={2} /><SkeletonRow colCount={2} /></tbody></table>
      ) : !email ? (
        <div className="text-sm text-gray-500">Email detail is not available.</div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            {email.direction === 'INBOUND' ? (
              <Badge variant="success" size="sm"><span className="inline-flex items-center gap-1"><Mail size={10} /> Inbound</span></Badge>
            ) : (
              <Badge variant="info" size="sm"><span className="inline-flex items-center gap-1"><MailCheck size={10} /> Outbound</span></Badge>
            )}
            {dispatch && (
              <span className={`inline-flex items-center gap-1 text-xs ${dispatch.color}`}>
                {dispatch.icon}
                {dispatch.label}
              </span>
            )}
            {timestamp && <span className="text-xs text-gray-400">{format(new Date(timestamp), 'MMM d, yyyy HH:mm')}</span>}
          </div>

          <div className="grid grid-cols-1 gap-2 text-sm">
            <div><span className="text-gray-500">Subject:</span> <span className="text-gray-800">{email.subject ?? '—'}</span></div>
            <div><span className="text-gray-500">From:</span> <span className="text-gray-800">{email.from ?? '—'}</span></div>
            <div><span className="text-gray-500">To:</span> <span className="text-gray-800">{email.to.join(', ') || '—'}</span></div>
            {email.cc.length > 0 && <div><span className="text-gray-500">Cc:</span> <span className="text-gray-800">{email.cc.join(', ')}</span></div>}
            {email.bcc.length > 0 && <div><span className="text-gray-500">Bcc:</span> <span className="text-gray-800">{email.bcc.join(', ')}</span></div>}
            {email.mailboxName && <div><span className="text-gray-500">Mailbox:</span> <span className="text-gray-800">{email.mailboxName}</span></div>}
            {email.mailboxAddress && <div><span className="text-gray-500">Mailbox Address:</span> <span className="text-gray-800">{email.mailboxAddress}</span></div>}
            {email.resolvedReplyTarget && <div><span className="text-gray-500">Reply Target:</span> <span className="text-gray-800 break-all">{email.resolvedReplyTarget}</span></div>}
            {email.templateInfo?.templateName && <div><span className="text-gray-500">Template:</span> <span className="text-gray-800">{email.templateInfo.templateName}</span></div>}
            {email.contentWasEdited != null && <div><span className="text-gray-500">Edited:</span> <span className="text-gray-800">{email.contentWasEdited ? 'Yes' : 'No'}</span></div>}
            {email.messageId && <div><span className="text-gray-500">Message ID:</span> <span className="text-gray-800 font-mono text-xs">{email.messageId}</span></div>}
          </div>

          {rawHtml && (
            <div className="flex gap-2">
              <button type="button" onClick={() => setActiveTab('body')} className={`surface-tab px-3 py-1 text-xs ${activeTab === 'body' ? 'surface-tab-active' : ''}`}>
                Body
              </button>
              <button type="button" onClick={() => setActiveTab('raw')} className={`surface-tab px-3 py-1 text-xs ${activeTab === 'raw' ? 'surface-tab-active' : ''}`}>
                Raw HTML
              </button>
            </div>
          )}

          <div className="surface-section rounded-xl p-3">
            {activeTab === 'raw' && rawHtml ? (
              <pre className="text-sm text-gray-800 whitespace-pre-wrap">{rawHtml}</pre>
            ) : displayHtml ? (
              <div className="prose prose-sm max-w-none text-gray-800 overflow-x-auto" dangerouslySetInnerHTML={{ __html: displayHtml }} />
            ) : displayText ? (
              <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans">{displayText}</pre>
            ) : (
              <p className="text-sm text-gray-400 italic">No body content available.</p>
            )}
            {failedReason && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                Delivery failed: {failedReason}
              </div>
            )}
          </div>

          {email.attachments.length > 0 && (
            <div>
              <button type="button" className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800" onClick={() => setShowAttachments(true)}>
                <Paperclip size={12} />
                View Attachments
              </button>
            </div>
          )}

          <AttachmentViewerModal
            isOpen={showAttachments}
            onClose={() => setShowAttachments(false)}
            title="Email Attachments"
            isLoading={isLoading && email.attachments.length === 0}
            attachments={email.attachments.map((att) => ({
              id: att.id,
              fileName: att.fileName,
              contentType: att.contentType,
              size: att.sizeBytes ?? att.size,
              previewSupported: att.previewSupported,
              previewUrl: att.previewUrl,
              openUrl: att.openUrl,
              downloadUrl: att.downloadUrl,
            }))}
            unavailableMessage="Attachment metadata is not available for this email."
          />
        </div>
      )}
    </Drawer>
  )
}
