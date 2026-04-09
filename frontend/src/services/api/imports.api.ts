import { ApiEnvelope, LogImport } from '../../types';
import { env } from '../../config/env';
import { getToken } from '../storage';
import { apiRequest, ApiError } from './client';
import { endpoints } from './endpoints';

export function listImportsApi() {
  return apiRequest<ApiEnvelope<LogImport[]>>(endpoints.imports.list);
}

export function uploadImportApi(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return apiRequest<ApiEnvelope<LogImport>>(endpoints.imports.create, {
    method: 'POST',
    body: formData
  });
}

export function deleteImportApi(fileId: string) {
  return apiRequest<ApiEnvelope<{ message: string }>>(endpoints.imports.delete(fileId), {
    method: 'DELETE'
  });
}

export async function downloadImportApi(fileId: string): Promise<{ blob: Blob; filename: string }> {
  const token = getToken();
  const response = await fetch(`${env.apiBaseUrl}${endpoints.imports.download(fileId)}`, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });

  if (!response.ok) {
    let message = 'Download failed';
    try {
      const body = (await response.json()) as { detail?: string };
      message = body.detail ?? message;
    } catch {
      message = 'Download failed';
    }
    throw new ApiError(message, response.status);
  }

  const disposition = response.headers.get('Content-Disposition') ?? '';
  const match = disposition.match(/filename="?([^\"]+)"?/i);
  const filename = match?.[1] ?? `import-${fileId}.xml`;
  const blob = await response.blob();

  return { blob, filename };
}
