const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API = `${API_BASE}/api/v1/analytics`;

export interface AnalyticsOverview {
  total_visitors: number;
  visitors_change: number;
  total_pageviews: number;
  pageviews_change: number;
  bounce_rate: number;
  bounce_rate_change: number;
  avg_session_duration: number;
  session_change: number;
  total_sessions: number;
  sessions_change: number;
  new_users: number;
  returning_users: number;
}

export interface TimeseriesPoint {
  date: string;
  visitors: number;
  pageviews: number;
  bounce_rate: number;
  avg_session_duration: number;
}

export interface PageMetric {
  path: string;
  title: string;
  pageviews: number;
  unique_visitors: number;
  bounce_rate: number;
  avg_time: number;
}

export interface TrafficSource {
  name: string;
  sessions: number;
  percentage: number;
  color: string;
}

export interface DeviceInfo {
  name: string;
  sessions: number;
  percentage: number;
}

export interface CountryInfo {
  name: string;
  code: string;
  sessions: number;
  percentage: number;
}

export interface RealtimeData {
  active_users: number;
  pages_per_session: number;
  top_page: string;
}

class AnalyticsService {
  private async request<T>(path: string): Promise<T> {
    const res = await fetch(`${API}${path}`);
    if (!res.ok) throw new Error(`Analytics request failed: ${res.status}`);
    return res.json();
  }

  async getDashboard(period = "30d", workspaceId = "ws-default") {
    return this.request<{
      overview: AnalyticsOverview;
      timeseries: TimeseriesPoint[];
      realtime: RealtimeData;
    }>(`/dashboard?workspace_id=${workspaceId}&period=${period}`);
  }

  async getPages(params: {
    sort_by?: string;
    sort_order?: string;
    page?: number;
    page_size?: number;
    workspace_id?: string;
  } = {}) {
    const q = new URLSearchParams({ workspace_id: params.workspace_id || "ws-default" });
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && k !== "workspace_id") q.set(k, String(v));
    });
    return this.request<{
      items: PageMetric[];
      total: number;
      page: number;
      page_size: number;
    }>(`/pages?${q}`);
  }

  async getSources(workspaceId = "ws-default") {
    return this.request<{ sources: TrafficSource[] }>(
      `/sources?workspace_id=${workspaceId}`
    );
  }

  async getDevices(workspaceId = "ws-default") {
    return this.request<{ devices: DeviceInfo[]; browsers: DeviceInfo[] }>(
      `/devices?workspace_id=${workspaceId}`
    );
  }

  async getCountries(workspaceId = "ws-default") {
    return this.request<{ countries: CountryInfo[] }>(
      `/countries?workspace_id=${workspaceId}`
    );
  }

  async getRealtime(workspaceId = "ws-default") {
    return this.request<RealtimeData>(`/realtime?workspace_id=${workspaceId}`);
  }
}

export const analyticsService = new AnalyticsService();
