import { api } from './api';
import type { Workspace } from '@/types';

const API_PREFIX = '/api/v1';

export const workspacesService = {
  list: (organizationId: string) =>
    api.get<Workspace[]>(`${API_PREFIX}/workspaces/org/${organizationId}`),

  get: (id: string) => api.get<Workspace>(`${API_PREFIX}/workspaces/${id}`),

  create: (organizationId: string, data: { name: string; description?: string }) =>
    api.post<Workspace>(`${API_PREFIX}/workspaces/org/${organizationId}`, data),

  update: (id: string, data: Partial<Workspace>) =>
    api.put<Workspace>(`${API_PREFIX}/workspaces/${id}`, data),

  delete: (id: string) => api.delete<void>(`${API_PREFIX}/workspaces/${id}`),
};
