import { useParams, useNavigate } from 'react-router-dom'
import { useTicketDetail } from '@/hooks/useTicketDetail'
import { useTicketEmailDetailByDirection, useTicketEmailThread } from '@/hooks/useTicketEmails'
import { useUsers } from '@/hooks/useUsers'
import { TicketDetailLayout } from '@/components/ticket-detail/TicketDetailLayout'
import { ConversationThread } from '@/components/ticket-detail/ConversationThread'
import { EmailThread } from '@/components/ticket-detail/EmailThread'
import { EmailDetailDrawer } from '@/components/ticket-detail/EmailDetailDrawer'
import { ComposeArea } from '@/components/ticket-detail/ComposeArea'
import { TicketSidePanel } from '@/components/ticket-detail/TicketSidePanel'
import { EmailReplyComposer } from '@/components/ticket-detail/EmailReplyComposer'
import { AssignmentModal } from '@/components/modals/AssignmentModal'
import { TransferModal } from '@/components/modals/TransferModal'
import { CloseConfirmModal } from '@/components/modals/CloseConfirmModal'
import { SkeletonRow } from '@/components/shared/SkeletonRow'
import { EmptyState } from '@/components/shared/EmptyState'
import { ArrowLeft, Ticket, Users, ArrowUpRight, Reply, Mail, MessageSquare } from 'lucide-react'
import { Button } from '@/components/shared/Button'
import { useEffect, useMemo, useState } from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import { clsx } from 'clsx'
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
  const { canAssignTickets, canTransferTickets, canSendTicketEmailReply, canViewTicketEmail } = usePermissions()
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

  type ThreadTab = 'email' | 'notes'
  const hasEmailThread = emailThread.length > 0
  const [activeTab, setActiveTab] = useState<ThreadTab>('notes')
  const [hasManualTabSelection, setHasManualTabSelection] = useState(false)

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
    if (hasManualTabSelection) return
    setActiveTab(canViewTicketEmail && hasEmailThread ? 'email' : 'notes')
  }, [canViewTicketEmail, hasEmailThread, hasManualTabSelection])

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
    <>
      {/* Top navigation bar: breadcrumb + action buttons */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white shrink-0">
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
        </div>
      </div>

      <TicketDetailLayout
        left={
          <div>
            {/* Tab bar: Email Thread vs Notes/Conversation */}
            {canViewTicketEmail && (
              <div className="flex bg-gray-50 border-b border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setHasManualTabSelection(true)
                    setActiveTab('email')
                  }}
                  className={clsx(
                    'flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium border-b-2 transition-colors',
                    activeTab === 'email'
                      ? 'border-indigo-500 text-indigo-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700',
                  )}
                >
                  <Mail size={14} />
                  Email Thread
                  {emailThread.length > 0 && (
                    <span className="ml-1 bg-indigo-100 text-indigo-600 text-xs font-semibold px-1.5 py-0.5 rounded-full">{emailThread.length}</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHasManualTabSelection(true)
                    setActiveTab('notes')
                  }}
                  className={clsx(
                    'flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium border-b-2 transition-colors',
                    activeTab === 'notes'
                      ? 'border-indigo-500 text-indigo-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700',
                  )}
                >
                  <MessageSquare size={14} />
                  Notes & Activity
                  {conversationMessages.length > 0 && (
                    <span className="ml-1 bg-gray-200 text-gray-600 text-xs font-semibold px-1.5 py-0.5 rounded-full">{conversationMessages.length}</span>
                  )}
                </button>
              </div>
            )}

            {/* Email thread tab */}
            {activeTab === 'email' && canViewTicketEmail && (
              emailThreadLoading ? (
                <div className="p-6">
                  <table className="w-full"><tbody><SkeletonRow colCount={3} /><SkeletonRow colCount={3} /></tbody></table>
                </div>
              ) : (
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
              )
            )}

            {/* Notes/conversation tab */}
            {activeTab === 'notes' && (
              <>
                <ConversationThread messages={conversationMessages} />
                <ComposeArea
                  onSendNote={(content) => addNote(content)}
                  isSendingNote={isAddingNote}
                />
              </>
            )}

            {/* Fallback when can't see email tab */}
            {!canViewTicketEmail && (
              <>
                <ConversationThread messages={conversationMessages} />
                <ComposeArea
                  onSendNote={(content) => addNote(content)}
                  isSendingNote={isAddingNote}
                />
              </>
            )}
          </div>
        }
        right={
          <TicketSidePanel
            ticket={ticket}
            allowedTransitions={allowedStatusTransitions}
            activities={activityItems}
            attachments={selectedEmailAttachments}
            tagsCard={<TicketTagsCard ticketId={ticket.id} />}
            integrationCards={(
              <>
                <JiraIntegrationCard ticketPublicId={ticketPublicId} />
                <ScheduledEmailsCard ticketPublicId={ticketPublicId} ticketStatus={ticket.status} />
              </>
            )}
            attachmentEmptyMessage={attachmentEmptyMessage}
            isActivityLoading={isHistoryLoading || emailThreadLoading}
            isAttachmentLoading={canViewTicketEmail && !!selectedEmailKey && selectedEmailLoading}
            onViewAttachments={() => setShowTicketAttachments(true)}
            onChangeStatus={(status) => changeStatus({ status })}
            onChangePriority={(priority) => changePriority(priority)}
            onAssign={() => setShowAssign(true)}
            onTransfer={() => setShowTransfer(true)}
            onCloseTicket={() => setShowClose(true)}
            onReopenTicket={() => reopen()}
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
    </>
  )
}
