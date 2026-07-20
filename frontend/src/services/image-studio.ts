export interface ImageItem {
  id: string;
  workspace_id: string;
  folder_id: string | null;
  name: string;
  description: string | null;
  image_type: string;
  prompt: string | null;
  negative_prompt: string | null;
  style: string | null;
  url: string | null;
  thumbnail_url: string | null;
  file_size: number | null;
  width: number | null;
  height: number | null;
  format: string;
  mime_type: string | null;
  metadata: Record<string, unknown> | null;
  generation_params: Record<string, unknown> | null;
  is_favorite: boolean;
  is_deleted: boolean;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface ImageFolder {
  id: string;
  workspace_id: string;
  parent_id: string | null;
  name: string;
  description: string | null;
  color: string | null;
  image_count: number;
  created_at: string;
  updated_at: string;
}

export interface ImageHistoryEntry {
  id: string;
  image_id: string;
  action: string;
  params: Record<string, unknown> | null;
  result_url: string | null;
  provider: string | null;
  latency_ms: number | null;
  created_at: string;
}

export interface ImageStats {
  total: number;
  favorites: number;
  by_type: Record<string, number>;
  by_format: Record<string, number>;
  total_size_bytes: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_PREFIX = `${API_BASE}/api/v1/images`;

class ImageStudioService {
  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    try {
      const response = await fetch(`${API_PREFIX}${path}`, {
        ...options,
        headers: { "Content-Type": "application/json", ...options?.headers },
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

  async listImages(workspaceId: string, params: { search?: string; image_type?: string; folder_id?: string; is_favorite?: boolean; is_deleted?: boolean; sort_by?: string; sort_order?: string; page?: number; page_size?: number } = {}): Promise<{ items: ImageItem[]; total: number; page: number; page_size: number; total_pages: number }> {
    const query = new URLSearchParams({ workspace_id: workspaceId });
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null) query.set(k, String(v)); });
    return this.request(`/?${query}`);
  }

  async getStats(workspaceId: string): Promise<ImageStats> {
    return this.request(`/stats?workspace_id=${workspaceId}`);
  }

  async getImage(imageId: string): Promise<ImageItem> {
    return this.request(`/${imageId}`);
  }

  async updateImage(imageId: string, data: { name?: string; description?: string; tags?: string[]; folder_id?: string }): Promise<ImageItem> {
    return this.request(`/${imageId}`, { method: "PUT", body: JSON.stringify(data) });
  }

  async deleteImage(imageId: string): Promise<{ detail: string }> {
    return this.request(`/${imageId}`, { method: "DELETE" });
  }

  async restoreImage(imageId: string): Promise<ImageItem> {
    return this.request(`/${imageId}/restore`, { method: "POST" });
  }

  async permanentDelete(imageId: string): Promise<{ detail: string }> {
    return this.request(`/${imageId}/permanent-delete`, { method: "POST" });
  }

  async toggleFavorite(imageId: string): Promise<{ is_favorite: boolean }> {
    return this.request(`/${imageId}/favorite`, { method: "POST" });
  }

  async getImageHistory(imageId: string): Promise<ImageHistoryEntry[]> {
    return this.request(`/${imageId}/history`);
  }

  async generateImage(data: { workspace_id: string; prompt: string; negative_prompt?: string; style?: string; width?: number; height?: number; image_type?: string; folder_id?: string; name?: string; num_variations?: number }): Promise<{ images: ImageItem[]; enhanced_prompt: string | null; provider: string; latency_ms: number }> {
    return this.request("/generate", { method: "POST", body: JSON.stringify(data) });
  }

  async enhancePrompt(data: { prompt: string; style?: string; image_type?: string }): Promise<{ enhanced_prompt: string; suggestions: string[]; negative_prompt: string; provider: string; latency_ms: number }> {
    return this.request("/ai/enhance-prompt", { method: "POST", body: JSON.stringify(data) });
  }

  async generateVariations(data: { image_id: string; num_variations?: number; strength?: number }): Promise<{ images: ImageItem[]; provider: string; latency_ms: number }> {
    return this.request("/ai/variations", { method: "POST", body: JSON.stringify(data) });
  }

  async upscaleImage(data: { image_id: string; scale?: number }): Promise<ImageItem> {
    return this.request("/ai/upscale", { method: "POST", body: JSON.stringify(data) });
  }

  async editImage(data: { image_id: string; operation: string; width?: number; height?: number; quality?: number; output_format?: string; crop_x?: number; crop_y?: number; crop_width?: number; crop_height?: number; filter_name?: string }): Promise<{ id: string; url: string | null; width: number | null; height: number | null; file_size: number | null; format: string; operation: string; latency_ms: number }> {
    return this.request("/edit", { method: "POST", body: JSON.stringify(data) });
  }

  async uploadImage(workspaceId: string, file: File, name?: string, imageType?: string, folderId?: string, tags?: string[]): Promise<ImageItem> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("workspace_id", workspaceId);
    if (name) formData.append("name", name);
    if (imageType) formData.append("image_type", imageType);
    if (folderId) formData.append("folder_id", folderId);
    if (tags) formData.append("tags", JSON.stringify(tags));
    try {
      const response = await fetch(`${API_PREFIX}/upload`, { method: "POST", body: formData });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: "Upload failed" }));
        throw new Error(error.detail || "Upload failed");
      }
      return response.json();
    } catch (err) {
      if (err instanceof Error && err.message !== "Upload failed") {
        throw new Error("Unable to connect to the server. Please ensure the backend is running.");
      }
      throw err;
    }
  }

  async listFolders(workspaceId: string): Promise<ImageFolder[]> {
    return this.request(`/folders?workspace_id=${workspaceId}`);
  }

  async createFolder(data: { workspace_id: string; name: string; description?: string; parent_id?: string; color?: string }): Promise<ImageFolder> {
    return this.request("/folders", { method: "POST", body: JSON.stringify(data) });
  }

  async updateFolder(folderId: string, data: { name?: string; description?: string; color?: string }): Promise<ImageFolder> {
    return this.request(`/folders/${folderId}`, { method: "PUT", body: JSON.stringify(data) });
  }

  async deleteFolder(folderId: string): Promise<{ detail: string }> {
    return this.request(`/folders/${folderId}`, { method: "DELETE" });
  }

  async moveImagesToFolder(folderId: string, imageIds: string[]): Promise<{ detail: string }> {
    return this.request(`/folders/${folderId}/images`, { method: "POST", body: JSON.stringify({ image_ids: imageIds }) });
  }
}

export const imageStudioService = new ImageStudioService();
