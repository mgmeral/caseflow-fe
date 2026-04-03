import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { customerEmailSettingsService } from '@/services/customerEmailSettings.service'
import type { UpsertCustomerEmailRoutingRuleRequest, UpsertCustomerEmailSettingsRequest } from '@/types/api.types'

export function useCustomerEmailSettings(customerId: string) {
  return useQuery({
    queryKey: ['customer-email-settings', customerId],
    queryFn: () => customerEmailSettingsService.getByCustomer(customerId),
    enabled: !!customerId,
    staleTime: 30_000,
  })
}

export function useCustomerRoutingRules(customerId: string) {
  return useQuery({
    queryKey: ['customer-email-routing-rules', customerId],
    queryFn: () => customerEmailSettingsService.listRoutingRules(customerId),
    enabled: !!customerId,
    staleTime: 30_000,
  })
}

export function useCustomerEmailAdminCustomers() {
  return useQuery({
    queryKey: ['customer-email-admin-customers'],
    queryFn: () => customerEmailSettingsService.listCustomers(),
    staleTime: 60_000,
  })
}

export function useUpsertCustomerEmailSettings(customerId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpsertCustomerEmailSettingsRequest) =>
      customerEmailSettingsService.upsert(customerId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['customer-email-settings', customerId] })
    },
  })
}

export function useCreateCustomerRoutingRule(customerId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpsertCustomerEmailRoutingRuleRequest) =>
      customerEmailSettingsService.createRoutingRule(customerId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['customer-email-routing-rules', customerId] })
    },
  })
}

export function useUpdateCustomerRoutingRule(customerId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ ruleId, payload }: { ruleId: string; payload: UpsertCustomerEmailRoutingRuleRequest }) =>
      customerEmailSettingsService.updateRoutingRule(customerId, ruleId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['customer-email-routing-rules', customerId] })
    },
  })
}

export function useDeactivateCustomerRoutingRule(customerId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ruleId: string) => customerEmailSettingsService.deactivateRoutingRule(customerId, ruleId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['customer-email-routing-rules', customerId] })
    },
  })
}

export function useDeleteCustomerRoutingRule(customerId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ruleId: string) => customerEmailSettingsService.deleteRoutingRule(customerId, ruleId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['customer-email-routing-rules', customerId] })
    },
  })
}