import { useQuery } from '@tanstack/react-query';
import { EventMode, EventRow } from '../types';
import { listEventsApi, listRawEventsApi, listTrainsApi } from '../services/api/events.api';

export function useTrains(fileId: string | null) {
  return useQuery({
    queryKey: ['events', 'trains', fileId],
    queryFn: () => listTrainsApi(fileId as string),
    select: (resp) => resp.data.train_ids,
    enabled: Boolean(fileId)
  });
}

export function useEvents(params: {
  fileId: string | null;
  mode: EventMode;
  trainId?: string;
  page: number;
  pageSize: number;
}) {
  return useQuery({
    queryKey: ['events', params],
    queryFn: () =>
      listEventsApi({
        fileId: params.fileId as string,
        mode: params.mode,
        trainId: params.trainId,
        page: params.page,
        pageSize: params.pageSize
      }),
    select: (resp) => resp.data,
    enabled: Boolean(params.fileId)
  });
}

export function useAllEvents(fileId: string | null, mode: EventMode) {
  return useQuery({
    queryKey: ['events', 'all', fileId, mode],
    queryFn: async () => {
      if (!fileId) {
        return [] as EventRow[];
      }

      const pageSize = 500;
      let page = 1;
      let total = Number.POSITIVE_INFINITY;
      const items: EventRow[] = [];

      while (items.length < total) {
        const response = await listEventsApi({
          fileId,
          mode,
          page,
          pageSize
        });

        const data = response.data;
        items.push(...data.items);
        total = data.total;

        if (data.items.length === 0) {
          break;
        }

        page += 1;
      }

      return items;
    },
    enabled: Boolean(fileId)
  });
}

export function useRawEvents(fileId: string | null, page = 1, pageSize = 200) {
  return useQuery({
    queryKey: ['events', 'raw', fileId, page, pageSize],
    queryFn: () => listRawEventsApi({ fileId: fileId as string, page, pageSize }),
    select: (resp) => resp.data,
    enabled: Boolean(fileId)
  });
}

export function useAllRawEvents(fileId: string | null) {
  return useQuery({
    queryKey: ['events', 'raw', 'all', fileId],
    queryFn: async () => {
      if (!fileId) {
        return [] as Record<string, unknown>[];
      }

      const pageSize = 1000;
      let page = 1;
      let total = Number.POSITIVE_INFINITY;
      const items: Record<string, unknown>[] = [];

      while (items.length < total) {
        const response = await listRawEventsApi({ fileId, page, pageSize });
        const data = response.data;

        items.push(...data.items);
        total = data.total;

        if (data.items.length === 0) {
          break;
        }

        page += 1;
      }

      return items;
    },
    enabled: Boolean(fileId)
  });
}
