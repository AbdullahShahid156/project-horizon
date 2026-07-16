import { api } from './api';
import type { GeneratedWebsite, WebsiteVersion, WebsiteOutput } from '@/types';

export const websitesService = {
  get: (id: string) => api.get<GeneratedWebsite>(`/api/v1/websites/${id}`),

  update: (id: string, data: { content: WebsiteOutput; changeSummary?: string }) =>
    api.put<GeneratedWebsite>(`/api/v1/websites/${id}`, data),

  listVersions: (id: string) =>
    api.get<WebsiteVersion[]>(`/api/v1/websites/${id}/versions`),

  createVersion: (id: string, data: { content: WebsiteOutput; changeSummary?: string }) =>
    api.post<WebsiteVersion>(`/api/v1/websites/${id}/versions`, data),

  autoSave: (id: string, content: WebsiteOutput) =>
    api.post<{ status: string }>(`/api/v1/websites/${id}/auto-save`, {
      content,
      change_summary: 'Auto-save',
    }),

  restoreVersion: (id: string, versionNumber: number) =>
    api.post<GeneratedWebsite>(`/api/v1/websites/${id}/restore`, {
      version_number: versionNumber,
    }),
};
