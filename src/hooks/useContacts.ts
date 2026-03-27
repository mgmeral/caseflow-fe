import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { contactService } from '@/services/contact.service'
import type { CreateContactRequest, UpdateContactRequest } from '@/types/api.types'

export function useContactsByCustomer(customerId: string) {
  return useQuery({
    queryKey: ['contacts', 'by-customer', customerId],
    queryFn: () => contactService.getByCustomer(customerId),
    enabled: !!customerId,
    staleTime: 60_000,
  })
}

export function useContactDetail(id: string) {
  return useQuery({
    queryKey: ['contact', id],
    queryFn: () => contactService.getById(id),
    enabled: !!id,
  })
}

export function useCreateContact(customerId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (req: CreateContactRequest) => contactService.create(req),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts', 'by-customer', customerId] }),
  })
}

export function useUpdateContact(customerId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateContactRequest }) =>
      contactService.update(id, data),
    onSuccess: (_result, vars) => {
      qc.invalidateQueries({ queryKey: ['contact', vars.id] })
      qc.invalidateQueries({ queryKey: ['contacts', 'by-customer', customerId] })
    },
  })
}
