import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { userService } from '@/services/user.service'
import { groupService } from '@/services/group.service'
import { groupTypeService } from '@/services/groupType.service'
import { roleService } from '@/services/role.service'
import type { User } from '@/types/user.types'

export function useUsersQuery() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getAll(),
    staleTime: 120_000,
  })
}

export function useGroupsQuery() {
  return useQuery({
    queryKey: ['groups'],
    queryFn: () => groupService.getAll(),
    staleTime: 120_000,
  })
}

export function useGroupTypesQuery() {
  return useQuery({
    queryKey: ['group-types'],
    queryFn: () => groupTypeService.getAll(),
    staleTime: 300_000,
  })
}

export function useRolesQuery() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: () => roleService.getAll(),
    staleTime: 120_000,
  })
}

export function usePermissionDefsQuery() {
  return useQuery({
    queryKey: ['role-permissions'],
    queryFn: () => roleService.getPermissions(),
    staleTime: 600_000,
  })
}

/**
 * Convenience hook that returns both users and groups together.
 *
 * GET /api/users (UserSummaryResponse) never includes group membership, so every user
 * normalizes with empty groupIds/groupNames — that breaks any group-filtered agent picker
 * (e.g. AssignmentModal's "Filter by Group"). GET /api/groups DOES include each group's
 * memberIds, so we derive group membership per user from there instead.
 */
export function useUsers() {
  const usersQuery = useUsersQuery()
  const groupsQuery = useGroupsQuery()

  const users = usersQuery.data ?? []
  const groups = groupsQuery.data ?? []

  const usersWithGroups = useMemo<User[]>(() => {
    if (groups.length === 0) return users
    return users.map((user) => {
      const memberGroups = groups.filter((g) => g.memberIds.includes(user.id))
      return {
        ...user,
        groupIds: memberGroups.map((g) => g.id),
        groupNames: memberGroups.map((g) => g.name),
      }
    })
  }, [users, groups])

  return {
    users: usersWithGroups,
    groups,
    isLoading: usersQuery.isLoading || groupsQuery.isLoading,
    refetch: () => {
      usersQuery.refetch()
      groupsQuery.refetch()
    },
  }
}

/** @deprecated Use useUsers() */
export function useGroups() {
  return useGroupsQuery()
}
