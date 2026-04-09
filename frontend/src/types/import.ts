export type FileMeta = {
  file_name: string;
  file_path: string;
  file_size: number;
  file_hash: string;
};

export type LogImport = {
  file_id: string;
  user_id: string;
  created_by_username?: string | null;
  uploaded_at: string;
  error_message: string | null;
  version: string | null;
  file: FileMeta;
};
