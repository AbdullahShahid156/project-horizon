import { test, expect } from "@playwright/test";

test.describe("Auth Pages", () => {
  test("login page renders", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/login", { waitUntil: "networkidle", timeout: 30000 });
    await expect(page.locator("body")).not.toContainText("Application error");

    const fatalErrors = errors.filter(
      (e) => !e.includes("Failed to fetch") && !e.includes("NetworkError")
    );
    expect(fatalErrors).toEqual([]);
  });

  test("signup page renders", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/signup", { waitUntil: "networkidle", timeout: 30000 });
    await expect(page.locator("body")).not.toContainText("Application error");

    const fatalErrors = errors.filter(
      (e) => !e.includes("Failed to fetch") && !e.includes("NetworkError")
    );
    expect(fatalErrors).toEqual([]);
  });
});

test.describe("Studio Create Pages", () => {
  const createPages = [
    { path: "/brand-studio/create", name: "Brand Create" },
    { path: "/content-studio/create", name: "Content Create" },
    { path: "/social-studio/create", name: "Social Create" },
    { path: "/email-studio/create", name: "Email Create" },
    { path: "/landing-pages/create", name: "Landing Page Create" },
    { path: "/projects/new", name: "Project Create" },
  ];

  for (const p of createPages) {
    test(`${p.name} (${p.path}) renders without crash`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (err) => errors.push(err.message));

      const resp = await page.goto(p.path, { waitUntil: "networkidle", timeout: 30000 });
      expect(resp?.status()).toBeLessThan(500);
      await expect(page.locator("body")).not.toContainText("Application error");

      const fatalErrors = errors.filter(
        (e) => !e.includes("Failed to fetch") && !e.includes("NetworkError") && !e.includes("AbortError")
          && !e.includes("Hydration") && !e.includes("script tag") && !e.includes("server rendered")
      );
      expect(fatalErrors).toEqual([]);
    });
  }
});

test.describe("Studio Sub-Pages", () => {
  const subPages = [
    { path: "/social-studio/analytics", name: "Social Analytics" },
    { path: "/image-studio/folders", name: "Image Folders" },
    { path: "/image-studio/generate", name: "Image Generate" },
    { path: "/content-studio/templates", name: "Content Templates" },
    { path: "/email-studio/templates", name: "Email Templates" },
    { path: "/landing-pages/templates", name: "Landing Page Templates" },
    { path: "/settings/general", name: "Settings General" },
    { path: "/settings/security", name: "Settings Security" },
    { path: "/settings/notifications", name: "Settings Notifications" },
    { path: "/settings/billing", name: "Settings Billing" },
    { path: "/settings/appearance", name: "Settings Appearance" },
    { path: "/settings/api-keys", name: "Settings API Keys" },
  ];

  for (const p of subPages) {
    test(`${p.name} (${p.path}) renders without crash`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (err) => errors.push(err.message));

      const resp = await page.goto(p.path, { waitUntil: "networkidle", timeout: 30000 });
      expect(resp?.status()).toBeLessThan(500);
      await expect(page.locator("body")).not.toContainText("Application error");

      const fatalErrors = errors.filter(
        (e) => !e.includes("Failed to fetch") && !e.includes("NetworkError") && !e.includes("AbortError")
          && !e.includes("Hydration") && !e.includes("script tag") && !e.includes("server rendered")
      );
      expect(fatalErrors).toEqual([]);
    });
  }
});
