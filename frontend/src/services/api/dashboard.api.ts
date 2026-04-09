import { ApiEnvelope } from '../../types';
import { DashboardSummary } from '../../types/dashboard';
import { apiRequest } from './client';
import { endpoints } from './endpoints';

export function getDashboardSummaryApi() {
  return apiRequest<ApiEnvelope<DashboardSummary>>(endpoints.dashboard.summary);
}
