import { useQuery } from '@tanstack/react-query'
import { ingressEventService, type IngressEventListFilters } from '@/services/ingressEvent.service'

export function useIngressEvents(filters: IngressEventListFilters = {}) {
  return useQuery({
    queryKey: ['ingress-events', filters],
    queryFn: () => ingressEventService.list(filters),
    staleTime: 15_000,
  })
}

export function useIngressEventDetail(id: string) {
  return useQuery({
    queryKey: ['ingress-event', id],
    queryFn: () => ingressEventService.getById(id),
    enabled: !!id,
    staleTime: 15_000,
  })
}