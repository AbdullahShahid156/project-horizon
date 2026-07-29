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
    api.post<{ detail: string; email_status?: string }>(`${API_PREFIX}/organizations/${id}/invite`, data),

  removeMember: (orgId: string, memberId: string) =>
    api.delete<void>(`${API_PREFIX}/organizations/${orgId}/members/${memberId}`),

  acceptInvitation: (orgId: string, memberId: string, email: string) =>
    api.post<{ detail: string; member: Membership }>(`${API_PREFIX}/organizations/${orgId}/members/${memberId}/accept`, { email }),

  updateMemberRole: (orgId: string, memberId: string, role: string) =>
    api.put<{ detail: string }>(`${API_PREFIX}/organizations/${orgId}/members/${memberId}/role`, { role }),

  getStats: (id: string) =>
    api.get<{ total_members: number; roles: Record<string, number> }>(`${API_PREFIX}/organizations/${id}/stats`),
};
