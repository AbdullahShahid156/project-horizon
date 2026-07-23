export interface EmailCampaign {
  id: string;
  workspace_id: string;
  name: string;
  subject: string;
  preview_text: string | null;
  email_type: string;
  html_content: string | null;
  markdown_content: string | null;
  plain_text: string | null;
  json_content: Record<string, unknown> | null;
  brand: string | null;
  audience: string | null;
  goal: string | null;
  tone: string | null;
  language: string;
  cta: string | null;
  product: string | null;
  keywords: string[] | null;
  template_id: string | null;
  status: string;
  sent_at: string | null;
  open_rate: number | null;
  click_rate: number | null;
  unsubscribe_rate: number | null;
  recipient_count: number;
  ai_generated: boolean;
  ai_provider: string | null;
  ai_latency_ms: number | null;
  created_at: string;
  updated_at: string;
}

export interface EmailTemplate {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  category: string;
  email_type: string;
  subject: string;
  preview_text: string | null;
  html_content: string;
  markdown_content: string | null;
  json_content: Record<string, unknown> | null;
  variables: string[] | null;
  thumbnail_url: string | null;
  is_system: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface EmailHistoryEntry {
  id: string;
  campaign_id: string;
  action: string;
  content_before: string | null;
  content_after: string | null;
  ai_provider: string | null;
  latency_ms: number | null;
  created_at: string;
}

export interface EmailStats {
  total_campaigns: number;
  by_type: Record<string, number>;
  by_status: Record<string, number>;
  ai_generated_count: number;
  total_templates: number;
  avg_open_rate: number;
  avg_click_rate: number;
  total_recipients: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_PREFIX = `${API_BASE}/api/v1/email`;

class EmailStudioService {
  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    let response: Response;
    try {
      response = await fetch(`${API_PREFIX}${path}`, {
        ...options,
        headers: { "Content-Type": "application/json", ...options?.headers },
      });
    } catch {
      throw new Error("Unable to connect to the server. Please ensure the backend is running.");
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Request failed" }));
      throw new Error(error.detail || `Request failed with status ${response.status}`);
    }
    return response.json();
  }

  async listCampaigns(workspaceId: string, params: { search?: string; email_type?: string; status?: string; is_deleted?: boolean; sort_by?: string; sort_order?: string; page?: number; page_size?: number } = {}): Promise<{ items: EmailCampaign[]; total: number; page: number; page_size: number; total_pages: number }> {
    const query = new URLSearchParams({ workspace_id: workspaceId });
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null) query.set(k, String(v)); });
    return this.request(`/campaigns?${query}`);
  }

  async getStats(workspaceId: string): Promise<EmailStats> {
    return this.request(`/campaigns/stats?workspace_id=${workspaceId}`);
  }

  async getCampaign(campaignId: string): Promise<EmailCampaign> {
    return this.request(`/campaigns/${campaignId}`);
  }

  async createCampaign(data: { workspace_id: string; name: string; subject: string; preview_text?: string; email_type?: string; html_content?: string; markdown_content?: string; brand?: string; audience?: string; goal?: string; tone?: string; language?: string; cta?: string; product?: string; keywords?: string[]; template_id?: string }): Promise<EmailCampaign> {
    return this.request("/campaigns", { method: "POST", body: JSON.stringify(data) });
  }

  async updateCampaign(campaignId: string, data: { name?: string; subject?: string; preview_text?: string; html_content?: string; markdown_content?: string; status?: string }): Promise<EmailCampaign> {
    return this.request(`/campaigns/${campaignId}`, { method: "PUT", body: JSON.stringify(data) });
  }

  async deleteCampaign(campaignId: string): Promise<{ detail: string }> {
    return this.request(`/campaigns/${campaignId}`, { method: "DELETE" });
  }

  async restoreCampaign(campaignId: string): Promise<EmailCampaign> {
    return this.request(`/campaigns/${campaignId}/restore`, { method: "POST" });
  }

  async duplicateCampaign(campaignId: string): Promise<EmailCampaign> {
    return this.request(`/campaigns/${campaignId}/duplicate`, { method: "POST" });
  }

  async sendCampaign(campaignId: string): Promise<EmailCampaign> {
    return this.request(`/campaigns/${campaignId}/send`, { method: "POST" });
  }

  async getCampaignHistory(campaignId: string): Promise<EmailHistoryEntry[]> {
    return this.request(`/campaigns/${campaignId}/history`);
  }

  async generateEmail(data: { workspace_id: string; email_type: string; brand?: string; campaign_name?: string; audience?: string; goal?: string; tone?: string; language?: string; cta?: string; product?: string; keywords?: string[]; context?: string; num_variations?: number }): Promise<{ campaigns: EmailCampaign[]; provider: string; latency_ms: number }> {
    return this.request("/generate", { method: "POST", body: JSON.stringify(data) });
  }

  async aiAction(data: { campaign_id: string; action: string; context?: string }): Promise<{ campaign_id: string; field: string; original: string; updated: string; action: string; provider: string; latency_ms: number }> {
    return this.request("/ai/action", { method: "POST", body: JSON.stringify(data) });
  }

  async listTemplates(workspaceId: string, params: { category?: string; email_type?: string; search?: string } = {}): Promise<EmailTemplate[]> {
    const query = new URLSearchParams({ workspace_id: workspaceId });
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null) query.set(k, String(v)); });
    return this.request(`/templates?${query}`);
  }

  async createTemplate(data: { workspace_id: string; name: string; description?: string; category?: string; email_type: string; subject: string; preview_text?: string; html_content: string; markdown_content?: string; variables?: string[] }): Promise<EmailTemplate> {
    return this.request("/templates", { method: "POST", body: JSON.stringify(data) });
  }

  async getTemplate(templateId: string): Promise<EmailTemplate> {
    return this.request(`/templates/${templateId}`);
  }

  async updateTemplate(templateId: string, data: { name?: string; description?: string; html_content?: string; subject?: string }): Promise<EmailTemplate> {
    return this.request(`/templates/${templateId}`, { method: "PUT", body: JSON.stringify(data) });
  }

  async deleteTemplate(templateId: string): Promise<{ detail: string }> {
    return this.request(`/templates/${templateId}`, { method: "DELETE" });
  }

  async useTemplate(templateId: string): Promise<EmailTemplate> {
    return this.request(`/templates/${templateId}/use`, { method: "POST" });
  }
}

export const emailStudioService = new EmailStudioService();
