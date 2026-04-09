export type EventMode = 'with_24_136' | 'without_24_136';

export type EventRow = {
  index?: number;
  timestamp?: string;
  train_id?: string | number;
  message_code?: string;
  message_name?: string;
  raw?: Record<string, unknown>;
  [key: string]: unknown;
};

export type TrainListResponse = {
  file_id: string;
  train_ids: Array<string | number>;
};

export type EventListResponse = {
  file_id: string;
  mode: EventMode;
  items: EventRow[];
  page: number;
  page_size: number;
  total: number;
};

export type RawEventsResponse = {
  file_id: string;
  items: Record<string, unknown>[];
  page: number;
  page_size: number;
  total: number;
};
