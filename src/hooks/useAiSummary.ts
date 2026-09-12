import { useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { aiService } from '@/services/ai.service'
import type { AiSummaryResult } from '@/types/ai.types'

export function useAiSummary(ticketId: string) {
  const mutation = useMutation<AiSummaryResult, Error>({
    mutationFn: () => aiService.getSummary(ticketId),
  })

  // Reset stale result when the viewed ticket changes.
  // Prevents a previous ticket's summary from showing on a new ticket.
  useEffect(() => {
    mutation.reset()
    // mutation.reset is stable; ticketId is the real dependency
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId])

  return {
    result: mutation.data ?? null,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    generate: mutation.mutate,
    reset: mutation.reset,
  }
}
