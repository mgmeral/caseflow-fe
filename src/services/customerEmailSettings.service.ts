import type {
  CustomerEmailRoutingRuleResponse,
  CustomerEmailSettingsResponse,
  CustomerSummaryResponse,
  UpsertCustomerEmailRoutingRuleRequest,
  UpsertCustomerEmailSettingsRequest,
} from '@/types/api.types'
import type { CustomerEmailRoutingRule, CustomerEmailSettings } from '@/types/email.types'
import { apiClient } from './api.client'
import {
  normalizeCustomerEmailRoutingRule,
  normalizeCustomerEmailSettings,
} from './email-platform.normalizers'

export interface CustomerEmailSummary {
  id: string
  name: string
  code?: string
}

function toBackendUnknownSenderPolicy(policy: UpsertCustomerEmailSettingsRequest['unknownSenderPolicy']) {
  switch (policy) {
    case 'ROUTE_TO_DEFAULT':
    case 'AUTO_CREATE_CONTACT':
    case 'ALLOW':
      return 'MANUAL_REVIEW'
    case 'QUARANTINE':
      return 'MANUAL_REVIEW'
    default:
      return policy
  }
}

function toBackendSenderMatchType(type: UpsertCustomerEmailRoutingRuleRequest['senderMatchType']) {
  return type === 'DOMAIN_SUFFIX' ? 'DOMAIN' : type
}

function toBackendRoutingRulePayload(payload: UpsertCustomerEmailRoutingRuleRequest) {
  return {
    senderMatchType: toBackendSenderMatchType(payload.senderMatchType),
    matchValue: payload.matchValue ?? payload.senderMatchValue,
    ...(payload.priority !== undefined ? { priority: payload.priority } : {}),
    ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}),
  }
}

export const customerEmailSettingsService = {
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
    const settings = await apiClient.put<CustomerEmailSettingsResponse>(`/customers/${customerId}/email-settings`, {
      isActive: payload.isActive ?? payload.isEnabled,
      allowSubdomains: payload.allowSubdomains,
      unknownSenderPolicy: toBackendUnknownSenderPolicy(payload.unknownSenderPolicy),
      ...(payload.defaultGroupId !== undefined ? { defaultGroupId: payload.defaultGroupId } : {}),
      ...(payload.defaultPriority !== undefined ? { defaultPriority: payload.defaultPriority } : {}),
    })
    return normalizeCustomerEmailSettings(settings)
  },

  listRoutingRules: async (customerId: string): Promise<CustomerEmailRoutingRule[]> => {
    const rules = await apiClient.get<CustomerEmailRoutingRuleResponse[]>(`/customers/${customerId}/email-settings/rules`)
    return (rules ?? []).map(normalizeCustomerEmailRoutingRule)
  },

  createRoutingRule: async (customerId: string, payload: UpsertCustomerEmailRoutingRuleRequest) => {
    const rule = await apiClient.post<CustomerEmailRoutingRuleResponse>(
      `/customers/${customerId}/email-settings/rules`,
      toBackendRoutingRulePayload(payload),
    )
    return normalizeCustomerEmailRoutingRule(rule)
  },

  updateRoutingRule: async (customerId: string, ruleId: string, payload: UpsertCustomerEmailRoutingRuleRequest) => {
    const rule = await apiClient.put<CustomerEmailRoutingRuleResponse>(
      `/customers/${customerId}/email-settings/rules/${ruleId}`,
      toBackendRoutingRulePayload(payload),
    )
    return normalizeCustomerEmailRoutingRule(rule)
  },

  deactivateRoutingRule: async (customerId: string, ruleId: string) => {
    const rules = await customerEmailSettingsService.listRoutingRules(customerId)
    const existingRule = rules.find((rule) => rule.id === ruleId)
    if (!existingRule) {
      throw new Error('Routing rule not found')
    }

    return customerEmailSettingsService.updateRoutingRule(customerId, ruleId, {
      senderMatchType: existingRule.senderMatchType,
      senderMatchValue: existingRule.senderMatchValue,
      recipientMailboxId: existingRule.recipientMailboxId,
      priority: existingRule.priority,
      isActive: false,
      notes: existingRule.notes,
    })
  },

  deleteRoutingRule: async (customerId: string, ruleId: string): Promise<void> => {
    await apiClient.delete<void>(`/customers/${customerId}/email-settings/rules/${ruleId}`)
  },
}
