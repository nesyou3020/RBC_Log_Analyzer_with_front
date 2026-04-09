import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listPasswordResetRequestsApi,
  approvePasswordResetApi,
  rejectPasswordResetApi
} from '../services/api/auth.api';

export interface PasswordResetRequest {
  request_id: string;
  username: string;
  role: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_at: string | null;
  rejection_reason: string | null;
}

export function usePasswordResetRequests() {
  const queryClient = useQueryClient();

  const list = useQuery({
    queryKey: ['passwordResetRequests'],
    queryFn: listPasswordResetRequestsApi,
    select: (response) => (response.data?.requests ?? []) as PasswordResetRequest[],
    staleTime: 10 * 1000 // 10 seconds
  });

  const approve = useMutation({
    mutationFn: approvePasswordResetApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passwordResetRequests'] });
    }
  });

  const reject = useMutation({
    mutationFn: ({ requestId, reason }: { requestId: string; reason: string }) =>
      rejectPasswordResetApi(requestId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passwordResetRequests'] });
    }
  });

  return {
    list,
    approve,
    reject
  };
}
