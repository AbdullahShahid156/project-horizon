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
  async listByProject(projectId: string): Promise<LandingPage[]> {
    const response = await fetch(`${API_PREFIX}/landing-pages/project/${projectId}`);
    if (!response.ok) throw new Error("Failed to fetch landing pages");
    return response.json();
  }

  async getById(id: string): Promise<LandingPage> {
    const response = await fetch(`${API_PREFIX}/landing-pages/${id}`);
    if (!response.ok) throw new Error("Failed to fetch landing page");
    return response.json();
  }

  async generate(prompt: LandingPagePrompt): Promise<{ content: any }> {
    const response = await fetch(`${API_PREFIX}/landing-pages/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prompt),
    });
    if (!response.ok) throw new Error("Failed to generate landing page");
    return response.json();
  }

  async create(data: {
    project_id: string;
    name: string;
    prompt: LandingPagePrompt;
    content: LandingPageOutput;
  }): Promise<LandingPage> {
    const response = await fetch(`${API_PREFIX}/landing-pages/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create landing page");
    return response.json();
  }

  async update(
    id: string,
    data: { content: LandingPageOutput; change_summary?: string }
  ): Promise<LandingPage> {
    const response = await fetch(`${API_PREFIX}/landing-pages/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update landing page");
    return response.json();
  }

  async autoSave(id: string, content: LandingPageOutput): Promise<void> {
    const response = await fetch(`${API_PREFIX}/landing-pages/${id}/auto-save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (!response.ok) throw new Error("Failed to auto-save");
  }

  async listVersions(id: string): Promise<LandingPageVersion[]> {
    const response = await fetch(`${API_PREFIX}/landing-pages/${id}/versions`);
    if (!response.ok) throw new Error("Failed to fetch versions");
    return response.json();
  }

  async createVersion(
    id: string,
    data: { content: LandingPageOutput; change_summary?: string }
  ): Promise<LandingPageVersion> {
    const response = await fetch(`${API_PREFIX}/landing-pages/${id}/versions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create version");
    return response.json();
  }

  async restoreVersion(id: string, versionNumber: number): Promise<LandingPage> {
    const response = await fetch(`${API_PREFIX}/landing-pages/${id}/restore`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ version_number: versionNumber }),
    });
    if (!response.ok) throw new Error("Failed to restore version");
    return response.json();
  }

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_PREFIX}/landing-pages/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete landing page");
  }

  async improveCopy(data: {
    text: string;
    action: string;
    tone?: string;
    context?: string;
  }): Promise<{ original: string; improved: string }> {
    const response = await fetch(`${API_PREFIX}/landing-pages/improve-copy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to improve copy");
    return response.json();
  }
}

class TemplatesService {
  async list(): Promise<Template[]> {
    const response = await fetch(`${API_PREFIX}/templates/`);
    if (!response.ok) throw new Error("Failed to fetch templates");
    return response.json();
  }

  async getBySlug(slug: string): Promise<Template> {
    const response = await fetch(`${API_PREFIX}/templates/${slug}`);
    if (!response.ok) throw new Error("Failed to fetch template");
    return response.json();
  }
}

export const landingPagesService = new LandingPagesService();
export const templatesService = new TemplatesService();
