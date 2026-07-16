import { api } from './api';
import type { Organization, Membership } from '@/types';

export const organizationsService = {
  list: () => api.get<Organization[]>('/organizations'),

  get: (id: string) => api.get<Organization>(`/organizations/${id}`),

  create: (data: { name: string; slug: string }) =>
    api.post<Organization>('/organizations', data),

  update: (id: string, data: Partial<Organization>) =>
    api.put<Organization>(`/organizations/${id}`, data),

  delete: (id: string) => api.delete<void>(`/organizations/${id}`),

  getMembers: (id: string) => api.get<Membership[]>(`/organizations/${id}/members`),

  inviteMember: (id: string, data: { email: string; role: string }) =>
    api.post<void>(`/organizations/${id}/invite`, data),

  removeMember: (orgId: string, memberId: string) =>
    api.delete<void>(`/organizations/${orgId}/members/${memberId}`),
};
