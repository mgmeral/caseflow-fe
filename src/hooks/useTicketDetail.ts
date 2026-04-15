import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ticketService } from '@/services/ticket.service'
import { useAuthStore } from '@/store/auth.store'
import { useToast } from './useToast'
import { useMarkTicketNotificationsRead } from './useNotifications'
import type { TicketStatus, TicketPriority } from '@/types/ticket.types'

export function useTicketDetail(id: string) {
  const queryClient = useQueryClient()
  const currentUser = useAuthStore((s) => s.currentUser)
  const { success, error: toastError } = useToast()
  const [hasMarkedNotificationsRead, setHasMarkedNotificationsRead] = useState(false)
  const markTicketNotificationsReadMutation = useMarkTicketNotificationsRead()

  const ticketQuery = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => ticketService.getById(id),
    enabled: !!id,
  })

  const messagesQuery = useQuery({
    queryKey: ['ticket-messages', id],
    queryFn: () => ticketService.getMessages(id),
    enabled: !!id,
    staleTime: 15_000,
  })

  const transfersQuery = useQuery({
    queryKey: ['ticket-transfers', id],
    queryFn: () => ticketService.getTransferHistory(id),
    enabled: !!id,
  })

  const transitionsQuery = useQuery({
    queryKey: ['ticket-status-transitions', id],
    queryFn: () => ticketService.getAllowedTransitions(id),
    enabled: !!id,
    staleTime: 15_000,
    retry: false,
  })

  const syncTicket = (ticket: unknown) => {
    queryClient.setQueryData(['ticket', id], ticket)
  }

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['ticket', id] })
    queryClient.invalidateQueries({ queryKey: ['ticket-messages', id] })
    queryClient.invalidateQueries({ queryKey: ['ticket-transfers', id] })
    queryClient.invalidateQueries({ queryKey: ['ticket-status-transitions', id] })
    queryClient.invalidateQueries({ queryKey: ['tickets'] })
  }

  const assignMutation = useMutation({
    mutationFn: ({ userId, userName, groupId, note }: { userId: string | null; userName: string | null; groupId: string | null; note?: string }) =>
      ticketService.assign(id, userId, userName, groupId, note),
    onSuccess: (ticket) => {
      syncTicket(ticket)
      success(ticket.assignedUserName ? `Ticket ${ticket.assignedUserName} adına atandı` : 'Ticket ataması kaldırıldı')
      invalidate()
    },
    onError: () => toastError('Atama işlemi başarısız oldu'),
  })

  const changeStatusMutation = useMutation({
    mutationFn: ({ status, reason }: { status: TicketStatus; reason?: string }) =>
      ticketService.changeStatus(id, status, reason),
    onSuccess: (ticket) => {
      syncTicket(ticket)
      success(`Durum "${ticket.status}" olarak güncellendi`)
      invalidate()
    },
    onError: () => toastError('Durum değişikliği başarısız oldu'),
  })

  const changePriorityMutation = useMutation({
    mutationFn: (priority: TicketPriority) => ticketService.changePriority(id, priority),
    onSuccess: (ticket) => {
      syncTicket(ticket)
      success('Öncelik güncellendi')
      invalidate()
    },
    onError: () => toastError('Öncelik değişikliği başarısız oldu'),
  })

  const addReplyMutation = useMutation({
    mutationFn: (content: string) =>
      ticketService.addPublicReply(id, content, currentUser?.id ?? '', currentUser?.fullName ?? 'Unknown'),
    onSuccess: () => {
      success('Yanıt gönderildi')
      invalidate()
    },
    onError: () => toastError('Yanıt gönderilemedi'),
  })

  const addNoteMutation = useMutation({
    mutationFn: ({ content, mentionedUserIds }: { content: string; mentionedUserIds: string[] }) =>
      ticketService.addInternalNote(id, content, mentionedUserIds),
    onSuccess: () => {
      success('İç not eklendi')
      invalidate()
    },
    onError: () => toastError('Not eklenemedi'),
  })

  const transferMutation = useMutation({
    mutationFn: (params: { toGroupId: string; toGroupName: string; reason: string; note?: string }) => {
      const ticket = ticketQuery.data
      return ticketService.transfer(
        id,
        params.toGroupId,
        params.toGroupName,
        ticket?.groupId ?? '',
        ticket?.groupName ?? '',
        currentUser?.fullName ?? 'Unknown',
        params.reason,
        params.note,
      )
    },
    onSuccess: (ticket) => {
      syncTicket(ticket)
      success(`Ticket ${ticket.groupName} ekibine transfer edildi`)
      invalidate()
    },
    onError: () => toastError('Transfer işlemi başarısız oldu'),
  })

  const closeMutation = useMutation({
    mutationFn: () => ticketService.close(id),
    onSuccess: (ticket) => {
      syncTicket(ticket)
      success('Ticket kapatıldı')
      invalidate()
    },
    onError: () => toastError('Ticket kapatılamadı'),
  })

  const reopenMutation = useMutation({
    mutationFn: () => ticketService.reopen(id),
    onSuccess: (ticket) => {
      syncTicket(ticket)
      success('Ticket yeniden açıldı')
      invalidate()
    },
    onError: () => toastError('Ticket yeniden açılamadı'),
  })

  useEffect(() => {
    setHasMarkedNotificationsRead(false)
  }, [id])

  useEffect(() => {
    if (!ticketQuery.data?.isUnread || hasMarkedNotificationsRead || markTicketNotificationsReadMutation.isPending) {
      return
    }

    setHasMarkedNotificationsRead(true)
    markTicketNotificationsReadMutation.mutate(id)
  }, [hasMarkedNotificationsRead, id, markTicketNotificationsReadMutation, ticketQuery.data?.isUnread])

  return {
    ticket: ticketQuery.data,
    messages: messagesQuery.data ?? [],
    transfers: transfersQuery.data ?? [],
    allowedStatusTransitions: Array.from(new Set([...(ticketQuery.data?.allowedTransitions ?? []), ...(transitionsQuery.data ?? [])])),
    isLoading: ticketQuery.isLoading,
    isHistoryLoading: messagesQuery.isLoading || transfersQuery.isLoading,
    isError: ticketQuery.isError,
    assign: assignMutation.mutate,
    assignAsync: assignMutation.mutateAsync,
    isAssigning: assignMutation.isPending,
    changeStatus: changeStatusMutation.mutate,
    changeStatusAsync: changeStatusMutation.mutateAsync,
    changePriority: changePriorityMutation.mutate,
    addReply: addReplyMutation.mutate,
    isAddingReply: addReplyMutation.isPending,
    addNote: addNoteMutation.mutate,
    isAddingNote: addNoteMutation.isPending,
    transfer: transferMutation.mutate,
    transferAsync: transferMutation.mutateAsync,
    isTransferring: transferMutation.isPending,
    close: () => closeMutation.mutate(),
    isClosing: closeMutation.isPending,
    reopen: reopenMutation.mutate,
    isReopening: reopenMutation.isPending,
  }
}
