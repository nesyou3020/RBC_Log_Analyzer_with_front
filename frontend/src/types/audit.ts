export type AuditLogItem = {
  audit_id: string;
  timestamp: string;
  user_id: string;
  username: string;
  action: string;
  result: 'success' | 'failure';
  meta: Record<string, unknown>;
};

export type AuditListMeta = {
  page: number;
  page_size: number;
  total: number;
};

export type AuditListResponse = {
  data: AuditLogItem[];
  meta: AuditListMeta;
};
