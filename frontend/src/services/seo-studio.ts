export interface SEODomain {
  id: string;
  workspace_id: string;
  url: string;
  name: string;
  health_score: number;
  technical_score: number;
  content_score: number;
  last_audited_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SEOAudit {
  id: string;
  domain_id: string;
  url: string;
  status: string;
  overall_score: number;
  technical_score: number;
  content_score: number;
  on_page_score: number;
  off_page_score: number;
  issues: Record<string, unknown> | null;
  recommendations: Record<string, unknown> | null;
  metrics: Record<string, unknown> | null;
  created_at: string;
}

export interface SEOKeyword {
  id: string;
  domain_id: string;
  keyword: string;
  search_volume: number;
  difficulty: number;
  cpc: number;
  intent: string;
  keyword_type: string;
  cluster_id: string | null;
  position: number | null;
  url: string | null;
  is_tracked: boolean;
  created_at: string;
  updated_at: string;
}

export interface SEOKeywordCluster {
  id: string;
  domain_id: string;
  name: string;
  description: string | null;
  pillar_keyword: string | null;
  keyword_count: number;
  avg_volume: number;
  created_at: string;
}

export interface SEOOnPageResult {
  meta_title: string;
  meta_description: string;
  slug: string;
  canonical: string;
  og_title: string;
  og_description: string;
  og_image: string;
  twitter_title: string;
  twitter_description: string;
  heading_structure: Record<string, string>;
  image_alt_tags: Array<{ src: string; alt: string }>;
  recommendations: Array<{ priority: string; title: string; description: string }>;
  score: number;
}

export interface SEOTechnicalIssue {
  type: string;
  severity: string;
  message: string;
  url?: string;
  recommendation: string;
}

export interface SEOTechnicalResult {
  score: number;
  issues: SEOTechnicalIssue[];
  metrics: Record<string, unknown>;
  crawlable: boolean;
  robots_txt: boolean;
  sitemap: boolean;
  canonical: boolean;
  mixed_content: boolean;
  redirect_chain: boolean;
}

export interface SEOContentOptimizeResult {
  score: number;
  issues: Array<{ type: string; message: string; severity: string }>;
  keyword_density: Record<string, number>;
  readability: { score: number; level: string; avg_sentence_length: number; avg_word_length: number };
  suggestions: string[];
  optimized_title: string;
  optimized_meta: string;
  heading_suggestions: string[];
  faq_suggestions: Array<{ question: string; answer: string }>;
}

export interface SEOSchema {
  id: string;
  domain_id: string;
  schema_type: string;
  name: string;
  json_ld: Record<string, unknown>;
  url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SEOInternalLink {
  id: string;
  source_url: string;
  target_url: string;
  anchor_text: string | null;
  suggestion_type: string;
  is_implemented: boolean;
  created_at: string;
}

export interface SEOReport {
  id: string;
  domain_id: string;
  title: string;
  report_type: string;
  status: string;
  summary: Record<string, unknown> | null;
  score: number;
  issues_count: number;
  recommendations_count: number;
  file_url: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface SEORecommendation {
  id: string;
  domain_id: string;
  category: string;
  priority: string;
  title: string;
  description: string | null;
  impact: string | null;
  effort: string | null;
  status: string;
  url: string | null;
  created_at: string;
}

export interface SEOCompetitor {
  id: string;
  domain_id: string;
  competitor_url: string;
  competitor_name: string;
  notes: string | null;
  analysis: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface SEOCompetitorAnalysis {
  strengths: string[];
  weaknesses: string[];
  keyword_opportunities: string[];
  content_gaps: string[];
  overall_comparison: string;
}

export interface SEOHistoryItem {
  id: string;
  domain_id: string;
  event_type: string;
  data: Record<string, unknown> | null;
  score: number | null;
  created_at: string;
}

export interface SEODashboard {
  health_score: number;
  technical_score: number;
  content_score: number;
  keyword_coverage: number;
  broken_links: number;
  missing_meta_tags: number;
  schema_coverage: number;
  indexability: number;
  issues_summary: Record<string, number>;
  total_keywords: number;
  total_pages: number;
  total_audits: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_PREFIX = `${API_BASE}/api/v1/seo`;

class SEOStudioService {
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

  async listDomains(workspaceId: string): Promise<SEODomain[]> {
    return this.request(`/domains?workspace_id=${workspaceId}`);
  }

  async createDomain(data: { workspace_id: string; url: string; name: string }): Promise<SEODomain> {
    return this.request("/domains", { method: "POST", body: JSON.stringify(data) });
  }

  async getDomain(domainId: string): Promise<SEODomain> {
    return this.request(`/domains/${domainId}`);
  }

  async deleteDomain(domainId: string): Promise<{ detail: string }> {
    return this.request(`/domains/${domainId}`, { method: "DELETE" });
  }

  async getDashboard(domainId: string): Promise<SEODashboard> {
    return this.request(`/dashboard?domain_id=${domainId}`);
  }

  async listAudits(domainId: string): Promise<SEOAudit[]> {
    return this.request(`/audits?domain_id=${domainId}`);
  }

  async runAudit(domainId: string, url: string): Promise<SEOAudit> {
    return this.request("/audits", { method: "POST", body: JSON.stringify({ domain_id: domainId, url }) });
  }

  async listKeywords(domainId: string, keywordType?: string, intent?: string): Promise<SEOKeyword[]> {
    const params = new URLSearchParams({ domain_id: domainId });
    if (keywordType) params.set("keyword_type", keywordType);
    if (intent) params.set("intent", intent);
    return this.request(`/keywords?${params}`);
  }

  async addKeyword(data: { domain_id: string; keyword: string; keyword_type?: string; cluster_id?: string }): Promise<SEOKeyword> {
    return this.request("/keywords", { method: "POST", body: JSON.stringify(data) });
  }

  async generateKeywords(data: { domain_id: string; seed_keywords: string[]; industry?: string; target_audience?: string; count?: number }): Promise<SEOKeyword[]> {
    return this.request("/keywords/generate", { method: "POST", body: JSON.stringify(data) });
  }

  async listClusters(domainId: string): Promise<SEOKeywordCluster[]> {
    return this.request(`/keywords/clusters?domain_id=${domainId}`);
  }

  async createCluster(data: { domain_id: string; name: string; description?: string; pillar_keyword?: string }): Promise<SEOKeywordCluster> {
    return this.request("/keywords/clusters", { method: "POST", body: JSON.stringify(data) });
  }

  async analyzeOnPage(data: { url: string; title?: string; body?: string; keywords?: string[] }): Promise<SEOOnPageResult> {
    return this.request("/on-page", { method: "POST", body: JSON.stringify(data) });
  }

  async analyzeTechnical(data: { url: string }): Promise<SEOTechnicalResult> {
    return this.request("/technical", { method: "POST", body: JSON.stringify(data) });
  }

  async optimizeContent(data: { title: string; body: string; target_keywords: string[]; content_type?: string }): Promise<SEOContentOptimizeResult> {
    return this.request("/content-optimize", { method: "POST", body: JSON.stringify(data) });
  }

  async listSchemas(domainId: string): Promise<SEOSchema[]> {
    return this.request(`/schemas?domain_id=${domainId}`);
  }

  async createSchema(data: { domain_id: string; schema_type: string; name: string; url?: string; data: Record<string, unknown> }): Promise<SEOSchema> {
    return this.request("/schemas", { method: "POST", body: JSON.stringify(data) });
  }

  async generateSchema(data: { domain_id: string; schema_type: string; name: string; url?: string; data: Record<string, unknown> }): Promise<SEOSchema> {
    return this.request("/schemas/generate", { method: "POST", body: JSON.stringify(data) });
  }

  async deleteSchema(schemaId: string): Promise<{ detail: string }> {
    return this.request(`/schemas/${schemaId}`, { method: "DELETE" });
  }

  async listInternalLinks(domainId: string): Promise<SEOInternalLink[]> {
    return this.request(`/internal-links?domain_id=${domainId}`);
  }

  async suggestInternalLinks(data: { domain_id: string; url: string; content?: string; max_suggestions?: number }): Promise<SEOInternalLink[]> {
    return this.request("/internal-links/suggest", { method: "POST", body: JSON.stringify(data) });
  }

  async implementInternalLink(linkId: string): Promise<{ detail: string }> {
    return this.request(`/internal-links/${linkId}/implement`, { method: "POST" });
  }

  async listReports(domainId: string): Promise<SEOReport[]> {
    return this.request(`/reports?domain_id=${domainId}`);
  }

  async createReport(data: { domain_id: string; title: string; report_type?: string }): Promise<SEOReport> {
    return this.request("/reports", { method: "POST", body: JSON.stringify(data) });
  }

  async getReport(reportId: string): Promise<SEOReport> {
    return this.request(`/reports/${reportId}`);
  }

  async listRecommendations(domainId: string, status?: string): Promise<SEORecommendation[]> {
    const params = new URLSearchParams({ domain_id: domainId });
    if (status) params.set("status", status);
    return this.request(`/recommendations?${params}`);
  }

  async resolveRecommendation(recId: string): Promise<{ detail: string }> {
    return this.request(`/recommendations/${recId}/resolve`, { method: "POST" });
  }

  async listCompetitors(domainId: string): Promise<SEOCompetitor[]> {
    return this.request(`/competitors?domain_id=${domainId}`);
  }

  async addCompetitor(data: { domain_id: string; competitor_url: string; competitor_name: string; notes?: string }): Promise<SEOCompetitor> {
    return this.request("/competitors", { method: "POST", body: JSON.stringify(data) });
  }

  async analyzeCompetitor(data: { domain_url: string; competitor_url: string; industry?: string }): Promise<SEOCompetitorAnalysis> {
    return this.request("/competitors/analyze", { method: "POST", body: JSON.stringify(data) });
  }

  async deleteCompetitor(compId: string): Promise<{ detail: string }> {
    return this.request(`/competitors/${compId}`, { method: "DELETE" });
  }

  async listHistory(domainId: string, eventType?: string): Promise<SEOHistoryItem[]> {
    const params = new URLSearchParams({ domain_id: domainId });
    if (eventType) params.set("event_type", eventType);
    return this.request(`/history?${params}`);
  }

  async aiSuggest(data: { action: string; context: string; keywords?: string[]; content_type?: string }): Promise<{ suggestions: Array<Record<string, unknown>>; action: string; provider: string; latency_ms: number }> {
    return this.request("/ai/suggest", { method: "POST", body: JSON.stringify(data) });
  }

  async exportDomain(domainId: string, format: string): Promise<{ content: string; format: string; filename: string }> {
    return this.request(`/domains/${domainId}/export?format=${format}`);
  }
}

export const seoStudioService = new SEOStudioService();
