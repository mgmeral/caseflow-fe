import { apiClient } from './api.client'
import type {
  IntegrationConnectionTestResult,
  JiraConfigRequest,
  JiraConfigResponse,
  JiraStatusResponse,
} from '@/types/integration.types'

export const jiraIntegrationService = {
  getTicketJiraStatus: async (ticketPublicId: string): Promise<JiraStatusResponse> => {
    return apiClient.get<JiraStatusResponse>(`/tickets/${ticketPublicId}/jira`)
  },

  createJiraIssue: async (ticketPublicId: string): Promise<JiraStatusResponse> => {
    return apiClient.post<JiraStatusResponse>(`/tickets/${ticketPublicId}/jira/create`, {})
  },

  retryJiraIssue: async (ticketPublicId: string): Promise<JiraStatusResponse> => {
    return apiClient.post<JiraStatusResponse>(`/tickets/${ticketPublicId}/jira/retry`, {})
  },

  getJiraConfig: async (): Promise<JiraConfigResponse | null> => {
    const response = await apiClient.get<JiraConfigResponse | undefined>('/admin/integrations/jira/config')
    return response ?? null
  },

  saveJiraConfig: async (request: JiraConfigRequest): Promise<JiraConfigResponse> => {
    return apiClient.put<JiraConfigResponse>('/admin/integrations/jira/config', request)
  },

  testJiraConnection: async (): Promise<IntegrationConnectionTestResult> => {
    return apiClient.post<IntegrationConnectionTestResult>('/admin/integrations/jira/test', {})
  },
}