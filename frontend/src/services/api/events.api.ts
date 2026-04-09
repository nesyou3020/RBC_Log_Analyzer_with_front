import { ApiEnvelope, EventListResponse, EventMode, RawEventsResponse, TrainListResponse } from '../../types';
import { apiRequest } from './client';
import { endpoints } from './endpoints';

export function listTrainsApi(fileId: string) {
  return apiRequest<ApiEnvelope<TrainListResponse>>(`${endpoints.events.trains}?file_id=${encodeURIComponent(fileId)}`);
}

export function listEventsApi(params: {
  fileId: string;
  mode: EventMode;
  trainId?: string;
  page?: number;
  pageSize?: number;
}) {
  const query = new URLSearchParams({
    file_id: params.fileId,
    mode: params.mode,
    page: String(params.page ?? 1),
    page_size: String(params.pageSize ?? 50)
  });

  if (params.trainId) {
    query.set('train_id', params.trainId);
  }

  return apiRequest<ApiEnvelope<EventListResponse>>(`${endpoints.events.list}?${query.toString()}`);
}

export function listRawEventsApi(params: { fileId: string; page?: number; pageSize?: number }) {
  const query = new URLSearchParams({
    file_id: params.fileId,
    page: String(params.page ?? 1),
    page_size: String(params.pageSize ?? 200)
  });

  return apiRequest<ApiEnvelope<RawEventsResponse>>(`${endpoints.events.raw}?${query.toString()}`);
}
