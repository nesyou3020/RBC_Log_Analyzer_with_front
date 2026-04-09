import { AuditListResponse, ApiEnvelope } from '../../types';
import { apiRequest } from './client';
import { endpoints } from './endpoints';

export function listAuditLogsApi(params: {
  page: number;
  pageSize: number;
  action?: string;
  result?: string;
}) {
  const search = new URLSearchParams();
  search.set('page', String(params.page));
  search.set('page_size', String(params.pageSize));

  if (params.action) {
    search.set('action', params.action);
  }
  if (params.result) {
    search.set('result', params.result);
  }

  return apiRequest<ApiEnvelope<AuditListResponse['data']> & { meta: AuditListResponse['meta'] }>(
    `${endpoints.audit.list}?${search.toString()}`
  );
}
