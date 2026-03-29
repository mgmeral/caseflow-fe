import { useParams, useNavigate } from 'react-router-dom'
import { useTicketDetail } from '@/hooks/useTicketDetail'
import { useTicketEmailThread } from '@/hooks/useTicketEmails'
import { useUsers } from '@/hooks/useUsers'
import { TicketDetailLayout } from '@/components/ticket-detail/TicketDetailLayout'
import { ConversationThread } from '@/components/ticket-detail/ConversationThread'
import { EmailThread } from '@/components/ticket-detail/EmailThread'
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
import { useState } from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import { clsx } from 'clsx'

export function TicketDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const {
    ticket,
    messages,
    transfers,
    isLoading,
    addReply,
    addNote,
    assign,
    changeStatus,
    changePriority,
    transfer,
    close,
    reopen,
    isAddingReply,
    isAddingNote,
    isAssigning,
    isTransferring,
    isClosing,
  } = useTicketDetail(id)

  const { data: emailThread = [], isLoading: emailThreadLoading } = useTicketEmailThread(id)

  const { users, groups } = useUsers()
  const { canAssignTickets, canTransferTickets, canSendTicketEmailReply, canViewTicketEmail } = usePermissions()

  const [showAssign, setShowAssign] = useState(false)
  const [showTransfer, setShowTransfer] = useState(false)
  const [showClose, setShowClose] = useState(false)
  const [showReply, setShowReply] = useState(false)

  type ThreadTab = 'email' | 'notes'
  const hasEmailThread = emailThread.length > 0
  const [activeTab, setActiveTab] = useState<ThreadTab>(hasEmailThread ? 'email' : 'notes')

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

  const allMessages = messages ?? []
  const systemEvents = allMessages.filter((m) => m.type === 'system_event')
  const conversationMessages = allMessages.filter((m) => m.type !== 'system_event')

  const lastInboundEmail = [...emailThread].reverse().find((e) => e.direction === 'INBOUND') ?? null

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
                  onClick={() => setActiveTab('email')}
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
                  onClick={() => setActiveTab('notes')}
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
                <EmailThread emails={emailThread} />
              )
            )}

            {/* Notes/conversation tab */}
            {activeTab === 'notes' && (
              <>
                <ConversationThread messages={conversationMessages} />
                <ComposeArea
                  onSendReply={(content) => addReply(content)}
                  onSendNote={(content) => addNote(content)}
                  isSendingReply={isAddingReply}
                  isSendingNote={isAddingNote}
                />
              </>
            )}

            {/* Fallback when can't see email tab */}
            {!canViewTicketEmail && (
              <>
                <ConversationThread messages={conversationMessages} />
                <ComposeArea
                  onSendReply={(content) => addReply(content)}
                  onSendNote={(content) => addNote(content)}
                  isSendingReply={isAddingReply}
                  isSendingNote={isAddingNote}
                />
              </>
            )}
          </div>
        }
        right={
          <TicketSidePanel
            ticket={ticket}
            transfers={transfers ?? []}
            systemEvents={systemEvents}
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
        onConfirm={(sendNotification) => close(sendNotification)}
        isClosing={isClosing}
      />

      <EmailReplyComposer
        isOpen={showReply}
        onClose={() => setShowReply(false)}
        ticketId={ticket.id}
        lastInbound={lastInboundEmail}
        ticketSubject={ticket.subject}
      />
    </>
  )
}
