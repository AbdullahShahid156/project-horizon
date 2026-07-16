import { api } from './api';
import type { GeneratedWebsite, WebsitePrompt } from '@/types';

export const aiService = {
  generateWebsite: (data: {
    project_id: string;
    name: string;
    prompt: WebsitePrompt;
  }) => api.post<GeneratedWebsite>('/api/v1/ai/generate-website', data),

  generatePreview: (data: {
    project_id: string;
    name: string;
    prompt: WebsitePrompt;
  }) => api.post<{ preview: Record<string, unknown> }>('/api/v1/ai/generate-website-preview', data),
};
