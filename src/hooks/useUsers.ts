import { useQuery } from '@tanstack/react-query'
import { userService } from '@/services/user.service'
import { groupService } from '@/services/group.service'
import { groupTypeService } from '@/services/groupType.service'
import { roleService } from '@/services/role.service'

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

/** Convenience hook that returns both users and groups together */
export function useUsers() {
  const usersQuery = useUsersQuery()
  const groupsQuery = useGroupsQuery()

  return {
    users: usersQuery.data ?? [],
    groups: groupsQuery.data ?? [],
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
