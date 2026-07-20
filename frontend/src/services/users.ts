import { api } from './api';
import type { User } from '@/types';

const API_PREFIX = '/api/v1';

export const usersService = {
  getCurrentUser: () => api.get<User>(`${API_PREFIX}/users/me`),

  updateProfile: (data: Partial<User>) => api.put<User>(`${API_PREFIX}/users/me`, data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post<void>(`${API_PREFIX}/users/me/change-password`, data),

  uploadAvatar: (file: File) => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const formData = new FormData();
    formData.append('file', file);
    return fetch(`${API_URL}${API_PREFIX}/users/me/avatar`, {
      method: 'POST',
      body: formData,
    }).then(async (response) => {
      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
        throw new Error(error.detail || 'Upload failed');
      }
      return response.json() as Promise<User>;
    });
  },
};
