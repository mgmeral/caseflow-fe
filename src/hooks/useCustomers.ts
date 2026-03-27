import { useQuery } from '@tanstack/react-query'
import { customerService } from '@/services/customer.service'

export function useCustomers(search = '', segment?: string) {
  const { data, isLoading, ...rest } = useQuery({
    queryKey: ['customers', search, segment],
    queryFn: () => customerService.getAll(search, segment),
    staleTime: 60_000,
  })
  return { customers: data ?? [], isLoading, ...rest }
}

export function useCustomerDetail(id: string) {
  const { data, isLoading, ...rest } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => customerService.getById(id),
    enabled: !!id,
  })
  return { customer: data ?? null, isLoading, ...rest }
}

export function useCustomerTickets(customerId: string) {
  const { data, isLoading, ...rest } = useQuery({
    queryKey: ['customer-tickets', customerId],
    queryFn: () => customerService.getTickets(customerId),
    enabled: !!customerId,
  })
  return { tickets: data ?? [], isLoading, ...rest }
}
