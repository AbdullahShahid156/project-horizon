export interface ProviderField {
  key: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  description?: string;
}

export interface Provider {
  id: string;
  name: string;
  category: string;
  description: string;
  icon_url?: string;
  color: string;
  fields: ProviderField[];
  is_available: boolean;
}

export interface Integration {
  id: string;
  workspace_id: string;
  provider: string;
  name: string;
  status: string;
  health_status: string;
  config?: Record<string, string | number | boolean>;
  auto_sync: boolean;
  sync_interval_minutes: number;
  last_sync_at?: string;
  last_sync_status?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface IntegrationStats {
  total: number;
  connected: number;
  failed: number;
  syncing: number;
  by_category: Record<string, number>;
  by_provider: Record<string, number>;
  recent_syncs: number;
  failed_syncs: number;
}

export interface IntegrationLog {
  id: string;
  integration_id: string;
  action: string;
  status: string;
  message?: string;
  details?: Record<string, string | number | boolean>;
  duration_ms?: number;
  created_at: string;
}

export interface SyncJob {
  id: string;
  integration_id: string;
  sync_type: string;
  status: string;
  items_synced: number;
  items_failed: number;
  error_message?: string;
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
}

export interface SyncedItem {
  id: string;
  integration_id: string;
  external_id: string;
  item_type: string;
  title: string;
  summary?: string;
  url?: string;
  metadata?: Record<string, string | number | boolean>;
  last_synced_at: string;
  created_at: string;
}

export interface PushResult {
  success: boolean;
  external_id?: string;
  url?: string;
  message: string;
  provider: string;
  latency_ms: number;
}

export interface ProviderCategory {
  name: string;
  count: number;
  providers: string[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_PREFIX = `${API_BASE}/api/v1/integrations`;

class IntegrationsService {
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

  async listProviders(category?: string): Promise<Provider[]> {
    const query = category ? `?category=${category}` : "";
    return this.request(`/providers${query}`);
  }

  async listProviderCategories(): Promise<ProviderCategory[]> {
    return this.request("/providers/categories");
  }

  async getStats(workspaceId: string): Promise<IntegrationStats> {
    return this.request(`/stats?workspace_id=${workspaceId}`);
  }

  async listIntegrations(
    workspaceId: string,
    params: {
      provider?: string;
      category?: string;
      status?: string;
      search?: string;
      sort_by?: string;
      sort_order?: string;
      page?: number;
      page_size?: number;
    } = {}
  ): Promise<{
    items: Integration[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }> {
    const query = new URLSearchParams({ workspace_id: workspaceId });
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) query.set(k, String(v));
    });
    return this.request(`/?${query}`);
  }

  async getIntegration(integrationId: string): Promise<Integration> {
    return this.request(`/${integrationId}`);
  }

  async connect(data: {
    workspace_id: string;
    provider: string;
    name: string;
    credentials: Record<string, string>;
    config?: Record<string, string | number | boolean>;
  }): Promise<Integration> {
    return this.request("/", { method: "POST", body: JSON.stringify(data) });
  }

  async updateIntegration(
    integrationId: string,
    data: {
      name?: string;
      credentials?: Record<string, string>;
      config?: Record<string, string | number | boolean>;
      auto_sync?: boolean;
      sync_interval_minutes?: number;
    }
  ): Promise<Integration> {
    return this.request(`/${integrationId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async disconnectIntegration(integrationId: string): Promise<{ detail: string }> {
    return this.request(`/${integrationId}`, { method: "DELETE" });
  }

  async sync(data: {
    integration_id: string;
    sync_type?: string;
    force?: boolean;
  }): Promise<SyncJob> {
    return this.request("/sync", { method: "POST", body: JSON.stringify(data) });
  }

  async reconnect(integrationId: string): Promise<Integration> {
    return this.request(`/${integrationId}/reconnect`, { method: "POST" });
  }

  async checkHealth(
    integrationId: string
  ): Promise<{ status: string; message?: string; latency_ms?: number }> {
    return this.request(`/${integrationId}/health`);
  }

  async getLogs(
    integrationId: string,
    page = 1,
    pageSize = 20
  ): Promise<IntegrationLog[]> {
    return this.request(
      `/${integrationId}/logs?page=${page}&page_size=${pageSize}`
    );
  }

  async getSyncJobs(
    integrationId: string,
    page = 1,
    pageSize = 20
  ): Promise<SyncJob[]> {
    return this.request(
      `/${integrationId}/sync-jobs?page=${page}&page_size=${pageSize}`
    );
  }

  async pullData(
    integrationId: string,
    itemType?: string
  ): Promise<{
    items: SyncedItem[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }> {
    const query = new URLSearchParams({ integration_id: integrationId });
    if (itemType) query.set("item_type", itemType);
    return this.request(`/pull?${query}`);
  }

  async listSyncedItems(
    integrationId: string,
    params: {
      item_type?: string;
      search?: string;
      page?: number;
      page_size?: number;
    } = {}
  ): Promise<{
    items: SyncedItem[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }> {
    const query = new URLSearchParams({ integration_id: integrationId });
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) query.set(k, String(v));
    });
    return this.request(`/items?${query}`);
  }

  async pushContent(data: {
    integration_id: string;
    item_type: string;
    title: string;
    content: string;
    metadata?: Record<string, string | number | boolean>;
  }): Promise<PushResult> {
    return this.request("/push", { method: "POST", body: JSON.stringify(data) });
  }
}

export const integrationsService = new IntegrationsService();

export const INTEGRATION_CATEGORIES = [
  { id: "cms", label: "CMS", icon: "Globe" },
  { id: "ecommerce", label: "E-Commerce", icon: "ShoppingCart" },
  { id: "marketing", label: "Email Marketing", icon: "Send" },
  { id: "productivity", label: "Productivity", icon: "MessageSquare" },
  { id: "analytics", label: "Analytics", icon: "BarChart3" },
] as const;

export const STATUS_COLORS: Record<string, string> = {
  connected: "bg-green-100 text-green-800 border-green-200",
  failed: "bg-red-100 text-red-800 border-red-200",
  syncing: "bg-blue-100 text-blue-800 border-blue-200",
  disconnected: "bg-gray-100 text-gray-800 border-gray-200",
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
};

export const HEALTH_COLORS: Record<string, string> = {
  healthy: "text-green-600",
  error: "text-red-600",
  unknown: "text-gray-500",
  degraded: "text-yellow-600",
};
