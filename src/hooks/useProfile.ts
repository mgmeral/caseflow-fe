import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { userService } from '@/services/user.service'
import type { ChangePasswordRequest, UpdateUserProfileRequest } from '@/types/api.types'
import { mergeUserProfileIntoUser } from '@/services/normalizers'
import { useAuthStore } from '@/store/auth.store'

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => userService.getProfile(),
    staleTime: 60_000,
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const setCurrentUser = useAuthStore((state) => state.setCurrentUser)

  return useMutation({
    mutationFn: (payload: UpdateUserProfileRequest) => userService.updateProfile(payload),
    onSuccess: async (profile) => {
      setCurrentUser(mergeUserProfileIntoUser(profile, useAuthStore.getState().currentUser))
      queryClient.setQueryData(['profile'], profile)
      await queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: ChangePasswordRequest) => userService.changePassword(payload),
  })
}