import { apiClient } from './api.client'
import type {
  ChannelConfig,
  ChannelConfigRequest,
  ChannelConfigResponse,
  NotificationEventType,
} from '@/types/integration.types'

function parseSubscribedEvents(value: string): NotificationEventType[] {
  if (!value.trim()) return []

  try {
    const parsed = JSON.parse(value) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((entry): entry is NotificationEventType => typeof entry === 'string')
  } catch {
    return []
  }
}

function normalizeChannelConfig(response: ChannelConfigResponse): ChannelConfig {
  const maskedValue = response.webhookUrl?.trim() || null

  return {
    id: response.id,
    name: response.name,
    channelType: response.channelType,
    enabled: response.enabled,
    webhookUrlMasked: maskedValue,
    webhookConfigured: Boolean(maskedValue),
    subscribedEvents: parseSubscribedEvents(response.subscribedEvents),
    scopeType: response.scopeType,
    scopeId: response.scopeId,
    createdAt: response.createdAt,
    updatedAt: response.updatedAt,
  }
}

export const channelIntegrationService = {
  listChannelConfigs: async (): Promise<ChannelConfig[]> => {
    const response = await apiClient.get<ChannelConfigResponse[]>('/admin/integrations/channels')
    return response.map(normalizeChannelConfig)
  },

  getChannelConfig: async (id: number): Promise<ChannelConfig> => {
    const response = await apiClient.get<ChannelConfigResponse>(`/admin/integrations/channels/${id}`)
    return normalizeChannelConfig(response)
  },

  createChannelConfig: async (request: ChannelConfigRequest): Promise<ChannelConfig> => {
    const response = await apiClient.post<ChannelConfigResponse>('/admin/integrations/channels', request)
    return normalizeChannelConfig(response)
  },

  updateChannelConfig: async (id: number, request: ChannelConfigRequest): Promise<ChannelConfig> => {
    const response = await apiClient.put<ChannelConfigResponse>(`/admin/integrations/channels/${id}`, request)
    return normalizeChannelConfig(response)
  },

  deleteChannelConfig: async (id: number): Promise<void> => {
    await apiClient.delete<void>(`/admin/integrations/channels/${id}`)
  },
}