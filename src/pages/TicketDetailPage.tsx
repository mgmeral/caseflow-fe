import { useParams, useNavigate } from 'react-router-dom'
import { useTicketDetail } from '@/hooks/useTicketDetail'
import { useUsers } from '@/hooks/useUsers'
import { useTemplates } from '@/hooks/useTemplates'
import { TicketDetailLayout } from '@/components/ticket-detail/TicketDetailLayout'
import { ConversationThread } from '@/components/ticket-detail/ConversationThread'
import { ComposeArea } from '@/components/ticket-detail/ComposeArea'
import { TicketSidePanel } from '@/components/ticket-detail/TicketSidePanel'
import { ReplyComposerModal } from '@/components/ticket-detail/ReplyComposerModal'
import { AssignmentModal } from '@/components/modals/AssignmentModal'
import { TransferModal } from '@/components/modals/TransferModal'
import { CloseConfirmModal } from '@/components/modals/CloseConfirmModal'
import { SkeletonRow } from '@/components/shared/SkeletonRow'
import { EmptyState } from '@/components/shared/EmptyState'
import { ArrowLeft, Paperclip, Ticket, Users, ArrowUpRight, Reply } from 'lucide-react'
import { Button } from '@/components/shared/Button'
import { useState } from 'react'
import { format } from 'date-fns'

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

  const { users, groups } = useUsers()
  const templatesQuery = useTemplates()
  const templates = templatesQuery.data ?? []

  const [showAssign, setShowAssign] = useState(false)
  const [showTransfer, setShowTransfer] = useState(false)
  const [showClose, setShowClose] = useState(false)
  const [showReply, setShowReply] = useState(false)

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
  const firstInboundIdx = allMessages.findIndex((m) => m.type === 'public_inbound')
  const firstInbound = firstInboundIdx >= 0 ? allMessages[firstInboundIdx] : null
  const systemEvents = allMessages.filter((m) => m.type === 'system_event')
  const conversationMessages = allMessages.filter((m, i) => i !== firstInboundIdx && m.type !== 'system_event')

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
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Reply size={14} />}
            onClick={() => setShowReply(true)}
          >
            Reply
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Users size={14} />}
            onClick={() => setShowAssign(true)}
          >
            Assign
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<ArrowUpRight size={14} />}
            onClick={() => setShowTransfer(true)}
          >
            Transfer
          </Button>
        </div>
      </div>

      <TicketDetailLayout
        left={
          <div>
            {/* Mail Context box — original inbound email */}
            <div className="p-6 pb-3">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Mail Context</span>
                  <span className="text-xs text-gray-400">
                    {ticket.customerName} · {format(new Date(ticket.createdAt), 'MMM d, yyyy HH:mm')}
                  </span>
                </div>
                <div className="px-5 py-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap min-h-[140px]">
                  {firstInbound?.content ?? ticket.subject}
                </div>
              </div>
            </div>

            {/* Attachment strip — visible only when the original email has attachments */}
            {(firstInbound?.attachments.length ?? 0) > 0 && (
              <div className="px-6 pb-3">
                <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg px-4 py-2 flex items-center gap-2 text-xs text-gray-500 justify-center">
                  <Paperclip size={12} className="text-gray-400 shrink-0" />
                  <span>{firstInbound!.attachments.join(' · ')}</span>
                </div>
              </div>
            )}

            {/* Conversation thread (all messages except first inbound) */}
            <ConversationThread messages={conversationMessages} />

            <ComposeArea
              onSendReply={(content) => addReply(content)}
              onSendNote={(content) => addNote(content)}
              isSendingReply={isAddingReply}
              isSendingNote={isAddingNote}
            />
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

      <ReplyComposerModal
        isOpen={showReply}
        onClose={() => setShowReply(false)}
        templates={templates}
        customerName={ticket.customerName}
        onSend={(content) => addReply(content)}
        isSending={isAddingReply}
      />
    </>
  )
}
