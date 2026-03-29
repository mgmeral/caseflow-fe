import { useQuery } from '@tanstack/react-query'
import { customerEmailSettingsService } from '@/services/customerEmailSettings.service'

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