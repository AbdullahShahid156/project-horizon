import { test, expect } from "@playwright/test";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

test.describe("Backend API - Health", () => {
  test("GET /docs returns Swagger UI", async ({ request }) => {
    const resp = await request.get(`${API}/docs`);
    expect(resp.status()).toBe(200);
  });

  test("GET /api/v1/openapi.json returns schema", async ({ request }) => {
    const resp = await request.get(`${API}/api/v1/openapi.json`);
    expect(resp.status()).toBe(200);
    const schema = await resp.json();
    expect(schema.openapi).toBeTruthy();
  });

  test("GET /api/v1/health returns healthy", async ({ request }) => {
    const resp = await request.get(`${API}/api/v1/health`);
    expect(resp.status()).toBe(200);
    const data = await resp.json();
    expect(data.status).toBe("healthy");
  });
});

test.describe("Backend API - Users", () => {
  test("GET /api/v1/users/me returns dev user", async ({ request }) => {
    const resp = await request.get(`${API}/api/v1/users/me`);
    expect(resp.status()).toBe(200);
    const data = await resp.json();
    expect(data).toHaveProperty("id");
    expect(data.id).toBe("dev-user");
  });
});

test.describe("Backend API - Brand Studio", () => {
  test("GET /api/v1/brands/ returns paginated list", async ({ request }) => {
    const resp = await request.get(`${API}/api/v1/brands/`);
    expect(resp.status()).toBe(200);
    const data = await resp.json();
    expect(data).toHaveProperty("items");
    expect(Array.isArray(data.items)).toBe(true);
  });

  test("POST /api/v1/brands/ creates brand", async ({ request }) => {
    const resp = await request.post(`${API}/api/v1/brands/`, {
      data: { workspace_id: "dev-workspace", name: "Test Brand " + Date.now(), industry: "Technology" },
    });
    expect(resp.status()).toBe(200);
    const data = await resp.json();
    expect(data).toHaveProperty("id");
    expect(data.name).toContain("Test Brand");
  });
});

test.describe("Backend API - Social Studio", () => {
  test("GET /api/v1/social/posts returns paginated list", async ({ request }) => {
    const resp = await request.get(`${API}/api/v1/social/posts`);
    expect(resp.status()).toBe(200);
    const data = await resp.json();
    expect(data).toHaveProperty("items");
    expect(Array.isArray(data.items)).toBe(true);
    expect(data).toHaveProperty("total");
    expect(data).toHaveProperty("page");
  });

  test("GET /api/v1/social/campaigns returns paginated list", async ({ request }) => {
    const resp = await request.get(`${API}/api/v1/social/campaigns`);
    expect(resp.status()).toBe(200);
    const data = await resp.json();
    expect(data).toHaveProperty("items");
    expect(Array.isArray(data.items)).toBe(true);
  });
});

test.describe("Backend API - Email Studio", () => {
  test("GET /api/v1/email/campaigns returns paginated list", async ({ request }) => {
    const resp = await request.get(`${API}/api/v1/email/campaigns`);
    expect(resp.status()).toBe(200);
    const data = await resp.json();
    expect(data).toHaveProperty("items");
    expect(Array.isArray(data.items)).toBe(true);
    expect(data).toHaveProperty("total");
  });

  test("GET /api/v1/email/templates returns list", async ({ request }) => {
    const resp = await request.get(`${API}/api/v1/email/templates`);
    expect(resp.status()).toBe(200);
    const data = await resp.json();
    expect(Array.isArray(data)).toBe(true);
  });
});

