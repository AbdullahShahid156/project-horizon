import type { LandingPageOutput } from "@/types";

export function generateLandingPageHTML(content: LandingPageOutput): string {
  const c = content;
  const colors = c.colors || { primary: "#0066CC", secondary: "#004499", accent: "#00AAFF" };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(c.seo?.title || c.title || "Landing Page")}</title>
  <meta name="description" content="${escapeHtml(c.seo?.description || "")}">
  <meta name="keywords" content="${escapeHtml(c.seo?.keywords?.join(", ") || "")}">
  ${c.seo?.ogTitle ? `<meta property="og:title" content="${escapeHtml(c.seo.ogTitle)}">` : ""}
  ${c.seo?.ogDescription ? `<meta property="og:description" content="${escapeHtml(c.seo.ogDescription)}">` : ""}
  ${c.seo?.ogImage ? `<meta property="og:image" content="${escapeHtml(c.seo.ogImage)}">` : ""}
  <meta name="twitter:card" content="summary_large_image">
  ${c.seo?.ogTitle ? `<meta name="twitter:title" content="${escapeHtml(c.seo.ogTitle)}">` : ""}
  ${c.seo?.ogDescription ? `<meta name="twitter:description" content="${escapeHtml(c.seo.ogDescription)}">` : ""}
  ${c.seo?.schemaOrg ? `<script type="application/ld+json">${JSON.stringify(c.seo.schemaOrg)}</script>` : ""}
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; color: #1a1a2e; line-height: 1.6; }
    .container { max-width: 1140px; margin: 0 auto; padding: 0 24px; }
    .section { padding: 80px 0; }
    .section-alt { background: #f8fafc; }
    .section-dark { background: ${colors.primary}; color: white; }
    .text-center { text-align: center; }
    h1 { font-size: 3rem; font-weight: 800; line-height: 1.1; letter-spacing: -0.02em; }
    h2 { font-size: 2rem; font-weight: 700; margin-bottom: 1rem; }
    h3 { font-size: 1.25rem; font-weight: 600; }
    p { color: #64748b; }
    .hero { padding: 120px 0 80px; background: linear-gradient(135deg, ${colors.primary}08, ${colors.accent}06); }
    .hero h1 { color: ${colors.primary}; margin-bottom: 16px; }
    .hero p { font-size: 1.25rem; max-width: 640px; margin: 0 auto 32px; }
    .btn { display: inline-block; padding: 14px 32px; border-radius: 8px; font-size: 1rem; font-weight: 600; text-decoration: none; cursor: pointer; border: none; transition: transform 0.2s, box-shadow 0.2s; }
    .btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    .btn-primary { background: ${colors.primary}; color: white; }
    .btn-secondary { background: transparent; color: ${colors.primary}; border: 2px solid ${colors.primary}; }
    .btn-accent { background: ${colors.accent}; color: white; }
    .btn-white { background: white; color: ${colors.primary}; }
    .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 32px; }
    .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; }
    .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
    .card { padding: 32px; border-radius: 12px; background: white; border: 1px solid #e2e8f0; transition: box-shadow 0.2s; }
    .card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; background: ${colors.primary}10; color: ${colors.primary}; }
    .stat-value { font-size: 3rem; font-weight: 800; color: ${colors.primary}; }
    .stat-label { font-size: 0.875rem; color: #64748b; margin-top: 4px; }
    .pricing-card { padding: 40px; border-radius: 16px; border: 2px solid #e2e8f0; text-align: center; position: relative; }
    .pricing-card.featured { border-color: ${colors.primary}; transform: scale(1.05); box-shadow: 0 12px 40px rgba(0,0,0,0.1); }
    .pricing-card .price { font-size: 3rem; font-weight: 800; color: ${colors.primary}; }
    .pricing-card .period { color: #94a3b8; }
    .pricing-card ul { list-style: none; padding: 24px 0; text-align: left; }
    .pricing-card li { padding: 8px 0; font-size: 0.9rem; display: flex; align-items: center; gap: 8px; }
    .pricing-card li::before { content: "✓"; color: ${colors.primary}; font-weight: 700; }
    .faq-item { padding: 24px; border-bottom: 1px solid #e2e8f0; }
    .faq-item:last-child { border-bottom: none; }
    .faq-item h3 { margin-bottom: 8px; }
    .cta-section { padding: 100px 0; background: linear-gradient(135deg, ${colors.primary}, ${colors.accent}); color: white; text-align: center; }
    .cta-section h2 { color: white; font-size: 2.5rem; }
    .cta-section p { color: rgba(255,255,255,0.9); margin-bottom: 32px; max-width: 500px; margin-left: auto; margin-right: auto; }
    .footer { padding: 48px 0 24px; background: #0f172a; color: #94a3b8; }
    .footer-bottom { padding-top: 24px; margin-top: 24px; border-top: 1px solid #1e293b; text-align: center; font-size: 0.875rem; }
    .contact-info { display: flex; gap: 24px; justify-content: center; flex-wrap: wrap; }
    .contact-info span { display: flex; align-items: center; gap: 8px; }
    .step-number { width: 48px; height: 48px; border-radius: 50%; background: ${colors.accent}; color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.25rem; margin: 0 auto 16px; }
    .trust-badges { display: flex; gap: 32px; justify-content: center; margin-top: 32px; color: #94a3b8; font-size: 0.875rem; }
    @media (max-width: 768px) {
      h1 { font-size: 2rem; }
      h2 { font-size: 1.5rem; }
      .grid-2, .grid-3, .grid-4 { grid-template-columns: 1fr; }
      .pricing-card.featured { transform: none; }
      .hero { padding: 80px 0 60px; }
    }
  </style>
</head>
<body>
  ${c.hero ? `
  <section class="hero text-center">
    <div class="container">
      <h1>${escapeHtml(c.hero.headline)}</h1>
      <p>${escapeHtml(c.hero.subheadline)}</p>
      <div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap;">
        <a href="#cta" class="btn btn-primary">${escapeHtml(c.hero.primaryCta)}</a>
        ${c.hero.secondaryCta ? `<a href="#features" class="btn btn-secondary">${escapeHtml(c.hero.secondaryCta)}</a>` : ""}
      </div>
      ${c.hero.trustBadges && c.hero.trustBadges.length > 0 ? `
      <div class="trust-badges">
        ${c.hero.trustBadges.map((b) => `<span>✓ ${escapeHtml(b)}</span>`).join("\n        ")}
      </div>` : ""}
    </div>
  </section>` : ""}

  ${c.problem && c.problem.points && c.problem.points.length > 0 ? `
  <section class="section section-alt">
    <div class="container text-center">
      <h2>${escapeHtml(c.problem.headline)}</h2>
      <div class="grid-3" style="margin-top:48px;">
        ${c.problem.points.map((p) => `<div class="card"><p style="font-size:1.1rem;">${escapeHtml(p)}</p></div>`).join("\n        ")}
      </div>
    </div>
  </section>` : ""}

  ${c.solution ? `
  <section class="section">
    <div class="container text-center">
      <h2>${escapeHtml(c.solution.headline)}</h2>
      ${c.solution.description ? `<p style="font-size:1.1rem;max-width:700px;margin:0 auto 48px;">${escapeHtml(c.solution.description)}</p>` : ""}
      ${c.solution.highlights && c.solution.highlights.length > 0 ? `
      <div class="grid-3">
        ${c.solution.highlights.map((h) => `<div class="card"><p>${escapeHtml(h)}</p></div>`).join("\n        ")}
      </div>` : ""}
    </div>
  </section>` : ""}

  ${c.benefits && c.benefits.length > 0 ? `
  <section class="section section-alt">
    <div class="container text-center">
      <h2>Benefits</h2>
      <div class="grid-${Math.min(c.benefits.length, 4)}" style="margin-top:48px;">
        ${c.benefits.map((b, i) => `
        <div class="card text-center">
          <div class="step-number" style="background:${colors.primary};">${b.icon || (i + 1)}</div>
          <h3>${escapeHtml(b.title)}</h3>
          <p style="margin-top:8px;">${escapeHtml(b.description)}</p>
        </div>`).join("\n        ")}
      </div>
    </div>
  </section>` : ""}

  ${c.features && c.features.length > 0 ? `
  <section class="section" id="features">
    <div class="container text-center">
      <h2>Features</h2>
      <div class="grid-${Math.min(c.features.length, 3)}" style="margin-top:48px;">
        ${c.features.map((f) => `
        <div class="card text-center">
          <h3>${escapeHtml(f.title)}</h3>
          <p style="margin-top:8px;">${escapeHtml(f.description)}</p>
        </div>`).join("\n        ")}
      </div>
    </div>
  </section>` : ""}

  ${c.howItWorks && c.howItWorks.steps && c.howItWorks.steps.length > 0 ? `
  <section class="section section-alt">
    <div class="container text-center">
      <h2>${escapeHtml(c.howItWorks.headline)}</h2>
      <div class="grid-${Math.min(c.howItWorks.steps.length, 4)}" style="margin-top:48px;">
        ${c.howItWorks.steps.map((s) => `
        <div>
          <div class="step-number">${s.number}</div>
          <h3>${escapeHtml(s.title)}</h3>
          <p style="margin-top:8px;">${escapeHtml(s.description)}</p>
        </div>`).join("\n        ")}
      </div>
    </div>
  </section>` : ""}

  ${c.statistics && c.statistics.length > 0 ? `
  <section class="section section-dark">
    <div class="container">
      <div class="grid-${Math.min(c.statistics.length, 4)} text-center">
        ${c.statistics.map((s) => `
        <div>
          <div class="stat-value" style="color:white;">${escapeHtml(s.value)}</div>
          <div class="stat-label" style="color:rgba(255,255,255,0.8);">${escapeHtml(s.label)}</div>
        </div>`).join("\n        ")}
      </div>
    </div>
  </section>` : ""}

  ${c.testimonials && c.testimonials.length > 0 ? `
  <section class="section">
    <div class="container text-center">
      <h2>What Our Users Say</h2>
      <div class="grid-${Math.min(c.testimonials.length, 3)}" style="margin-top:48px;">
        ${c.testimonials.map((t) => `
        <div class="card text-left">
          <p style="font-style:italic;margin-bottom:16px;">&ldquo;${escapeHtml(t.quote)}&rdquo;</p>
          <div>
            <strong>${escapeHtml(t.name)}</strong>
            <div style="color:#94a3b8;font-size:0.875rem;">${escapeHtml(t.role)}${t.company ? ` at ${escapeHtml(t.company)}` : ""}</div>
          </div>
        </div>`).join("\n        ")}
      </div>
    </div>
  </section>` : ""}

  ${c.pricing && c.pricing.length > 0 ? `
  <section class="section section-alt">
    <div class="container text-center">
      <h2>Pricing</h2>
      <div class="grid-${Math.min(c.pricing.length, 3)}" style="margin-top:48px;align-items:start;">
        ${c.pricing.map((p) => `
        <div class="pricing-card${p.highlighted ? " featured" : ""}">
          <h3>${escapeHtml(p.name)}</h3>
          <div class="price">${escapeHtml(p.price)}</div>
          ${p.period ? `<div class="period">${escapeHtml(p.period)}</div>` : ""}
          ${p.description ? `<p style="margin-top:8px;">${escapeHtml(p.description)}</p>` : ""}
          <ul>
            ${p.features.map((f) => `<li>${escapeHtml(f)}</li>`).join("\n            ")}
          </ul>
          <a href="#cta" class="btn ${p.highlighted ? "btn-primary" : "btn-secondary"}" style="width:100%;">${escapeHtml(p.cta)}</a>
        </div>`).join("\n        ")}
      </div>
    </div>
  </section>` : ""}

  ${c.faq && c.faq.length > 0 ? `
  <section class="section">
    <div class="container" style="max-width:800px;">
      <h2 class="text-center">FAQ</h2>
      <div style="margin-top:48px;">
        ${c.faq.map((f) => `
        <div class="faq-item">
          <h3>${escapeHtml(f.question)}</h3>
          <p>${escapeHtml(f.answer)}</p>
        </div>`).join("\n        ")}
      </div>
    </div>
  </section>` : ""}

  ${c.finalCta ? `
  <section class="cta-section" id="cta">
    <div class="container">
      <h2>${escapeHtml(c.finalCta.headline)}</h2>
      <p>${escapeHtml(c.finalCta.subheadline)}</p>
      <a href="#" class="btn btn-white">${escapeHtml(c.finalCta.cta)}</a>
    </div>
  </section>` : ""}

  ${c.contact ? `
  <section class="section">
    <div class="container text-center">
      <h2>${escapeHtml(c.contact.headline)}</h2>
      <p style="margin-bottom:32px;">${escapeHtml(c.contact.description)}</p>
      <div class="contact-info">
        ${c.contact.email ? `<span>✉ ${escapeHtml(c.contact.email)}</span>` : ""}
        ${c.contact.phone ? `<span>☎ ${escapeHtml(c.contact.phone)}</span>` : ""}
      </div>
    </div>
  </section>` : ""}

  ${c.footer ? `
  <footer class="footer">
    <div class="container">
      <p style="text-align:center;">${escapeHtml(c.footer.description)}</p>
      <div class="footer-bottom">
        <p>${escapeHtml(c.footer.copyright)}</p>
      </div>
    </div>
  </footer>` : ""}
</body>
</html>`;
}

export function generateLandingPageMarkdown(content: LandingPageOutput): string {
  const c = content;
  let md = "";

  if (c.hero) {
    md += `# ${c.hero.headline}\n\n`;
    md += `${c.hero.subheadline}\n\n`;
    md += `**[${c.hero.primaryCta}](#)**`;
    if (c.hero.secondaryCta) md += ` | [${c.hero.secondaryCta}](#)`;
    md += "\n\n";
    if (c.hero.trustBadges?.length) {
      md += c.hero.trustBadges.map((b) => `- ✓ ${b}`).join("\n") + "\n\n";
    }
  }

  if (c.problem?.headline) {
    md += `## ${c.problem.headline}\n\n`;
    if (c.problem.points) {
      md += c.problem.points.map((p) => `- ${p}`).join("\n") + "\n\n";
    }
  }

  if (c.solution?.headline) {
    md += `## ${c.solution.headline}\n\n`;
    if (c.solution.description) md += `${c.solution.description}\n\n`;
    if (c.solution.highlights) {
      md += c.solution.highlights.map((h) => `- ${h}`).join("\n") + "\n\n";
    }
  }

  if (c.benefits?.length) {
    md += `## Benefits\n\n`;
    md += c.benefits.map((b) => `### ${b.title}\n\n${b.description}\n`).join("\n") + "\n";
  }

  if (c.features?.length) {
    md += `## Features\n\n`;
    md += c.features.map((f) => `### ${f.title}\n\n${f.description}\n`).join("\n") + "\n";
  }

  if (c.howItWorks?.steps?.length) {
    md += `## ${c.howItWorks.headline}\n\n`;
    md += c.howItWorks.steps.map((s) => `**Step ${s.number}: ${s.title}**\n\n${s.description}\n`).join("\n") + "\n";
  }

  if (c.statistics?.length) {
    md += `## Statistics\n\n`;
    md += `| Value | Label |\n|-------|-------|\n`;
    md += c.statistics.map((s) => `| **${s.value}** | ${s.label} |`).join("\n") + "\n\n";
  }

  if (c.testimonials?.length) {
    md += `## Testimonials\n\n`;
    md += c.testimonials.map((t) => `> "${t.quote}"\n>\n> — **${t.name}**, ${t.role}${t.company ? ` at ${t.company}` : ""}\n`).join("\n") + "\n";
  }

  if (c.pricing?.length) {
    md += `## Pricing\n\n`;
    md += c.pricing.map((p) => `### ${p.name}${p.highlighted ? " ⭐" : ""}\n\n**${p.price}** ${p.period || ""}\n\n${p.description ? p.description + "\n\n" : ""}${p.features.map((f) => `- ${f}`).join("\n")}\n\n[${p.cta}](#)\n`).join("\n") + "\n";
  }

  if (c.faq?.length) {
    md += `## FAQ\n\n`;
    md += c.faq.map((f) => `**Q: ${f.question}**\n\nA: ${f.answer}\n`).join("\n") + "\n";
  }

  if (c.finalCta) {
    md += `## ${c.finalCta.headline}\n\n`;
    md += `${c.finalCta.subheadline}\n\n`;
    md += `**[${c.finalCta.cta}](#)**\n\n`;
  }

  if (c.contact) {
    md += `## ${c.contact.headline}\n\n`;
    md += `${c.contact.description}\n\n`;
    if (c.contact.email) md += `Email: ${c.contact.email}\n`;
    if (c.contact.phone) md += `Phone: ${c.contact.phone}\n`;
    md += "\n";
  }

  if (c.seo) {
    md += `---\n\n`;
    md += `**SEO Title:** ${c.seo.title}\n`;
    md += `**Meta Description:** ${c.seo.description}\n`;
    if (c.seo.keywords?.length) {
      md += `**Keywords:** ${c.seo.keywords.join(", ")}\n`;
    }
  }

  return md;
}

export function generateLandingPageJSON(content: LandingPageOutput): string {
  return JSON.stringify(content, null, 2);
}

export async function generateLandingPageZIP(content: LandingPageOutput): Promise<Blob> {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();

  zip.file("index.html", generateLandingPageHTML(content));
  zip.file("landing-page.md", generateLandingPageMarkdown(content));
  zip.file("landing-page.json", generateLandingPageJSON(content));

  if (content.seo?.schemaOrg) {
    zip.file("schema.json", JSON.stringify(content.seo.schemaOrg, null, 2));
  }

  return zip.generateAsync({ type: "blob" });
}

function escapeHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
