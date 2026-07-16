import { api } from './api';
import type { Project, GeneratedWebsite } from '@/types';

export const projectsService = {
  list: () => api.get<Project[]>('/api/v1/projects/'),

  get: (id: string) => api.get<Project>(`/api/v1/projects/${id}`),

  create: (data: { name: string; workspaceId: string; description?: string }) =>
    api.post<Project>('/api/v1/projects/', data),

  update: (id: string, data: { name?: string; description?: string; status?: string }) =>
    api.put<Project>(`/api/v1/projects/${id}`, data),

  delete: (id: string) => api.delete<void>(`/api/v1/projects/${id}`),

  duplicate: (id: string) => api.post<Project>(`/api/v1/projects/${id}/duplicate`, {}),

  listWebsites: (projectId: string) =>
    api.get<GeneratedWebsite[]>(`/api/v1/websites/project/${projectId}`),
};