test.describe("Backend API - SEO Studio", () => {
  test("GET /api/v1/seo/domains returns list", async ({ request }) => {
    const resp = await request.get(`${API}/api/v1/seo/domains`);
    expect(resp.status()).toBe(200);
    const data = await resp.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test("GET /api/v1/seo/audits returns list", async ({ request }) => {
    const resp = await request.get(`${API}/api/v1/seo/audits`);
    expect(resp.status()).toBe(200);
    const data = await resp.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test("GET /api/v1/seo/keywords returns list", async ({ request }) => {
    const resp = await request.get(`${API}/api/v1/seo/keywords`);
    expect(resp.status()).toBe(200);
    const data = await resp.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test("GET /api/v1/seo/recommendations returns list", async ({ request }) => {
    const resp = await request.get(`${API}/api/v1/seo/recommendations`);
    expect(resp.status()).toBe(200);
    const data = await resp.json();
    expect(Array.isArray(data)).toBe(true);
  });
});

test.describe("Backend API - Content Studio", () => {
  test("GET /api/v1/content/ returns paginated list", async ({ request }) => {
    const resp = await request.get(`${API}/api/v1/content/`);
    expect(resp.status()).toBe(200);
    const data = await resp.json();
    expect(data).toHaveProperty("items");
    expect(Array.isArray(data.items)).toBe(true);
    expect(data).toHaveProperty("total");
  });

  test("GET /api/v1/content/folders returns list", async ({ request }) => {
    const resp = await request.get(`${API}/api/v1/content/folders`);
    expect(resp.status()).toBe(200);
    const data = await resp.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test("GET /api/v1/content/tags returns list", async ({ request }) => {
    const resp = await request.get(`${API}/api/v1/content/tags`);
    expect(resp.status()).toBe(200);
    const data = await resp.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test("GET /api/v1/content/templates returns list", async ({ request }) => {
    const resp = await request.get(`${API}/api/v1/content/templates`);
    expect(resp.status()).toBe(200);
    const data = await resp.json();
    expect(Array.isArray(data)).toBe(true);
  });
});

test.describe("Backend API - Image Studio", () => {
  test("GET /api/v1/images/ returns paginated list", async ({ request }) => {
    const resp = await request.get(`${API}/api/v1/images/`);
    expect(resp.status()).toBe(200);
    const data = await resp.json();
    expect(data).toHaveProperty("items");
    expect(Array.isArray(data.items)).toBe(true);
    expect(data).toHaveProperty("total");
  });

  test("GET /api/v1/images/folders returns list", async ({ request }) => {
    const resp = await request.get(`${API}/api/v1/images/folders`);
    expect(resp.status()).toBe(200);
    const data = await resp.json();
    expect(Array.isArray(data)).toBe(true);
  });
});

test.describe("Backend API - Performance Studio", () => {
  test("GET /api/v1/performance/audits returns list", async ({ request }) => {
    const resp = await request.get(`${API}/api/v1/performance/audits`);
    expect(resp.status()).toBe(200);
    const data = await resp.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test("GET /api/v1/performance/reports returns list", async ({ request }) => {
    const resp = await request.get(`${API}/api/v1/performance/reports`);
    expect(resp.status()).toBe(200);
    const data = await resp.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test("GET /api/v1/performance/history returns list", async ({ request }) => {
    const resp = await request.get(`${API}/api/v1/performance/history`);
    expect(resp.status()).toBe(200);
    const data = await resp.json();
    expect(Array.isArray(data)).toBe(true);
  });
});

test.describe("Backend API - AI Engine", () => {
  test("GET /api/v1/engine/providers returns list", async ({ request }) => {
    const resp = await request.get(`${API}/api/v1/engine/providers`);
    expect(resp.status()).toBe(200);
    const data = await resp.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test("GET /api/v1/engine/prompts returns list", async ({ request }) => {
    const resp = await request.get(`${API}/api/v1/engine/prompts`);
    expect(resp.status()).toBe(200);
    const data = await resp.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test("GET /api/v1/engine/jobs returns list", async ({ request }) => {
    const resp = await request.get(`${API}/api/v1/engine/jobs`);
    expect(resp.status()).toBe(200);
    const data = await resp.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test("GET /api/v1/engine/usage/daily returns list", async ({ request }) => {
    const resp = await request.get(`${API}/api/v1/engine/usage/daily`);
    expect(resp.status()).toBe(200);
    const data = await resp.json();
    expect(Array.isArray(data)).toBe(true);
  });
});

test.describe("Backend API - Landing Pages", () => {
  test("GET /api/v1/landing-pages/project/{id} returns list", async ({ request }) => {
    const resp = await request.get(`${API}/api/v1/landing-pages/project/dev-project`);
    expect(resp.status()).toBe(200);
    const data = await resp.json();
    expect(Array.isArray(data)).toBe(true);
  });
});

test.describe("Backend API - Projects", () => {
  test("GET /api/v1/projects/ returns list", async ({ request }) => {
    const resp = await request.get(`${API}/api/v1/projects/`);
    expect(resp.status()).toBe(200);
    const data = await resp.json();
    expect(Array.isArray(data)).toBe(true);
  });
});

test.describe("Backend API - Organizations", () => {
  test("GET /api/v1/organizations/ returns list", async ({ request }) => {
    const resp = await request.get(`${API}/api/v1/organizations/`);
    expect(resp.status()).toBe(200);
    const data = await resp.json();
    expect(Array.isArray(data)).toBe(true);
  });
});

test.describe("Backend API - Workspaces", () => {
  test("GET /api/v1/workspaces/org/{org_id} returns list", async ({ request }) => {
    const resp = await request.get(`${API}/api/v1/workspaces/org/dev-org`);
    expect(resp.status()).toBe(200);
    const data = await resp.json();
    expect(Array.isArray(data)).toBe(true);
  });
});
