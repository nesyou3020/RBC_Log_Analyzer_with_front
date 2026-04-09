import { useQuery } from '@tanstack/react-query';
import { listAuditLogsApi } from '../services/api/audit.api';

export function useAudit(params: {
  page: number;
  pageSize: number;
  action?: string;
  result?: string;
}) {
  const list = useQuery({
    queryKey: ['audit', params.page, params.pageSize, params.action ?? '', params.result ?? ''],
    queryFn: () => listAuditLogsApi(params)
  });

  return { list };
}
