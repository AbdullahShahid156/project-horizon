export interface ContentItem {
  id: string;
  workspace_id: string;
  folder_id: string | null;
  title: string;
  slug: string;
  content_type: string;
  status: string;
  body: Record<string, unknown> | null;
  html_body: string | null;
  plain_body: string | null;
  metadata: Record<string, unknown> | null;
  seo_data: Record<string, unknown> | null;
  prompt_data: Record<string, unknown> | null;
  generation_settings: Record<string, unknown> | null;
  current_version: number;
  word_count: number;
  is_favorite: boolean;
  is_archived: boolean;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface ContentVersion {
  id: string;
  version_number: number;
  title: string;
  body: Record<string, unknown> | null;
  html_body: string | null;
  plain_body: string | null;
  metadata: Record<string, unknown> | null;
  change_summary: string | null;
  is_auto_save: boolean;
  created_at: string;
}

export interface ContentFolder {
  id: string;
  workspace_id: string;
  name: string;
  parent_id: string | null;
  item_count: number;
  created_at: string;
  updated_at: string;
}

export interface ContentTag {
  id: string;
  workspace_id: string;
  name: string;
  color: string;
  item_count: number;
  created_at: string;
}

export interface ContentTemplate {
  id: string;
  workspace_id: string;
  name: string;
  slug: string;
  description: string | null;
  content_type: string;
  category: string;
  body: Record<string, unknown>;
  system_prompt: string | null;
  generation_settings: Record<string, unknown> | null;
  is_shared: boolean;
  is_favorite: boolean;
  use_count: number;
  created_at: string;
  updated_at: string;
}

export interface ContentStats {
  total: number;
  drafts: number;
  published: number;
  archived: number;
  favorites: number;
  by_type: Record<string, number>;
  by_status: Record<string, number>;
}

export interface ContentListResponse {
  items: ContentItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ContentGenerateRequest {
  workspace_id: string;
  content_type: string;
  title?: string;
  business_name?: string;
  product?: string;
  industry?: string;
  target_audience?: string;
  language?: string;
  country?: string;
  tone?: string;
  content_goal?: string;
  length?: string;
  keywords?: string[];
  competitors?: string[];
  call_to_action?: string;
  additional_instructions?: string;
}

export interface ContentGenerateResponse {
  content_id: string;
  title: string;
  body: Record<string, unknown>;
  html_body: string;
  plain_body: string;
  word_count: number;
  seo_data: Record<string, unknown>;
  provider: string;
  model: string;
  latency_ms: number;
  tokens: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    estimated_cost: number;
  };
}

export interface ContentAIOptimizeRequest {
  text: string;
  action: string;
  tone?: string;
  context?: string;
  content_type?: string;
  keywords?: string[];
}

export interface ContentAIOptimizeResponse {
  original: string;
  optimized: string;
  action: string;
  provider: string;
  latency_ms: number;
}

export interface ContentSEOAnalysis {
  score: number;
  issues: Array<{ type: string; message: string }>;
  keyword_density: Record<string, number>;
  readability: {
    score: number;
    word_count: number;
    sentence_count: number;
    avg_sentence_length: number;
  };
  heading_analysis: {
    total: number;
    by_level: Record<string, number>;
  };
  links: {
    internal: number;
    external: number;
    total: number;
  };
  suggestions: string[];
}

export interface ContentSEOAnalyzeRequest {
  title: string;
  body: string;
  meta_title?: string;
  meta_description?: string;
  keywords?: string[];
  url?: string;
}

export interface ContentExportResponse {
  content: string;
  format: string;
  filename: string;
}

export type ContentType =
  | "blog_post"
  | "product_description"
  | "landing_page_copy"
  | "website_copy"
  | "service_page"
  | "about_us"
  | "email_campaign"
  | "cold_email"
  | "newsletter"
  | "facebook_ad"
  | "instagram_caption"
  | "linkedin_post"
  | "twitter_post"
  | "google_ad"
  | "youtube_title"
  | "youtube_description"
  | "video_script"
  | "faq"
  | "tagline"
  | "headline"
  | "cta"
  | "meta_title"
  | "meta_description"
  | "press_release"
  | "case_study"
  | "sales_letter";

export const CONTENT_TYPES: Record<ContentType, { label: string; category: string; description: string }> = {
  blog_post: { label: "Blog Post", category: "content", description: "Long-form article or blog post" },
  product_description: { label: "Product Description", category: "ecommerce", description: "E-commerce product description" },
  landing_page_copy: { label: "Landing Page Copy", category: "website", description: "Copy for landing pages" },
  website_copy: { label: "Website Copy", category: "website", description: "General website copy" },
  service_page: { label: "Service Page", category: "website", description: "Service page content" },
  about_us: { label: "About Us", category: "website", description: "About us page content" },
  email_campaign: { label: "Email Campaign", category: "email", description: "Marketing email" },
  cold_email: { label: "Cold Email", category: "email", description: "Cold outreach email" },
  newsletter: { label: "Newsletter", category: "email", description: "Newsletter content" },
  facebook_ad: { label: "Facebook Ad", category: "social", description: "Facebook advertising copy" },
  instagram_caption: { label: "Instagram Caption", category: "social", description: "Instagram post caption" },
  linkedin_post: { label: "LinkedIn Post", category: "social", description: "LinkedIn post content" },
  twitter_post: { label: "X (Twitter) Post", category: "social", description: "Twitter/X post" },
  google_ad: { label: "Google Search Ad", category: "advertising", description: "Google search ad copy" },
  youtube_title: { label: "YouTube Title", category: "video", description: "YouTube video title" },
  youtube_description: { label: "YouTube Description", category: "video", description: "YouTube video description" },
  video_script: { label: "Video Script", category: "video", description: "Video script content" },
  faq: { label: "FAQ", category: "content", description: "Frequently asked questions" },
  tagline: { label: "Tagline", category: "branding", description: "Brand tagline or slogan" },
  headline: { label: "Headline", category: "branding", description: "Catchy headline" },
  cta: { label: "Call to Action", category: "branding", description: "Call to action text" },
  meta_title: { label: "Meta Title", category: "seo", description: "SEO meta title" },
  meta_description: { label: "Meta Description", category: "seo", description: "SEO meta description" },
  press_release: { label: "Press Release", category: "content", description: "Press release" },
  case_study: { label: "Case Study", category: "content", description: "Case study content" },
  sales_letter: { label: "Sales Letter", category: "copywriting", description: "Sales letter" },
};

export const CONTENT_CATEGORIES = {
  content: "Content",
  ecommerce: "E-commerce",
  website: "Website",
  email: "Email",
  social: "Social Media",
  advertising: "Advertising",
  video: "Video",
  branding: "Branding",
  seo: "SEO",
  copywriting: "Copywriting",
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_PREFIX = `${API_BASE}/api/v1/content`;

class ContentStudioService {
  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    try {
      const response = await fetch(`${API_PREFIX}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: "Request failed" }));
        throw new Error(error.detail || "Request failed");
      }
      return response.json();
    } catch (err) {
      if (err instanceof Error && err.message !== "Request failed") {
        throw new Error("Unable to connect to the server. Please ensure the backend is running.");
      }
      throw err;
    }
  }

  async getStats(workspaceId: string): Promise<ContentStats> {
    return this.request(`/stats?workspace_id=${workspaceId}`);
  }

  async listContent(
    workspaceId: string,
    params: {
      content_type?: string;
      folder_id?: string;
      status?: string;
      is_archived?: boolean;
      is_favorite?: boolean;
      tag?: string;
      search?: string;
      sort_by?: string;
      sort_order?: string;
      page?: number;
      page_size?: number;
    } = {}
  ): Promise<ContentListResponse> {
    const query = new URLSearchParams({ workspace_id: workspaceId });
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query.set(key, String(value));
      }
    });
    return this.request(`/?${query}`);
  }

  async getContent(itemId: string): Promise<ContentItem> {
    return this.request(`/${itemId}`);
  }

  async createContent(data: {
    workspace_id: string;
    folder_id?: string;
    title: string;
    content_type: string;
    body?: Record<string, unknown>;
    html_body?: string;
    plain_body?: string;
    metadata?: Record<string, unknown>;
    seo_data?: Record<string, unknown>;
    prompt_data?: Record<string, unknown>;
    generation_settings?: Record<string, unknown>;
    tags?: string[];
  }): Promise<ContentItem> {
    return this.request("/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateContent(
    itemId: string,
    data: {
      title?: string;
      folder_id?: string;
      body?: Record<string, unknown>;
      html_body?: string;
      plain_body?: string;
      metadata?: Record<string, unknown>;
      seo_data?: Record<string, unknown>;
      status?: string;
      tags?: string[];
      change_summary?: string;
    }
  ): Promise<ContentItem> {
    return this.request(`/${itemId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async autoSave(
    itemId: string,
    data: {
      body?: Record<string, unknown>;
      html_body?: string;
      plain_body?: string;
      seo_data?: Record<string, unknown>;
    }
  ): Promise<{ status: string }> {
    return this.request(`/${itemId}/auto-save`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async deleteContent(itemId: string): Promise<{ detail: string }> {
    return this.request(`/${itemId}`, { method: "DELETE" });
  }

  async restoreContent(itemId: string): Promise<ContentItem> {
    return this.request(`/${itemId}/restore`, { method: "POST" });
  }

  async duplicateContent(itemId: string): Promise<ContentItem> {
    return this.request(`/${itemId}/duplicate`, { method: "POST" });
  }

  async toggleFavorite(itemId: string): Promise<{ is_favorite: boolean }> {
    return this.request(`/${itemId}/favorite`, { method: "POST" });
  }

  async toggleArchive(itemId: string): Promise<{ is_archived: boolean }> {
    return this.request(`/${itemId}/archive`, { method: "POST" });
  }

  async listVersions(itemId: string): Promise<ContentVersion[]> {
    return this.request(`/${itemId}/versions`);
  }

  async restoreVersion(itemId: string, versionId: string): Promise<ContentItem> {
    return this.request(`/${itemId}/versions/${versionId}/restore`, { method: "POST" });
  }

  async generateContent(data: ContentGenerateRequest): Promise<ContentGenerateResponse> {
    return this.request("/generate", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async optimizeContent(data: ContentAIOptimizeRequest): Promise<ContentAIOptimizeResponse> {
    return this.request("/ai/optimize", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async analyzeSEO(data: ContentSEOAnalyzeRequest): Promise<ContentSEOAnalysis> {
    return this.request("/ai/seo", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async exportContent(
    itemId: string,
    format: string
  ): Promise<ContentExportResponse> {
    return this.request(`/content/${itemId}/export?format=${format}`);
  }

  async listFolders(workspaceId: string): Promise<ContentFolder[]> {
    return this.request(`/folders?workspace_id=${workspaceId}`);
  }

  async createFolder(data: {
    workspace_id: string;
    name: string;
    parent_id?: string;
  }): Promise<ContentFolder> {
    return this.request("/folders", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async deleteFolder(folderId: string): Promise<{ detail: string }> {
    return this.request(`/folders/${folderId}`, { method: "DELETE" });
  }

  async listTags(workspaceId: string): Promise<ContentTag[]> {
    return this.request(`/tags?workspace_id=${workspaceId}`);
  }

  async createTag(data: {
    workspace_id: string;
    name: string;
    color?: string;
  }): Promise<ContentTag> {
    return this.request("/tags", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async deleteTag(tagId: string): Promise<{ detail: string }> {
    return this.request(`/tags/${tagId}`, { method: "DELETE" });
  }

  async listTemplates(
    workspaceId: string,
    contentType?: string
  ): Promise<ContentTemplate[]> {
    const query = new URLSearchParams({ workspace_id: workspaceId });
    if (contentType) query.set("content_type", contentType);
    return this.request(`/templates?${query}`);
  }

  async createTemplate(data: {
    workspace_id: string;
    name: string;
    description?: string;
    content_type: string;
    category?: string;
    body: Record<string, unknown>;
    system_prompt?: string;
    generation_settings?: Record<string, unknown>;
  }): Promise<ContentTemplate> {
    return this.request("/templates", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async deleteTemplate(templateId: string): Promise<{ detail: string }> {
    return this.request(`/templates/${templateId}`, { method: "DELETE" });
  }

  async duplicateTemplate(templateId: string): Promise<ContentTemplate> {
    return this.request(`/templates/${templateId}/duplicate`, { method: "POST" });
  }

  async bulkUpdate(data: {
    ids: string[];
    folder_id?: string;
    status?: string;
    is_archived?: boolean;
  }): Promise<{ updated: number }> {
    return this.request("/bulk-update", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async bulkDelete(ids: string[]): Promise<{ deleted: number }> {
    return this.request("/bulk-delete", {
      method: "POST",
      body: JSON.stringify(ids),
    });
  }
}

export const contentStudioService = new ContentStudioService();
