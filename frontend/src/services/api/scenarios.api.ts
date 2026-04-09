import { ApiEnvelope, CreateScenarioPayload, ScenarioTemplate } from '../../types';
import { apiRequest } from './client';
import { endpoints } from './endpoints';

export function listScenariosApi() {
  return apiRequest<ApiEnvelope<ScenarioTemplate[]>>(endpoints.scenarios.list);
}

export function createScenarioApi(payload: CreateScenarioPayload) {
  return apiRequest<ApiEnvelope<{ template_id: string }>>(endpoints.scenarios.create, {
    method: 'POST',
    body: payload
  });
}

export function uploadScenarioExcelApi(params: {
  name: string;
  description?: string;
  file: File;
}) {
  const query = new URLSearchParams({
    name: params.name,
    description: params.description ?? ''
  });

  const formData = new FormData();
  formData.append('file', params.file);

  return apiRequest<ApiEnvelope<ScenarioTemplate>>(`${endpoints.scenarios.uploadExcel}?${query.toString()}`, {
    method: 'POST',
    body: formData
  });
}

export function previewScenarioExcelApi(params: {
  name: string;
  description?: string;
  file: File;
}) {
  const query = new URLSearchParams({
    name: params.name,
    description: params.description ?? ''
  });

  const formData = new FormData();
  formData.append('file', params.file);

  return apiRequest<ApiEnvelope<ScenarioTemplate>>(`${endpoints.scenarios.previewExcel}?${query.toString()}`, {
    method: 'POST',
    body: formData
  });
}

export function deleteScenarioApi(templateId: string) {
  return apiRequest<ApiEnvelope<{ message: string }>>(endpoints.scenarios.delete(templateId), {
    method: 'DELETE'
  });
}
