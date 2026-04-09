import { useQuery } from '@tanstack/react-query';
import { getDashboardSummaryApi } from '../services/api/dashboard.api';

export function useDashboard() {
  const summary = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: getDashboardSummaryApi,
    select: (response) => response.data
  });

  return { summary };
}
