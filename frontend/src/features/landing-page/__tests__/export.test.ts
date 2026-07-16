/// <reference types="vitest" />
import { generateLandingPageHTML, generateLandingPageMarkdown, generateLandingPageJSON } from "../utils/export";
import type { LandingPageOutput } from "@/types";

const mockContent: LandingPageOutput = {
  title: "Test Product",
  hero: {
    headline: "Test Headline",
    subheadline: "Test subheadline",
    primaryCta: "Get Started",
    secondaryCta: "Learn More",
  },
  problem: { headline: "The Problem", points: ["Pain point 1", "Pain point 2"] },
  solution: { headline: "Our Solution", description: "We solve it.", highlights: ["Highlight 1"] },
  benefits: [{ title: "Benefit 1", description: "Description 1" }],
  features: [{ title: "Feature 1", description: "Feature desc 1" }],
  howItWorks: {
    headline: "How It Works",
    steps: [{ number: 1, title: "Step 1", description: "Do this" }],
  },
  testimonials: [{ name: "John", role: "CEO", company: "Acme", quote: "Great product!" }],
  statistics: [{ value: "10K+", label: "Users" }],
  pricing: [
    { name: "Pro", price: "$29", period: "/mo", features: ["Feature A"], cta: "Buy Now", highlighted: true },
  ],
  faq: [{ question: "What is this?", answer: "It is a tool." }],
  finalCta: { headline: "Ready?", subheadline: "Start now.", cta: "Sign Up" },
  contact: { headline: "Contact Us", description: "Get in touch.", email: "hi@test.com" },
  footer: { description: "Footer text", copyright: "© 2025 Test" },
  seo: { title: "Test SEO", description: "Test description", keywords: ["test", "product"] },
  twitterCard: { card: "summary_large_image", title: "Test", description: "Test desc" },
  colors: { primary: "#0066CC", secondary: "#004499", accent: "#00AAFF" },
  typography: "Modern Sans-Serif",
};

describe("Landing Page Export", () => {
  test("generateLandingPageHTML produces valid HTML", () => {
    const html = generateLandingPageHTML(mockContent);
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<html");
    expect(html).toContain("</html>");
    expect(html).toContain("Test Headline");
    expect(html).toContain("Get Started");
    expect(html).toContain("meta");
    expect(html).toContain("og:title");
  });

  test("generateLandingPageHTML escapes HTML entities", () => {
    const content = {
      ...mockContent,
      hero: { ...mockContent.hero, headline: 'Script <script>alert("xss")</script>' },
    };
    const html = generateLandingPageHTML(content);
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  test("generateLandingPageMarkdown produces valid markdown", () => {
    const md = generateLandingPageMarkdown(mockContent);
    expect(md).toContain("# Test Headline");
    expect(md).toContain("## The Problem");
    expect(md).toContain("## Our Solution");
    expect(md).toContain("### Benefit 1");
    expect(md).toContain("**Q: What is this?**");
  });

  test("generateLandingPageJSON produces valid JSON", () => {
    const json = generateLandingPageJSON(mockContent);
    const parsed = JSON.parse(json);
    expect(parsed.title).toBe("Test Product");
    expect(parsed.hero.headline).toBe("Test Headline");
    expect(parsed.pricing).toHaveLength(1);
  });
});

describe("Landing Page Content", () => {
  test("mock content has all required sections", () => {
    expect(mockContent.hero).toBeDefined();
    expect(mockContent.problem).toBeDefined();
    expect(mockContent.solution).toBeDefined();
    expect(mockContent.benefits).toBeDefined();
    expect(mockContent.features).toBeDefined();
    expect(mockContent.howItWorks).toBeDefined();
    expect(mockContent.testimonials).toBeDefined();
    expect(mockContent.statistics).toBeDefined();
    expect(mockContent.pricing).toBeDefined();
    expect(mockContent.faq).toBeDefined();
    expect(mockContent.finalCta).toBeDefined();
    expect(mockContent.contact).toBeDefined();
    expect(mockContent.footer).toBeDefined();
    expect(mockContent.seo).toBeDefined();
  });
});
