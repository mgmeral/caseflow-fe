import { apiClient } from './api.client'
import { toArrayPayload } from '@/lib/apiList'
import type { ChannelEventCatalogResponseItem } from '@/types/api.types'
import type {
  ChannelEventCatalogItem,
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

function normalizeCatalogItem(raw: ChannelEventCatalogResponseItem | string): ChannelEventCatalogItem {
  if (typeof raw === 'string') {
    return {
      value: raw,
      label: raw.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase()),
      group: 'Other',
      description: null,
    }
  }

  const value = raw.value ?? raw.code ?? raw.eventType ?? ''
  const label = raw.label ?? raw.displayName ?? String(value)
  return {
    value: String(value),
    label: String(label),
    group: String(raw.group ?? raw.category ?? 'Other'),
    description: raw.description ?? null,
  }
}

export const channelIntegrationService = {
  listChannelConfigs: async (): Promise<ChannelConfig[]> => {
    const response = await apiClient.get<unknown>('/admin/integrations/channels')
    return toArrayPayload(response).map((item) => normalizeChannelConfig(item as ChannelConfigResponse))
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

  getEventCatalog: async (): Promise<ChannelEventCatalogItem[]> => {
    const response = await apiClient.get<Array<ChannelEventCatalogResponseItem | string>>('/admin/integrations/channels/event-catalog')
    return Array.isArray(response) ? response.map(normalizeCatalogItem).filter((item) => item.value) : []
  },
}