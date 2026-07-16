export interface Brand {
  id: string;
  workspace_id: string;
  name: string;
  slug: string;
  tagline: string | null;
  industry: string | null;
  description: string | null;
  target_audience: string | null;
  brand_personality: string | null;
  tone_of_voice: string | null;
  mission: string | null;
  vision: string | null;
  values: string[] | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  typography: string | null;
  logo_style: string | null;
  icon_style: string | null;
  brand_summary: string | null;
  tagline_suggestions: string[] | null;
  brand_voice: string | null;
  elevator_pitch: string | null;
  usp: string | null;
  color_palette: Record<string, string> | null;
  font_pairings: Array<{ heading: string; body: string }> | null;
  icon_suggestions: string[] | null;
  brand_keywords: string[] | null;
  brand_guidelines: string | null;
  current_version: number;
  is_favorite: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface BrandVersion {
  id: string;
  brand_id: string;
  version_number: number;
  data: Record<string, unknown>;
  change_summary: string | null;
  created_at: string;
}

export interface BrandAsset {
  id: string;
  brand_id: string;
  asset_type: string;
  name: string;
  url: string | null;
  data: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface BrandStats {
  total: number;
  favorites: number;
  archived: number;
  by_industry: Record<string, number>;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_PREFIX = `${API_BASE}/api/v1/brands`;

class BrandStudioService {
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

  async listBrands(workspaceId: string, params: { search?: string; is_archived?: boolean; is_favorite?: boolean; industry?: string; sort_by?: string; sort_order?: string; page?: number; page_size?: number } = {}): Promise<{ items: Brand[]; total: number; page: number; page_size: number; total_pages: number }> {
    const query = new URLSearchParams({ workspace_id: workspaceId });
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null) query.set(k, String(v)); });
    return this.request(`/?${query}`);
  }

  async getStats(workspaceId: string): Promise<BrandStats> {
    return this.request(`/stats?workspace_id=${workspaceId}`);
  }

  async getBrand(brandId: string): Promise<Brand> {
    return this.request(`/${brandId}`);
  }

  async createBrand(data: { workspace_id: string; name: string; tagline?: string; industry?: string; description?: string; target_audience?: string; brand_personality?: string; tone_of_voice?: string; mission?: string; vision?: string; values?: string[]; primary_color?: string; secondary_color?: string; accent_color?: string; typography?: string; logo_style?: string; icon_style?: string }): Promise<Brand> {
    return this.request("/", { method: "POST", body: JSON.stringify(data) });
  }

  async updateBrand(brandId: string, data: { name?: string; tagline?: string; industry?: string; description?: string; target_audience?: string; brand_personality?: string; tone_of_voice?: string; mission?: string; vision?: string; values?: string[]; primary_color?: string; secondary_color?: string; accent_color?: string; typography?: string; logo_style?: string; icon_style?: string; change_summary?: string }): Promise<Brand> {
    return this.request(`/${brandId}`, { method: "PUT", body: JSON.stringify(data) });
  }

  async deleteBrand(brandId: string): Promise<{ detail: string }> {
    return this.request(`/${brandId}`, { method: "DELETE" });
  }

  async restoreBrand(brandId: string): Promise<Brand> {
    return this.request(`/${brandId}/restore`, { method: "POST" });
  }

  async duplicateBrand(brandId: string): Promise<Brand> {
    return this.request(`/${brandId}/duplicate`, { method: "POST" });
  }

  async toggleFavorite(brandId: string): Promise<{ is_favorite: boolean }> {
    return this.request(`/${brandId}/favorite`, { method: "POST" });
  }

  async toggleArchive(brandId: string): Promise<{ is_archived: boolean }> {
    return this.request(`/${brandId}/archive`, { method: "POST" });
  }

  async listVersions(brandId: string): Promise<BrandVersion[]> {
    return this.request(`/${brandId}/versions`);
  }

  async restoreVersion(brandId: string, versionId: string): Promise<Brand> {
    return this.request(`/${brandId}/versions/${versionId}/restore`, { method: "POST" });
  }

  async generateBrand(data: { workspace_id: string; name: string; industry?: string; target_audience?: string; brand_personality?: string; tone_of_voice?: string; description?: string }): Promise<{ brand_id: string; name: string; tagline: string; brand_summary: string; tagline_suggestions: string[]; mission: string; vision: string; values: string[]; brand_voice: string; elevator_pitch: string; usp: string; color_palette: Record<string, string>; font_pairings: Array<{ heading: string; body: string }>; icon_suggestions: string[]; brand_keywords: string[]; brand_guidelines: string; primary_color: string; secondary_color: string; accent_color: string; provider: string; latency_ms: number }> {
    return this.request("/generate", { method: "POST", body: JSON.stringify(data) });
  }

  async optimizeBrandField(data: { brand_id: string; action: string; field?: string; context?: string }): Promise<{ field: string; original: string; optimized: string; action: string; provider: string; latency_ms: number }> {
    return this.request("/ai/optimize", { method: "POST", body: JSON.stringify(data) });
  }

  async listAssets(brandId: string): Promise<BrandAsset[]> {
    return this.request(`/assets/${brandId}`);
  }

  async createAsset(brandId: string, data: { asset_type: string; name: string; url?: string; data?: Record<string, unknown> }): Promise<BrandAsset> {
    return this.request(`/assets/${brandId}`, { method: "POST", body: JSON.stringify(data) });
  }
}

export const brandStudioService = new BrandStudioService();
