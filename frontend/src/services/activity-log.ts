const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API = `${API_BASE}/api/v1`;

export interface ActivityLogEntry {
  id: string;
  userId: string;
  organizationId: string;
  action: string;
  entityType: string;
  entityId: string;
  entityName: string;
  description: string;
  icon: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface ActivityStats {
  total_actions: number;
  today_actions: number;
  by_entity: Record<string, number>;
  unique_users: number;
}

class ActivityLogService {
  private async request<T>(path: string): Promise<T> {
    const res = await fetch(`${API}${path}`);
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return res.json();
  }

  async getLogs(params: {
    organization_id?: string;
    action?: string;
    entity_type?: string;
    page?: number;
    page_size?: number;
  } = {}) {
    const q = new URLSearchParams({ organization_id: params.organization_id || "org-default" });
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && k !== "organization_id") q.set(k, String(v));
    });
    return this.request<{
      items: ActivityLogEntry[];
      total: number;
      page: number;
      page_size: number;
      total_pages: number;
    }>(`/activity?${q}`);
  }

  async getStats(orgId = "org-default") {
    return this.request<ActivityStats>(`/activity/stats?organization_id=${orgId}`);
  }

  async getActions(orgId = "org-default") {
    return this.request<Array<{ action: string; description: string; count: number }>>(
      `/activity/actions?organization_id=${orgId}`
    );
  }
}

export const activityLogService = new ActivityLogService();
