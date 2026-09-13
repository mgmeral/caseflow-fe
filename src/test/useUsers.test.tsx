import { describe, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { useUsers } from '@/hooks/useUsers'

vi.mock('@/services/user.service', () => ({
  userService: {
    getAll: vi.fn(async () => [
      // GET /api/users (UserSummaryResponse) never includes group membership —
      // normalizeUser defaults groupIds/groupNames to [] for every user.
      { id: '1', fullName: 'Alice Admin', isActive: true, groupIds: [], groupNames: [] },
      { id: '2', fullName: 'Bob Agent', isActive: true, groupIds: [], groupNames: [] },
    ]),
  },
}))

vi.mock('@/services/group.service', () => ({
  groupService: {
    getAll: vi.fn(async () => [
      { id: 'g1', name: 'TRADE', memberIds: ['1', '2'] },
      { id: 'g2', name: 'OPERASYON', memberIds: ['1'] },
    ]),
  },
}))

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useUsers', () => {
  it('derives each user\'s groupIds/groupNames from groups[].memberIds, since /api/users never sends group membership', async () => {
    const { result } = renderHook(() => useUsers(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.users).toHaveLength(2))

    const alice = result.current.users.find((u) => u.id === '1')
    const bob = result.current.users.find((u) => u.id === '2')

    expect(alice?.groupIds).toEqual(['g1', 'g2'])
    expect(alice?.groupNames).toEqual(['TRADE', 'OPERASYON'])
    expect(bob?.groupIds).toEqual(['g1'])
    expect(bob?.groupNames).toEqual(['TRADE'])
  })
})
