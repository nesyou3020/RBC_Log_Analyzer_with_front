import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createScenarioApi, deleteScenarioApi, listScenariosApi, previewScenarioExcelApi, uploadScenarioExcelApi } from '../services/api/scenarios.api';

const key = ['scenarios'];

export function useScenarios() {
  const queryClient = useQueryClient();

  const list = useQuery({
    queryKey: key,
    queryFn: listScenariosApi,
    select: (resp) => resp.data
  });

  const create = useMutation({
    mutationFn: createScenarioApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key })
  });

  const uploadExcel = useMutation({
    mutationFn: uploadScenarioExcelApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key })
  });

  const previewExcel = useMutation({
    mutationFn: previewScenarioExcelApi
  });

  const remove = useMutation({
    mutationFn: deleteScenarioApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key })
  });

  return { list, create, uploadExcel, previewExcel, remove };
}
