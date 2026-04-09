import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteImportApi, downloadImportApi, listImportsApi, uploadImportApi } from '../services/api/imports.api';

const key = ['imports'];

export function useImports() {
  const queryClient = useQueryClient();

  const list = useQuery({
    queryKey: key,
    queryFn: listImportsApi,
    select: (resp) => resp.data
  });

  const upload = useMutation({
    mutationFn: uploadImportApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key })
  });

  const remove = useMutation({
    mutationFn: deleteImportApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key })
  });

  const download = useMutation({
    mutationFn: downloadImportApi
  });

  return { list, upload, remove, download };
}
