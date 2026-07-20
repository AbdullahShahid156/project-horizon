import { api } from './api';
import type { Organization, Membership } from '@/types';

const API_PREFIX = '/api/v1';

export const organizationsService = {
  list: () => api.get<Organization[]>(`${API_PREFIX}/organizations`),

  get: (id: string) => api.get<Organization>(`${API_PREFIX}/organizations/${id}`),

  create: (data: { name: string; slug: string }) =>
    api.post<Organization>(`${API_PREFIX}/organizations`, data),

  update: (id: string, data: Partial<Organization>) =>
    api.put<Organization>(`${API_PREFIX}/organizations/${id}`, data),

  delete: (id: string) => api.delete<void>(`${API_PREFIX}/organizations/${id}`),

  getMembers: (id: string) => api.get<Membership[]>(`${API_PREFIX}/organizations/${id}/members`),

  inviteMember: (id: string, data: { email: string; role: string }) =>
    api.post<void>(`${API_PREFIX}/organizations/${id}/invite`, data),

  removeMember: (orgId: string, memberId: string) =>
    api.delete<void>(`${API_PREFIX}/organizations/${orgId}/members/${memberId}`),
};
