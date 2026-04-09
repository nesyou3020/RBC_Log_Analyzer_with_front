import { ApiEnvelope, CreateUserRequest, UserPublic, UserRole } from '../../types';
import { apiRequest } from './client';
import { endpoints } from './endpoints';

export function listUsersApi() {
  return apiRequest<ApiEnvelope<UserPublic[]>>(endpoints.users.list);
}

export function createUserApi(payload: CreateUserRequest) {
  return apiRequest<ApiEnvelope<{ user_id: string }>>(endpoints.users.create, {
    method: 'POST',
    body: payload
  });
}

export function setUserRoleApi(userId: string, role: UserRole) {
  return apiRequest<ApiEnvelope<{ message: string }>>(endpoints.users.setRole(userId), {
    method: 'PATCH',
    body: { role }
  });
}

export function setUserActiveApi(userId: string, isActive: boolean) {
  return apiRequest<ApiEnvelope<{ message: string }>>(endpoints.users.setActive(userId), {
    method: 'PATCH',
    body: { is_active: isActive }
  });
}

export function deleteUserApi(userId: string) {
  return apiRequest<ApiEnvelope<{ message: string }>>(endpoints.users.delete(userId), {
    method: 'DELETE'
  });
}
