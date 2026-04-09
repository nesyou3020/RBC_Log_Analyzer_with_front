export const endpoints = {
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    changePassword: '/auth/change-password',
    passwordResetRequests: '/auth/password-reset-requests',
    approvePasswordReset: (requestId: string) => `/auth/password-reset-requests/${requestId}/approve`,
    rejectPasswordReset: (requestId: string) => `/auth/password-reset-requests/${requestId}/reject`
  },
  imports: {
    list: '/imports',
    create: '/imports',
    download: (fileId: string) => `/imports/${fileId}/download`,
    delete: (fileId: string) => `/imports/${fileId}`
  },
  events: {
    trains: '/events/trains',
    list: '/events',
    raw: '/events/raw'
  },
  dashboard: {
    summary: '/dashboard/summary'
  },
  audit: {
    list: '/audit'
  },
  scenarios: {
    list: '/scenarios',
    create: '/scenarios',
    uploadExcel: '/scenarios/upload-excel',
    previewExcel: '/scenarios/preview-excel',
    delete: (templateId: string) => `/scenarios/${templateId}`
  },
  users: {
    list: '/users',
    create: '/users',
    setRole: (userId: string) => `/users/${userId}/role`,
    setActive: (userId: string) => `/users/${userId}/active`,
    delete: (userId: string) => `/users/${userId}`
  }
};
