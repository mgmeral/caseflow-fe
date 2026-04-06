import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { jiraIntegrationService } from '@/services/jiraIntegration.service'
import { channelIntegrationService } from '@/services/channelIntegration.service'
import { scheduledEmailService } from '@/services/scheduledEmail.service'
import type { ChannelConfigRequest, JiraConfigRequest, ScheduleEmailRequest } from '@/types/integration.types'

export function useTicketJiraStatus(ticketPublicId: string, enabled = true) {
  return useQuery({
    queryKey: ['ticket-jira-status', ticketPublicId],
    queryFn: () => jiraIntegrationService.getTicketJiraStatus(ticketPublicId),
    enabled: enabled && !!ticketPublicId,
    refetchOnWindowFocus: true,
    refetchInterval: (query) => {
      const status = query.state.data?.jobStatus
      return status === 'PENDING' || status === 'PROCESSING' ? 5_000 : false
    },
  })
}

export function useCreateJiraIssue(ticketPublicId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => jiraIntegrationService.createJiraIssue(ticketPublicId),
    onSuccess: (data) => {
      queryClient.setQueryData(['ticket-jira-status', ticketPublicId], data)
      queryClient.invalidateQueries({ queryKey: ['ticket-jira-status', ticketPublicId] })
    },
  })
}

export function useRetryJiraIssue(ticketPublicId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => jiraIntegrationService.retryJiraIssue(ticketPublicId),
    onSuccess: (data) => {
      queryClient.setQueryData(['ticket-jira-status', ticketPublicId], data)
      queryClient.invalidateQueries({ queryKey: ['ticket-jira-status', ticketPublicId] })
    },
  })
}

export function useJiraConfig() {
  return useQuery({
    queryKey: ['jira-config'],
    queryFn: () => jiraIntegrationService.getJiraConfig(),
  })
}

export function useSaveJiraConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: JiraConfigRequest) => jiraIntegrationService.saveJiraConfig(request),
    onSuccess: (data) => {
      queryClient.setQueryData(['jira-config'], data)
      queryClient.invalidateQueries({ queryKey: ['jira-config'] })
    },
  })
}

export function useTestJiraConnection() {
  return useMutation({
    mutationFn: () => jiraIntegrationService.testJiraConnection(),
  })
}

export function useChannelConfigs() {
  return useQuery({
    queryKey: ['channel-configs'],
    queryFn: () => channelIntegrationService.listChannelConfigs(),
  })
}

export function useChannelConfig(id: number | null, enabled = true) {
  return useQuery({
    queryKey: ['channel-config', id],
    queryFn: () => channelIntegrationService.getChannelConfig(id!),
    enabled: enabled && id != null,
  })
}

export function useCreateChannelConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: ChannelConfigRequest) => channelIntegrationService.createChannelConfig(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channel-configs'] })
    },
  })
}

export function useUpdateChannelConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, request }: { id: number; request: ChannelConfigRequest }) => channelIntegrationService.updateChannelConfig(id, request),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['channel-configs'] })
      queryClient.invalidateQueries({ queryKey: ['channel-config', variables.id] })
    },
  })
}

export function useDeleteChannelConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => channelIntegrationService.deleteChannelConfig(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['channel-configs'] })
      queryClient.removeQueries({ queryKey: ['channel-config', id] })
    },
  })
}

export function useScheduledEmails(ticketPublicId: string, enabled = true) {
  return useQuery({
    queryKey: ['scheduled-emails', ticketPublicId],
    queryFn: () => scheduledEmailService.listScheduledEmails(ticketPublicId),
    enabled: enabled && !!ticketPublicId,
    refetchOnWindowFocus: true,
  })
}

export function useCreateScheduledEmail(ticketPublicId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: ScheduleEmailRequest) => scheduledEmailService.createScheduledEmail(ticketPublicId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-emails', ticketPublicId] })
      queryClient.invalidateQueries({ queryKey: ['ticket'] })
      queryClient.invalidateQueries({ queryKey: ['ticket-email-thread'] })
    },
  })
}

export function useCancelScheduledEmail(ticketPublicId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dispatchId: number) => scheduledEmailService.cancelScheduledEmail(ticketPublicId, dispatchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-emails', ticketPublicId] })
      queryClient.invalidateQueries({ queryKey: ['ticket'] })
    },
  })
}