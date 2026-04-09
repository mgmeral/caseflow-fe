import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { customerService } from '@/services/customer.service'
import type { CreateCustomerRequest, UpdateCustomerRequest } from '@/types/api.types'

export function useCustomers(search = '', isActive?: boolean) {
  const { data, isLoading, ...rest } = useQuery({
    queryKey: ['customers', search, isActive],
    queryFn: () => customerService.getAll(search, isActive),
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

export function useCreateCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateCustomerRequest) => customerService.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCustomerRequest }) =>
      customerService.update(id, payload),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['customers'] }),
        queryClient.invalidateQueries({ queryKey: ['customer', variables.id] }),
      ])
    },
  })
}

export function useActivateCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => customerService.activate(id),
    onSuccess: async (_data, id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['customers'] }),
        queryClient.invalidateQueries({ queryKey: ['customer', id] }),
      ])
    },
  })
}

export function useDeactivateCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => customerService.deactivate(id),
    onSuccess: async (_data, id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['customers'] }),
        queryClient.invalidateQueries({ queryKey: ['customer', id] }),
      ])
    },
  })
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => customerService.delete(id),
    onSuccess: async (_data, id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['customers'] }),
        queryClient.removeQueries({ queryKey: ['customer', id] }),
        queryClient.removeQueries({ queryKey: ['customer-tickets', id] }),
      ])
    },
  })
}
