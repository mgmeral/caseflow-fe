import { useParams, useNavigate } from 'react-router-dom'
import { useTicketDetail } from '@/hooks/useTicketDetail'
import { useTicketEmailDetailByDirection, useTicketEmailThread } from '@/hooks/useTicketEmails'
import { useUsers } from '@/hooks/useUsers'
import { TicketDetailLayout } from '@/components/ticket-detail/TicketDetailLayout'
import { EmailThread } from '@/components/ticket-detail/EmailThread'
import { EmailDetailDrawer } from '@/components/ticket-detail/EmailDetailDrawer'
import { TicketWorkArea } from '@/components/ticket-detail/TicketWorkArea'
import { TicketSidePanel } from '@/components/ticket-detail/TicketSidePanel'
import { EmailReplyComposer } from '@/components/ticket-detail/EmailReplyComposer'
import { AssignmentModal } from '@/components/modals/AssignmentModal'
import { TransferModal } from '@/components/modals/TransferModal'
import { CloseConfirmModal } from '@/components/modals/CloseConfirmModal'
import { SkeletonRow } from '@/components/shared/SkeletonRow'
import { EmptyState } from '@/components/shared/EmptyState'
import { ArrowLeft, Ticket, Users, ArrowUpRight, Reply, XCircle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/shared/Button'
import { useEffect, useMemo, useState } from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import type { TicketEmailMessage } from '@/types/email.types'
import type { TicketAttachment } from '@/types/ticket.types'
import { AttachmentViewerModal } from '@/components/ticket-detail/AttachmentViewerModal'
import { TicketTagsCard } from '@/components/ticket-detail/TicketTagsCard'
import { JiraIntegrationCard } from '@/components/ticket-detail/JiraIntegrationCard'
import { ScheduledEmailsCard } from '@/components/ticket-detail/ScheduledEmailsCard'
import { buildTicketActivityItems } from '@/lib/ticketActivity'

function getEmailSelectionKey(email: Pick<TicketEmailMessage, 'detailType' | 'detailId'>): string | null {
  return email.detailType && email.detailId ? `${email.detailType}:${email.detailId}` : null
}

function mapSelectedEmailAttachments(email: TicketEmailMessage | null, ticketId: string | null): TicketAttachment[] {
  return (email?.attachments ?? []).map((attachment) => ({
    id: attachment.id ?? `${email?.detailId ?? email?.emailDocumentId ?? email?.id ?? 'email'}:${attachment.fileName}`,
    ticketId,
    emailId: email?.emailDocumentId ?? email?.detailId ?? email?.id ?? null,
    fileName: attachment.fileName,
    contentType: attachment.contentType,
    size: attachment.sizeBytes ?? attachment.size,
    previewSupported: attachment.previewSupported,
    previewUrl: attachment.previewUrl ?? attachment.downloadPath ?? null,
    openUrl: attachment.openUrl ?? attachment.downloadPath ?? null,
    downloadUrl: attachment.downloadUrl ?? attachment.downloadPath ?? null,
    uploadedAt: email?.receivedAt ?? email?.sentAt ?? null,
  }))
}

export function TicketDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const {
    ticket,
    messages,
    transfers,
    allowedStatusTransitions,
    isLoading,
    isHistoryLoading,
    addNote,
    assign,
    changeStatus,
    changePriority,
    transfer,
    close,
    reopen,
    isAddingNote,
    isAssigning,
    isTransferring,
    isClosing,
  } = useTicketDetail(id)

  const { users, groups } = useUsers()
  const { canAssignTickets, canTransferTickets, canSendTicketEmailReply, canViewTicketEmail, canCloseTickets } = usePermissions()
  const { data: emailThread = [], isLoading: emailThreadLoading } = useTicketEmailThread(id)

  const [showAssign, setShowAssign] = useState(false)
  const [showTransfer, setShowTransfer] = useState(false)
  const [showClose, setShowClose] = useState(false)
  const [showReply, setShowReply] = useState(false)
  const [selectedEmailKey, setSelectedEmailKey] = useState<string | null>(null)
  const [isEmailDrawerOpen, setIsEmailDrawerOpen] = useState(false)
  const [showTicketAttachments, setShowTicketAttachments] = useState(false)
  const selectedEmailSummary = useMemo(
    () => emailThread.find((email) => getEmailSelectionKey(email) === selectedEmailKey) ?? null,
    [emailThread, selectedEmailKey],
  )
  const ticketPublicId = ticket?.publicId ?? null

  const { data: selectedEmailDetail, isLoading: selectedEmailLoading } = useTicketEmailDetailByDirection(
    ticketPublicId ?? '',
    selectedEmailSummary?.detailId ?? '',
    selectedEmailSummary?.detailType ?? selectedEmailSummary?.direction,
    canViewTicketEmail && !!ticketPublicId && !!selectedEmailSummary?.detailId,
  )

  const hasEmailThread = emailThread.length > 0

  const allMessages = messages ?? []
  const conversationMessages = allMessages.filter((message) => message.type !== 'system_event')
  const activityItems = useMemo(
    () => ticket ? buildTicketActivityItems({ ticket, messages: allMessages, transfers: transfers ?? [], emailThread }) : [],
    [allMessages, emailThread, ticket, transfers],
  )
  const selectedEmailAttachments = useMemo(
    () => mapSelectedEmailAttachments(selectedEmailDetail ?? null, ticket?.id ?? null),
    [selectedEmailDetail, ticket?.id],
  )
  const attachmentEmptyMessage = selectedEmailKey
    ? 'No attachments on this email.'
    : 'Select an email to inspect attachments.'

  useEffect(() => {
    if (!canViewTicketEmail || emailThread.length === 0) {
      setSelectedEmailKey(null)
      setIsEmailDrawerOpen(false)
      return
    }

    const firstSelectableEmailKey = emailThread.map(getEmailSelectionKey).find(Boolean) ?? null

    if (!firstSelectableEmailKey) {
      setSelectedEmailKey(null)
      setIsEmailDrawerOpen(false)
      return
    }

    const selectedEmailStillExists = selectedEmailKey
      ? emailThread.some((email) => getEmailSelectionKey(email) === selectedEmailKey)
      : false

    if (selectedEmailStillExists) {
      return
    }

    setSelectedEmailKey(firstSelectableEmailKey)
  }, [canViewTicketEmail, emailThread, selectedEmailKey])

  if (isLoading) {
    return (
      <div className="p-6">
        <table className="w-full">
          <tbody>
            <SkeletonRow colCount={4} />
            <SkeletonRow colCount={4} />
            <SkeletonRow colCount={4} />
          </tbody>
        </table>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<Ticket className="w-10 h-10 text-gray-400" />}
          title="Ticket not found"
          description="This ticket doesn't exist or you don't have access."
          action={
            <Button variant="secondary" onClick={() => navigate('/tickets')}>
              Back to Tickets
            </Button>
          }
        />
      </div>
    )
  }

  const fromGroup = groups.find((g) => g.id === ticket.groupId)
  const transferableGroups = groups.filter((g) => g.id !== ticket.groupId)

  const lastInboundEmail = [...emailThread].reverse().find((e) => e.direction === 'INBOUND') ?? null
  const selectedInboundEmail = (selectedEmailDetail ?? selectedEmailSummary)?.direction === 'INBOUND'
    ? (selectedEmailDetail ?? selectedEmailSummary)
    : null
  const replySourceEmail = selectedInboundEmail ?? lastInboundEmail

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Top navigation bar: breadcrumb + action buttons */}
      <div className="flex items-center justify-between px-6 py-2.5 border-b border-gray-200/60 bg-white shrink-0">
        <div className="flex items-center gap-1.5 text-sm min-w-0">
          <button
            onClick={() => navigate('/tickets')}
            className="flex items-center gap-1 text-gray-500 hover:text-gray-700 shrink-0"
          >
            <ArrowLeft size={14} />
            Tickets
          </button>
          <span className="text-gray-300">/</span>
          <span className="text-gray-400 shrink-0">{ticket.ticketNo}</span>
          <span className="text-gray-300">/</span>
          {ticket.isUnread && (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 shrink-0"
              aria-label="Unread ticket"
            >
              <span className="h-2 w-2 rounded-full bg-indigo-500" aria-hidden="true" />
              Unread
            </span>
          )}
          <span className="text-gray-700 font-medium truncate">{ticket.subject}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-4">
          {canSendTicketEmailReply && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Reply size={14} />}
              onClick={() => setShowReply(true)}
            >
              Email Reply
            </Button>
          )}
          {canAssignTickets && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Users size={14} />}
              onClick={() => setShowAssign(true)}
            >
              Assign
            </Button>
          )}
          {canTransferTickets && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<ArrowUpRight size={14} />}
              onClick={() => setShowTransfer(true)}
            >
              Transfer
            </Button>
          )}
          {canCloseTickets && allowedStatusTransitions.includes('CLOSED' as any) && (
            <Button
              variant="danger"
              size="sm"
              leftIcon={<XCircle size={14} />}
              onClick={() => setShowClose(true)}
            >
              Close
            </Button>
          )}
          {canCloseTickets && allowedStatusTransitions.includes('REOPENED' as any) && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RotateCcw size={14} />}
              onClick={() => reopen()}
            >
              Reopen
            </Button>
          )}
        </div>
      </div>

      <TicketDetailLayout
        left={
          <div className="flex flex-col h-full">
            {/* Email thread — primary content, scrollable */}
            <div className="flex-1 overflow-y-auto min-h-0">
            {canViewTicketEmail && (
              emailThreadLoading ? (
                <div className="p-6">
                  <table className="w-full"><tbody><SkeletonRow colCount={3} /><SkeletonRow colCount={3} /></tbody></table>
                </div>
              ) : hasEmailThread ? (
                <EmailThread
                  ticketPublicId={ticketPublicId}
                  emails={emailThread}
                  messageFallbacks={conversationMessages}
                  onSelectEmail={(email) => {
                    const emailKey = getEmailSelectionKey(email)
                    if (!emailKey) return
                    setSelectedEmailKey(emailKey)
                    setIsEmailDrawerOpen(true)
                  }}
                />
              ) : (
                <div className="px-6 py-10 text-center text-sm text-gray-400">
                  No email messages in this thread yet.
                </div>
              )
            )}

            {!canViewTicketEmail && (
              <div className="px-6 py-10 text-center text-sm text-gray-400">
                Email view is not available for your role.
              </div>
            )}
            </div>

            {/* Lower work area: Notes | Recent Activity | Attachments — pinned at bottom */}
            <TicketWorkArea
              messages={conversationMessages}
              activities={activityItems}
              attachments={selectedEmailAttachments}
              attachmentEmptyMessage={attachmentEmptyMessage}
              isActivityLoading={isHistoryLoading || emailThreadLoading}
              isAttachmentLoading={canViewTicketEmail && !!selectedEmailKey && selectedEmailLoading}
              onSendNote={(content) => addNote(content)}
              isSendingNote={isAddingNote}
              onViewAttachments={() => setShowTicketAttachments(true)}
            />
          </div>
        }
        right={
          <TicketSidePanel
            ticket={ticket}
            allowedTransitions={allowedStatusTransitions}
            tagsCard={<TicketTagsCard ticketId={ticket.id} />}
            integrationCards={(
              <>
                <JiraIntegrationCard ticketPublicId={ticketPublicId} />
                <ScheduledEmailsCard ticketPublicId={ticketPublicId} ticketStatus={ticket.status} />
              </>
            )}
            onChangeStatus={(status) => changeStatus({ status })}
            onChangePriority={(priority) => changePriority(priority)}
          />
        }
      />

      <AssignmentModal
        isOpen={showAssign}
        onClose={() => setShowAssign(false)}
        ticketId={ticket.id}
        ticketNo={ticket.ticketNo}
        currentAssigneeId={ticket.assignedUserId}
        currentAssigneeName={ticket.assignedUserName}
        groups={groups}
        users={users}
        onAssign={(userId, userName) => {
          if (userId) assign({ userId, userName, note: undefined })
        }}
        isAssigning={isAssigning}
      />

      <TransferModal
        isOpen={showTransfer}
        onClose={() => setShowTransfer(false)}
        ticketId={ticket.id}
        ticketNo={ticket.ticketNo}
        fromGroupId={ticket.groupId ?? ''}
        fromGroupName={fromGroup?.name ?? 'Unknown'}
        transferableGroups={transferableGroups}
        onTransfer={(toGroupId, reason) => {
          const toGroupName = transferableGroups.find((g) => g.id === toGroupId)?.name ?? ''
          transfer({ toGroupId, toGroupName, reason })
        }}
        isTransferring={isTransferring}
      />

      <CloseConfirmModal
        isOpen={showClose}
        onClose={() => setShowClose(false)}
        ticketNo={ticket.ticketNo}
        onConfirm={close}
        isClosing={isClosing}
      />

      <EmailReplyComposer
        isOpen={showReply}
        onClose={() => setShowReply(false)}
        ticketId={ticket.id}
        ticketPublicId={ticketPublicId}
        lastInbound={replySourceEmail}
        ticketSubject={ticket.subject}
        isTicketClosed={ticket.status === 'CLOSED'}
      />

      <EmailDetailDrawer
        isOpen={isEmailDrawerOpen}
        onClose={() => setIsEmailDrawerOpen(false)}
        email={selectedEmailDetail ?? null}
        isLoading={selectedEmailLoading}
      />

      <AttachmentViewerModal
        isOpen={showTicketAttachments}
        onClose={() => setShowTicketAttachments(false)}
        title="Email Attachments"
        attachments={selectedEmailAttachments.map((attachment) => ({
          id: attachment.id,
          fileName: attachment.fileName,
          contentType: attachment.contentType,
          size: attachment.size,
          previewSupported: attachment.previewSupported,
          previewUrl: attachment.previewUrl,
          openUrl: attachment.openUrl,
          downloadUrl: attachment.downloadUrl,
        }))}
      />
    </div>
  )
}
