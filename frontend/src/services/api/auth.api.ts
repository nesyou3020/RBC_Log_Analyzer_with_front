import { ApiEnvelope, LoginResponse } from '../../types';
import { apiRequest } from './client';
import { endpoints } from './endpoints';

export function loginApi(payload: { username: string; password: string }) {
  return apiRequest<ApiEnvelope<LoginResponse>>(endpoints.auth.login, {
    method: 'POST',
    body: payload,
    auth: false
  });
}

export function logoutApi() {
  return apiRequest<ApiEnvelope<{ message: string }>>(endpoints.auth.logout, {
    method: 'POST'
  });
}

export function changePasswordApi(payload: {
  current_password: string;
  new_password: string;
}) {
  return apiRequest<ApiEnvelope<{ message: string }>>(endpoints.auth.changePassword, {
    method: 'POST',
    body: payload
  });
}

export function submitPasswordResetRequestApi(payload: {
  username: string;
  role: string;
  new_password: string;
}) {
  return apiRequest<ApiEnvelope<{ message: string; request_id: string }>>(
    endpoints.auth.passwordResetRequests,
    {
      method: 'POST',
      body: payload,
      auth: false
    }
  );
}

export function listPasswordResetRequestsApi() {
  return apiRequest<ApiEnvelope<{ requests: Array<any> }>>(
    endpoints.auth.passwordResetRequests,
    {
      method: 'GET'
    }
  );
}

export function approvePasswordResetApi(requestId: string) {
  return apiRequest<ApiEnvelope<{ message: string }>>(
    endpoints.auth.approvePasswordReset(requestId),
    {
      method: 'POST',
      body: {}
    }
  );
}

export function rejectPasswordResetApi(requestId: string, reason: string = '') {
  return apiRequest<ApiEnvelope<{ message: string }>>(
    endpoints.auth.rejectPasswordReset(requestId),
    {
      method: 'POST',
      body: { reason }
    }
  );
}
