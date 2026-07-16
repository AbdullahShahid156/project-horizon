export interface PerformanceAudit {
  id: string;
  project_id: string;
  url: string;
  status: string;
  overall_score: number;
  performance_score: number;
  accessibility_score: number;
  best_practices_score: number;
  seo_score: number;
  metrics: Record<string, unknown> | null;
  issues: Record<string, unknown> | null;
  recommendations: Record<string, unknown> | null;
  resources: Record<string, unknown> | null;
  created_at: string;
  completed_at: string | null;
}

export interface CoreWebVitals {
  id: string;
  audit_id: string;
  url: string;
  lcp: number;
  lcp_status: string;
  inp: number;
  inp_status: string;
  cls: number;
  cls_status: string;
  fcp: number;
  fcp_status: string;
  ttfb: number;
  ttfb_status: string;
  speed_index: number;
  speed_index_status: string;
  tbt: number;
  tbt_status: string;
  created_at: string;
}

export interface PerformanceRecommendation {
  id: string;
  audit_id: string;
  category: string;
  priority: string;
  title: string;
  problem: string | null;
  impact: string | null;
  estimated_improvement: string | null;
  implementation_guide: string | null;
  status: string;
  created_at: string;
}

export interface OptimizationHistoryItem {
  id: string;
  project_id: string;
  event_type: string;
  data: Record<string, unknown> | null;
  score_before: number | null;
  score_after: number | null;
  created_at: string;
}

export interface PerformanceReport {
  id: string;
  project_id: string;
  title: string;
  status: string;
  summary: Record<string, unknown> | null;
  score: number;
  file_url: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface ImageAuditItem {
  id: string;
  audit_id: string;
  url: string;
  original_size: number;
  optimized_size: number | null;
  format: string;
  recommended_format: string | null;
  width: number | null;
  height: number | null;
  has_lazy_loading: boolean;
  has_alt_text: boolean;
  issues: Record<string, unknown> | null;
  savings_bytes: number;
  created_at: string;
}

export interface AssetAuditItem {
  id: string;
  audit_id: string;
  url: string;
  asset_type: string;
  size: number;
  gzipped_size: number | null;
  is_minified: boolean;
  is_render_blocking: boolean;
  is_unused: boolean;
  cache_control: string | null;
  etag: string | null;
  issues: Record<string, unknown> | null;
  created_at: string;
}

export interface PerformanceDashboard {
  overall_score: number;
  performance_score: number;
  accessibility_score: number;
  best_practices_score: number;
  seo_score: number;
  total_audits: number;
  total_issues: number;
  total_recommendations: number;
  resolved_recommendations: number;
  avg_lcp: number;
  avg_cls: number;
  avg_inp: number;
  trend: Array<{ date: string; score: number; performance: number }>;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_PREFIX = `${API_BASE}/api/v1/performance`;

class PerformanceStudioService {
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

  async getDashboard(projectId: string): Promise<PerformanceDashboard> {
    return this.request(`/dashboard?project_id=${projectId}`);
  }

  async listAudits(projectId: string): Promise<PerformanceAudit[]> {
    return this.request(`/audits?project_id=${projectId}`);
  }

  async runAudit(projectId: string, url: string): Promise<PerformanceAudit> {
    return this.request("/audits", { method: "POST", body: JSON.stringify({ project_id: projectId, url }) });
  }

  async getAudit(auditId: string): Promise<PerformanceAudit> {
    return this.request(`/audits/${auditId}`);
  }

  async getVitals(auditId: string): Promise<CoreWebVitals> {
    return this.request(`/audits/${auditId}/vitals`);
  }

  async getImages(auditId: string): Promise<ImageAuditItem[]> {
    return this.request(`/audits/${auditId}/images`);
  }

  async getAssets(auditId: string): Promise<AssetAuditItem[]> {
    return this.request(`/audits/${auditId}/assets`);
  }

  async getRecommendations(auditId: string): Promise<PerformanceRecommendation[]> {
    return this.request(`/audits/${auditId}/recommendations`);
  }

  async resolveRecommendation(recId: string): Promise<{ detail: string }> {
    return this.request(`/recommendations/${recId}/resolve`, { method: "POST" });
  }

  async listHistory(projectId: string): Promise<OptimizationHistoryItem[]> {
    return this.request(`/history?project_id=${projectId}`);
  }

  async listReports(projectId: string): Promise<PerformanceReport[]> {
    return this.request(`/reports?project_id=${projectId}`);
  }

  async createReport(projectId: string, title: string): Promise<PerformanceReport> {
    return this.request("/reports", { method: "POST", body: JSON.stringify({ project_id: projectId, title }) });
  }

  async getReport(reportId: string): Promise<PerformanceReport> {
    return this.request(`/reports/${reportId}`);
  }

  async aiRecommend(url: string, scores: Record<string, number>, metrics: Record<string, unknown>): Promise<{ recommendations: Array<Record<string, unknown>>; provider: string; latency_ms: number }> {
    return this.request("/ai/recommend", { method: "POST", body: JSON.stringify({ url, scores, metrics }) });
  }

  async exportProject(projectId: string, format: string): Promise<{ content: string; format: string; filename: string }> {
    return this.request(`/projects/${projectId}/export?format=${format}`);
  }
}

export const performanceStudioService = new PerformanceStudioService();
