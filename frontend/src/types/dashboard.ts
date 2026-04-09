export type DashboardSummary = {
  stats: {
    files_uploaded: number;
    reports_generated: number;
    scenarios_created: number;
    users_active: number;
  };
  pending_password_resets: Array<{
    request_id: string;
    username: string;
    role: string;
    created_at: string;
  }>;
  recent_files: Array<{
    file_id: string;
    file_name: string;
    uploaded_at: string;
    username: string;
  }>;
  recent_activity: Array<{
    audit_id: string;
    timestamp: string;
    username: string;
    action: string;
    meta: Record<string, unknown>;
  }>;
  is_validator: boolean;
};
