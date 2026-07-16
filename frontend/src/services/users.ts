import { api } from './api';
import type { User } from '@/types';

export const usersService = {
  getCurrentUser: () => api.get<User>('/users/me'),

  updateProfile: (data: Partial<User>) => api.put<User>('/users/me', data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post<void>('/users/me/change-password', data),

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<User>('/users/me/avatar', formData, {
      'Content-Type': 'multipart/form-data',
    });
  },
};
