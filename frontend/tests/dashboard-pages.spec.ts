import { test, expect } from "@playwright/test";

const DASHBOARD_PAGES = [
  { path: "/dashboard", name: "Dashboard" },
  { path: "/organizations", name: "Organizations" },
  { path: "/workspaces", name: "Workspaces" },
  { path: "/projects", name: "Projects" },
  { path: "/profile", name: "Profile" },
  { path: "/settings", name: "Settings" },
  { path: "/notifications", name: "Notifications" },
  { path: "/usage", name: "Usage" },
  { path: "/search", name: "Search" },
];

const STUDIO_PAGES = [
  { path: "/brand-studio", name: "Brand Studio" },
  { path: "/content-studio", name: "Content Studio" },
  { path: "/social-studio", name: "Social Studio" },
  { path: "/email-studio", name: "Email Studio" },
  { path: "/seo-studio", name: "SEO Studio" },
  { path: "/image-studio", name: "Image Studio" },
  { path: "/performance-studio", name: "Performance Studio" },
  { path: "/landing-pages", name: "Landing Pages" },
];

const ALL_PAGES = [...DASHBOARD_PAGES, ...STUDIO_PAGES];

test.describe("Dashboard Pages - Render", () => {
  for (const page of ALL_PAGES) {
    test(`${page.name} (${page.path}) loads without error`, async ({ page: p }) => {
      const errors: string[] = [];
      p.on("pageerror", (err) => errors.push(err.message));
      p.on("console", (msg) => {
        if (msg.type() === "error") errors.push(msg.text());
      });

      const resp = await p.goto(page.path, { waitUntil: "networkidle", timeout: 30000 });
      expect(resp?.status()).toBeLessThan(500);

      // Should not show full-screen error
      await expect(p.locator("body")).not.toContainText("Internal Server Error");
      await expect(p.locator("body")).not.toContainText("Application error");

      // Fatal JS errors should not occur
      const fatalErrors = errors.filter(
        (e) => !e.includes("Failed to fetch") && !e.includes("NetworkError") && !e.includes("AbortError")
          && !e.includes("Hydration") && !e.includes("script tag") && !e.includes("server rendered text")
      );
      expect(fatalErrors).toEqual([]);
    });
  }
});

test.describe("Dashboard Pages - Navigation Sidebar", () => {
  test("sidebar contains all studio links", async ({ page }) => {
    await page.goto("/dashboard", { waitUntil: "networkidle", timeout: 30000 });

    const sidebarLinks = page.locator("nav a, aside a");
    const linkCount = await sidebarLinks.count();
    expect(linkCount).toBeGreaterThan(5);

    const linkTexts = await sidebarLinks.allTextContents();
    const combined = linkTexts.join(" ").toLowerCase();
    expect(combined).toContain("brand");
    expect(combined).toContain("content");
    expect(combined).toContain("social");
    expect(combined).toContain("email");
  });

  test("clicking sidebar links navigates without crash", async ({ page }) => {
    await page.goto("/dashboard", { waitUntil: "networkidle", timeout: 30000 });

    const sidebarLinks = page.locator("nav a[href]");
    const count = await sidebarLinks.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      const href = await sidebarLinks.nth(i).getAttribute("href");
      if (href && href.startsWith("/")) {
        await sidebarLinks.nth(i).click();
        await page.waitForLoadState("networkidle", { timeout: 15000 });
        await expect(page.locator("body")).not.toContainText("Application error");
      }
    }
  });
});
