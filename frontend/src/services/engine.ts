const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_PREFIX = `${API_BASE}/api/v1/engine`;

export interface UsageSummary {
  total_generations: number;
  total_tokens: number;
  total_cost: number;
  successes: number;
  failures: number;
  success_rate: number;
  cached: number;
  cache_rate: number;
  avg_latency_ms: number;
  providers: Record<string, number>;
  models: Record<string, number>;
  operations: Record<string, number>;
}

export interface DailyUsage {
  date: string;
  generations: number;
  tokens: number;
  cost: number;
  successes: number;
  failures: number;
  avg_latency_ms: number;
}

export interface UsageHistoryItem {
  id: string;
  provider: string;
  model: string;
  operation: string;
  total_tokens: number;
  estimated_cost: number;
  latency_ms: number;
  success: boolean;
  error: string | null;
  cached: boolean;
  created_at: number;
}

export interface CacheStats {
  size: number;
  max_size: number;
  hits: number;
  misses: number;
  hit_rate: number;
}

export interface ProviderInfo {
  name: string;
  available: boolean;
  is_active: boolean;
}

export interface PromptTemplate {
  name: string;
  category: string;
  version: number;
  description: string;
  variables: string[];
}

export interface AIJob {
  id: string;
  type: string;
  status: string;
  progress: number;
  result: Record<string, unknown> | null;
  error: string | null;
  created_at: number;
  started_at: number | null;
  completed_at: number | null;
}

class EngineService {
  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    let response: Response;
    try {
      response = await fetch(`${API_PREFIX}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
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

  async getUsageSummary(days: number = 30): Promise<UsageSummary> {
    return this.request(`/usage?days=${days}`);
  }

  async getDailyUsage(days: number = 30): Promise<DailyUsage[]> {
    return this.request(`/usage/daily?days=${days}`);
  }

  async getUsageHistory(limit: number = 50): Promise<UsageHistoryItem[]> {
    return this.request(`/usage/history?limit=${limit}`);
  }

  async getCacheStats(): Promise<CacheStats> {
    return this.request("/cache");
  }

  async clearCache(): Promise<void> {
    await this.request("/cache/clear", { method: "POST" });
  }

  async getProviders(): Promise<ProviderInfo[]> {
    return this.request("/providers");
  }

  async getPrompts(category?: string): Promise<PromptTemplate[]> {
    const query = category ? `?category=${category}` : "";
    return this.request(`/prompts${query}`);
  }

  async getPromptCategories(): Promise<{ categories: string[] }> {
    return this.request("/prompts/categories");
  }

  async submitJob(type: string, params: Record<string, unknown>): Promise<AIJob> {
    return this.request("/jobs", {
      method: "POST",
      body: JSON.stringify({ type, params }),
    });
  }

  async getJob(jobId: string): Promise<AIJob> {
    return this.request(`/jobs/${jobId}`);
  }

  async listJobs(status?: string, limit: number = 50): Promise<AIJob[]> {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    params.set("limit", String(limit));
    return this.request(`/jobs?${params}`);
  }

  async cancelJob(jobId: string): Promise<void> {
    await this.request(`/jobs/${jobId}/cancel`, { method: "POST" });
  }

  async getEngineStatus(): Promise<{
    providers: ProviderInfo[];
    active_provider: string;
    cache_stats: CacheStats;
    queue_size: number;
    total_jobs: number;
  }> {
    return this.request("/status");
  }
}

export const engineService = new EngineService();
