import type {
  CustomerEmailRoutingRuleResponse,
  CustomerEmailSettingsResponse,
  CustomerSummaryResponse,
  UpsertCustomerEmailRoutingRuleRequest,
  UpsertCustomerEmailSettingsRequest,
} from '@/types/api.types'
import type { CustomerEmailRoutingRule, CustomerEmailSettings } from '@/types/email.types'
import { apiClient } from './api.client'
import { USE_MOCKS } from '@/lib/env'
import { getMockDelay } from '@/mock'
import {
  mockCustomerEmailSettings,
  mockCustomerRoutingRules,
  mockMailboxes,
} from '@/mock/email-platform.mock'
import {
  normalizeCustomerEmailRoutingRule,
  normalizeCustomerEmailSettings,
} from './email-platform.normalizers'

export interface CustomerEmailSummary {
  id: string
  name: string
  code?: string
}

let settingsStore = [...mockCustomerEmailSettings]
let rulesStore = [...mockCustomerRoutingRules]

const mockService = {
  listCustomers: async (): Promise<CustomerEmailSummary[]> => {
    await getMockDelay()
    return settingsStore.map((item) => ({
      id: item.customerId,
      name: item.customerName ?? item.customerId,
    }))
  },

  getByCustomer: async (customerId: string): Promise<CustomerEmailSettings | null> => {
    await getMockDelay()
    const settings = settingsStore.find((item) => item.customerId === customerId)
    return settings ? normalizeCustomerEmailSettings(settings) : null
  },

  upsert: async (customerId: string, payload: UpsertCustomerEmailSettingsRequest): Promise<CustomerEmailSettings> => {
    await getMockDelay()
    const mailbox = mockMailboxes.find((item) => item.id === payload.mailboxId)
    const next: CustomerEmailSettingsResponse = {
      customerId,
      customerName: settingsStore.find((item) => item.customerId === customerId)?.customerName ?? customerId,
      mailboxId: payload.mailboxId ?? null,
      mailboxName: mailbox?.name ?? null,
      trustedContactsOnly: payload.trustedContactsOnly,
      autoCreateContact: payload.autoCreateContact,
      allowSubdomains: payload.allowSubdomains,
      unknownSenderPolicy: payload.unknownSenderPolicy,
      defaultGroupId: payload.defaultGroupId ?? null,
      defaultGroupName: mailbox?.defaultGroupName ?? null,
      defaultPriority: payload.defaultPriority ?? null,
      defaultStatus: payload.defaultStatus ?? null,
      updatedAt: new Date().toISOString(),
    }
    settingsStore = settingsStore.filter((item) => item.customerId !== customerId)
    settingsStore.push(next)
    return normalizeCustomerEmailSettings(next)
  },

  listRoutingRules: async (customerId: string): Promise<CustomerEmailRoutingRule[]> => {
    await getMockDelay()
    return rulesStore
      .filter((item) => item.customerId === customerId)
      .map(normalizeCustomerEmailRoutingRule)
  },

  createRoutingRule: async (customerId: string, payload: UpsertCustomerEmailRoutingRuleRequest) => {
    await getMockDelay()
    const mailbox = mockMailboxes.find((item) => item.id === payload.mailboxId)
    const rule: CustomerEmailRoutingRuleResponse = {
      id: `rule-${Date.now()}`,
      customerId,
      matchType: payload.matchType,
      matchValue: payload.matchValue,
      mailboxId: payload.mailboxId ?? null,
      mailboxName: mailbox?.name ?? null,
      groupId: payload.groupId ?? null,
      groupName: mailbox?.defaultGroupName ?? null,
      priority: payload.priority ?? null,
      status: payload.status ?? null,
      isActive: payload.isActive ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    rulesStore = [rule, ...rulesStore]
    return normalizeCustomerEmailRoutingRule(rule)
  },

  updateRoutingRule: async (customerId: string, ruleId: string, payload: UpsertCustomerEmailRoutingRuleRequest) => {
    await getMockDelay()
    rulesStore = rulesStore.map((item) =>
      item.id === ruleId && item.customerId === customerId
        ? {
            ...item,
            ...payload,
            mailboxId: payload.mailboxId ?? null,
            groupId: payload.groupId ?? null,
            priority: payload.priority ?? null,
            status: payload.status ?? null,
            isActive: payload.isActive ?? item.isActive,
            updatedAt: new Date().toISOString(),
          }
        : item,
    )
    const rule = rulesStore.find((item) => item.id === ruleId && item.customerId === customerId)
    if (!rule) throw new Error('Routing rule not found')
    return normalizeCustomerEmailRoutingRule(rule)
  },

  deactivateRoutingRule: async (customerId: string, ruleId: string) => {
    await getMockDelay()
    rulesStore = rulesStore.map((item) =>
      item.id === ruleId && item.customerId === customerId
        ? { ...item, isActive: false, updatedAt: new Date().toISOString() }
        : item,
    )
    const rule = rulesStore.find((item) => item.id === ruleId && item.customerId === customerId)
    if (!rule) throw new Error('Routing rule not found')
    return normalizeCustomerEmailRoutingRule(rule)
  },

  deleteRoutingRule: async (customerId: string, ruleId: string): Promise<void> => {
    await getMockDelay()
    rulesStore = rulesStore.filter((item) => !(item.id === ruleId && item.customerId === customerId))
  },
}

const realService = {
  listCustomers: async (): Promise<CustomerEmailSummary[]> => {
    const customers = await apiClient.get<CustomerSummaryResponse[]>('/customers')
    return customers.map((customer) => ({
      id: String(customer.id),
      name: customer.name,
      code: customer.code,
    }))
  },

  getByCustomer: async (customerId: string): Promise<CustomerEmailSettings | null> => {
    const settings = await apiClient.get<CustomerEmailSettingsResponse | null>(`/customers/${customerId}/email-settings`)
    return settings ? normalizeCustomerEmailSettings(settings) : null
  },

  upsert: async (customerId: string, payload: UpsertCustomerEmailSettingsRequest): Promise<CustomerEmailSettings> => {
    const settings = await apiClient.put<CustomerEmailSettingsResponse>(`/customers/${customerId}/email-settings`, payload)
    return normalizeCustomerEmailSettings(settings)
  },

  listRoutingRules: async (customerId: string): Promise<CustomerEmailRoutingRule[]> => {
    const rules = await apiClient.get<CustomerEmailRoutingRuleResponse[]>(`/customers/${customerId}/email-routing-rules`)
    return rules.map(normalizeCustomerEmailRoutingRule)
  },

  createRoutingRule: async (customerId: string, payload: UpsertCustomerEmailRoutingRuleRequest) => {
    const rule = await apiClient.post<CustomerEmailRoutingRuleResponse>(`/customers/${customerId}/email-routing-rules`, payload)
    return normalizeCustomerEmailRoutingRule(rule)
  },

  updateRoutingRule: async (customerId: string, ruleId: string, payload: UpsertCustomerEmailRoutingRuleRequest) => {
    const rule = await apiClient.put<CustomerEmailRoutingRuleResponse>(`/customers/${customerId}/email-routing-rules/${ruleId}`, payload)
    return normalizeCustomerEmailRoutingRule(rule)
  },

  deactivateRoutingRule: async (customerId: string, ruleId: string) => {
    const rule = await apiClient.patch<CustomerEmailRoutingRuleResponse>(`/customers/${customerId}/email-routing-rules/${ruleId}/deactivate`, {})
    return normalizeCustomerEmailRoutingRule(rule)
  },

  deleteRoutingRule: async (customerId: string, ruleId: string): Promise<void> => {
    await apiClient.delete<void>(`/customers/${customerId}/email-routing-rules/${ruleId}`)
  },
}

export const customerEmailSettingsService = USE_MOCKS ? mockService : realService