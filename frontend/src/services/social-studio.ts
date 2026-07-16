export interface SocialPost {
  id: string;
  workspace_id: string;
  campaign_id: string | null;
  platform: string;
  post_type: string;
  content: string;
  headline: string | null;
  caption: string | null;
  hashtags: string[] | null;
  cta: string | null;
  emojis: string[] | null;
  image_suggestions: string[] | null;
  image_ids: string[] | null;
  carousel_content: Array<{ title: string; description: string; image_url?: string }> | null;
  story_content: { text: string; overlay?: string } | null;
  reel_script: string | null;
  poll_ideas: string[] | null;
  business: string | null;
  brand: string | null;
  target_audience: string | null;
  goal: string | null;
  tone: string | null;
  keywords: string[] | null;
  status: string;
  scheduled_date: string | null;
  published_at: string | null;
  performance_score: number | null;
  ai_generated: boolean;
  ai_provider: string | null;
  ai_latency_ms: number | null;
  created_at: string;
  updated_at: string;
}

export interface SocialCampaign {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  platforms: string[] | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  target_audience: string | null;
  goals: string[] | null;
  post_count: number;
  created_at: string;
  updated_at: string;
}

export interface SocialCalendarEntry {
  id: string;
  workspace_id: string;
  post_id: string | null;
  date: string;
  platform: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SocialHashtag {
  id: string;
  workspace_id: string;
  tag: string;
  category: string | null;
  usage_count: number;
  created_at: string;
}

export interface SocialStats {
  total_posts: number;
  by_platform: Record<string, number>;
  by_status: Record<string, number>;
  by_type: Record<string, number>;
  ai_generated_count: number;
  avg_performance_score: number;
  total_campaigns: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_PREFIX = `${API_BASE}/api/v1/social`;

class SocialStudioService {
  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_PREFIX}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...options?.headers },
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Request failed" }));
      throw new Error(error.detail || "Request failed");
    }
    return response.json();
  }

  async listPosts(workspaceId: string, params: { search?: string; platform?: string; post_type?: string; status?: string; campaign_id?: string; is_deleted?: boolean; sort_by?: string; sort_order?: string; page?: number; page_size?: number } = {}): Promise<{ items: SocialPost[]; total: number; page: number; page_size: number; total_pages: number }> {
    const query = new URLSearchParams({ workspace_id: workspaceId });
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null) query.set(k, String(v)); });
    return this.request(`/posts?${query}`);
  }

  async getStats(workspaceId: string): Promise<SocialStats> {
    return this.request(`/posts/stats?workspace_id=${workspaceId}`);
  }

  async getPost(postId: string): Promise<SocialPost> {
    return this.request(`/posts/${postId}`);
  }

  async createPost(data: { workspace_id: string; campaign_id?: string; platform: string; post_type?: string; content: string; headline?: string; caption?: string; hashtags?: string[]; cta?: string; emojis?: string[]; image_ids?: string[]; business?: string; brand?: string; target_audience?: string; goal?: string; tone?: string; keywords?: string[]; scheduled_date?: string }): Promise<SocialPost> {
    return this.request("/posts", { method: "POST", body: JSON.stringify(data) });
  }

  async updatePost(postId: string, data: { content?: string; headline?: string; caption?: string; hashtags?: string[]; cta?: string; emojis?: string[]; image_ids?: string[]; status?: string; scheduled_date?: string }): Promise<SocialPost> {
    return this.request(`/posts/${postId}`, { method: "PUT", body: JSON.stringify(data) });
  }

  async deletePost(postId: string): Promise<{ detail: string }> {
    return this.request(`/posts/${postId}`, { method: "DELETE" });
  }

  async restorePost(postId: string): Promise<SocialPost> {
    return this.request(`/posts/${postId}/restore`, { method: "POST" });
  }

  async duplicatePost(postId: string): Promise<SocialPost> {
    return this.request(`/posts/${postId}/duplicate`, { method: "POST" });
  }

  async publishPost(postId: string): Promise<SocialPost> {
    return this.request(`/posts/${postId}/publish`, { method: "POST" });
  }

  async archivePost(postId: string): Promise<SocialPost> {
    return this.request(`/posts/${postId}/archive`, { method: "POST" });
  }

  async getPostHistory(postId: string): Promise<Array<{ id: string; post_id: string; action: string; content_before: string | null; content_after: string | null; ai_provider: string | null; latency_ms: number | null; created_at: string }>> {
    return this.request(`/posts/${postId}/history`);
  }

  async generatePost(data: { workspace_id: string; platform: string; post_type?: string; business?: string; brand?: string; campaign_id?: string; target_audience?: string; goal?: string; tone?: string; keywords?: string[]; cta?: string; topic?: string; num_variations?: number }): Promise<{ posts: SocialPost[]; provider: string; latency_ms: number }> {
    return this.request("/generate", { method: "POST", body: JSON.stringify(data) });
  }

  async aiAction(data: { post_id: string; action: string; context?: string }): Promise<{ post_id: string; content: string; action: string; provider: string; latency_ms: number }> {
    return this.request("/ai/action", { method: "POST", body: JSON.stringify(data) });
  }

  async listCampaigns(workspaceId: string, params: { search?: string; status?: string } = {}): Promise<{ items: SocialCampaign[]; total: number }> {
    const query = new URLSearchParams({ workspace_id: workspaceId });
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null) query.set(k, String(v)); });
    return this.request(`/campaigns?${query}`);
  }

  async createCampaign(data: { workspace_id: string; name: string; description?: string; platforms?: string[]; start_date?: string; end_date?: string; target_audience?: string; goals?: string[] }): Promise<SocialCampaign> {
    return this.request("/campaigns", { method: "POST", body: JSON.stringify(data) });
  }

  async getCampaign(campaignId: string): Promise<SocialCampaign> {
    return this.request(`/campaigns/${campaignId}`);
  }

  async updateCampaign(campaignId: string, data: { name?: string; description?: string; platforms?: string[]; status?: string; start_date?: string; end_date?: string }): Promise<SocialCampaign> {
    return this.request(`/campaigns/${campaignId}`, { method: "PUT", body: JSON.stringify(data) });
  }

  async deleteCampaign(campaignId: string): Promise<{ detail: string }> {
    return this.request(`/campaigns/${campaignId}`, { method: "DELETE" });
  }

  async listCalendar(workspaceId: string, params: { month?: string; year?: string; platform?: string } = {}): Promise<SocialCalendarEntry[]> {
    const query = new URLSearchParams({ workspace_id: workspaceId });
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null) query.set(k, String(v)); });
    return this.request(`/calendar?${query}`);
  }

  async createCalendarEntry(data: { workspace_id: string; post_id?: string; date: string; platform: string; status?: string; notes?: string }): Promise<SocialCalendarEntry> {
    return this.request("/calendar", { method: "POST", body: JSON.stringify(data) });
  }

  async updateCalendarEntry(entryId: string, data: { date?: string; platform?: string; status?: string; notes?: string }): Promise<SocialCalendarEntry> {
    return this.request(`/calendar/${entryId}`, { method: "PUT", body: JSON.stringify(data) });
  }

  async deleteCalendarEntry(entryId: string): Promise<{ detail: string }> {
    return this.request(`/calendar/${entryId}`, { method: "DELETE" });
  }

  async listHashtags(workspaceId: string, params: { search?: string; category?: string } = {}): Promise<SocialHashtag[]> {
    const query = new URLSearchParams({ workspace_id: workspaceId });
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null) query.set(k, String(v)); });
    return this.request(`/hashtags?${query}`);
  }

  async createHashtag(data: { workspace_id: string; tag: string; category?: string }): Promise<SocialHashtag> {
    return this.request("/hashtags", { method: "POST", body: JSON.stringify(data) });
  }

  async deleteHashtag(hashtagId: string): Promise<{ detail: string }> {
    return this.request(`/hashtags/${hashtagId}`, { method: "DELETE" });
  }
}

export const socialStudioService = new SocialStudioService();
