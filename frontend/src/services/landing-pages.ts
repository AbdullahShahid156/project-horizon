import type {
  LandingPage,
  LandingPageOutput,
  LandingPageVersion,
  LandingPagePrompt,
  Template,
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_PREFIX = `${API_BASE}/api/v1`;

class LandingPagesService {
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
      if (err instanceof Error && err.message === "Request failed") throw err;
      throw new Error("Unable to connect to the server. Please ensure the backend is running.");
    }
  }

  async listByProject(projectId: string): Promise<LandingPage[]> {
    return this.request(`/landing-pages/project/${projectId}`);
  }

  async getById(id: string): Promise<LandingPage> {
    return this.request(`/landing-pages/${id}`);
  }

  async generate(prompt: LandingPagePrompt): Promise<{ content: any }> {
    return this.request("/landing-pages/generate", {
      method: "POST",
      body: JSON.stringify(prompt),
    });
  }

  async create(data: {
    project_id: string;
    name: string;
    prompt: LandingPagePrompt;
    content: LandingPageOutput;
  }): Promise<LandingPage> {
    return this.request("/landing-pages/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async update(
    id: string,
    data: { content: LandingPageOutput; change_summary?: string }
  ): Promise<LandingPage> {
    return this.request(`/landing-pages/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async autoSave(id: string, content: LandingPageOutput): Promise<void> {
    await this.request(`/landing-pages/${id}/auto-save`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  }

  async listVersions(id: string): Promise<LandingPageVersion[]> {
    return this.request(`/landing-pages/${id}/versions`);
  }

  async createVersion(
    id: string,
    data: { content: LandingPageOutput; change_summary?: string }
  ): Promise<LandingPageVersion> {
    return this.request(`/landing-pages/${id}/versions`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async restoreVersion(id: string, versionNumber: number): Promise<LandingPage> {
    return this.request(`/landing-pages/${id}/restore`, {
      method: "POST",
      body: JSON.stringify({ version_number: versionNumber }),
    });
  }

  async delete(id: string): Promise<void> {
    await this.request(`/landing-pages/${id}`, {
      method: "DELETE",
    });
  }

  async improveCopy(data: {
    text: string;
    action: string;
    tone?: string;
    context?: string;
  }): Promise<{ original: string; improved: string }> {
    return this.request("/landing-pages/improve-copy", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
}

class TemplatesService {
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
      if (err instanceof Error && err.message === "Request failed") throw err;
      throw new Error("Unable to connect to the server. Please ensure the backend is running.");
    }
  }

  async list(): Promise<Template[]> {
    return this.request("/templates/");
  }

  async getBySlug(slug: string): Promise<Template> {
    return this.request(`/templates/${slug}`);
  }
}

export const landingPagesService = new LandingPagesService();
export const templatesService = new TemplatesService();
