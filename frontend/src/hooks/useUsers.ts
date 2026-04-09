import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createUserApi, deleteUserApi, listUsersApi, setUserActiveApi, setUserRoleApi } from '../services/api/users.api';

const key = ['users'];

export function useUsers() {
  const queryClient = useQueryClient();

  const list = useQuery({
    queryKey: key,
    queryFn: listUsersApi,
    select: (resp) => resp.data
  });

  const create = useMutation({
    mutationFn: createUserApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key })
  });

  const setRole = useMutation({
    mutationFn: (input: { userId: string; role: 'validator' | 'engineer' }) => setUserRoleApi(input.userId, input.role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key })
  });

  const setActive = useMutation({
    mutationFn: (input: { userId: string; isActive: boolean }) => setUserActiveApi(input.userId, input.isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key })
  });

  const remove = useMutation({
    mutationFn: deleteUserApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key })
  });

  return { list, create, setRole, setActive, remove };
}
