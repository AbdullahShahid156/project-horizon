import { api } from './api';
import type { Workspace } from '@/types';

export const workspacesService = {
  list: (organizationId: string) =>
    api.get<Workspace[]>(`/organizations/${organizationId}/workspaces`),

  get: (id: string) => api.get<Workspace>(`/workspaces/${id}`),

  create: (organizationId: string, data: { name: string; description?: string }) =>
    api.post<Workspace>(`/organizations/${organizationId}/workspaces`, data),

  update: (id: string, data: Partial<Workspace>) =>
    api.put<Workspace>(`/workspaces/${id}`, data),

  delete: (id: string) => api.delete<void>(`/workspaces/${id}`),
};
