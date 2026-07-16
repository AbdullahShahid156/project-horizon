import type { WebsiteOutput } from '@/types';

export function generateMarkdown(content: WebsiteOutput): string {
  const lines: string[] = [];

  lines.push(`# ${content.websiteName}\n`);
  lines.push(`${content.brandSummary}\n`);
  lines.push('---\n');

  lines.push(`## Hero\n`);
  lines.push(`### ${content.homepage.hero.headline}\n`);
  lines.push(`${content.homepage.hero.subheadline}\n`);
  lines.push(`**Primary CTA:** ${content.homepage.hero.primaryCta}\n`);
  lines.push(`**Secondary CTA:** ${content.homepage.hero.secondaryCta}\n`);
  lines.push('---\n');

  if (content.homepage.features.length > 0) {
    lines.push('## Features\n');
    for (const f of content.homepage.features) {
      lines.push(`### ${f.title}\n`);
      lines.push(`${f.description}\n`);
    }
    lines.push('---\n');
  }

  if (content.homepage.statistics.length > 0) {
    lines.push('## Statistics\n');
    for (const s of content.homepage.statistics) {
      lines.push(`- **${s.value}** - ${s.label}`);
    }
    lines.push('\n---\n');
  }

  if (content.homepage.testimonials.length > 0) {
    lines.push('## Testimonials\n');
    for (const t of content.homepage.testimonials) {
      lines.push(`> "${t.quote}"\n`);
      lines.push(`> -- **${t.name}**, ${t.role}, ${t.company}\n`);
    }
    lines.push('---\n');
  }

  lines.push('## About\n');
  lines.push(`### Mission\n${content.about.mission}\n`);
  lines.push(`### Vision\n${content.about.vision}\n`);
  lines.push(`### Values\n`);
  for (const v of content.about.values) {
    lines.push(`- ${v}`);
  }
  lines.push('\n---\n');

  if (content.services.length > 0) {
    lines.push('## Services\n');
    for (const s of content.services) {
      lines.push(`### ${s.title}\n`);
      lines.push(`${s.description}\n`);
      if (s.price) lines.push(`**Price:** ${s.price}\n`);
    }
    lines.push('---\n');
  }

  if (content.pricing.length > 0) {
    lines.push('## Pricing\n');
    for (const p of content.pricing) {
      lines.push(`### ${p.name} - ${p.price}/${p.period}\n`);
      lines.push(`${p.description}\n`);
      lines.push(`**CTA:** ${p.cta}\n`);
    }
    lines.push('---\n');
  }

  if (content.faq.length > 0) {
    lines.push('## FAQ\n');
    for (const f of content.faq) {
      lines.push(`### ${f.question}\n`);
      lines.push(`${f.answer}\n`);
    }
    lines.push('---\n');
  }

  lines.push('## Contact\n');
  lines.push(`${content.contact.headline}\n`);
  lines.push(`${content.contact.description}\n`);
  lines.push(`**Email:** ${content.contact.email}\n`);
  if (content.contact.phone) lines.push(`**Phone:** ${content.contact.phone}\n`);
  if (content.contact.address) lines.push(`**Address:** ${content.contact.address}\n`);

  lines.push('\n---\n');
  lines.push(`*${content.footer.copyright}*\n`);

  return lines.join('\n');
}

export function generateHtml(content: WebsiteOutput): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${content.seo.metaTitle}</title>
  <meta name="description" content="${content.seo.metaDescription}">
  <meta property="og:title" content="${content.seo.ogTitle}">
  <meta property="og:description" content="${content.seo.ogDescription}">
  <meta name="keywords" content="${content.seo.keywords.join(', ')}">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a; }
    .hero { background: linear-gradient(135deg, #2563eb, #7c3aed); color: white; padding: 80px 24px; text-align: center; }
    .hero h1 { font-size: 3rem; font-weight: 800; margin-bottom: 16px; }
    .hero p { font-size: 1.25rem; opacity: 0.9; max-width: 640px; margin: 0 auto; }
    .hero .cta-group { margin-top: 32px; display: flex; gap: 16px; justify-content: center; }
    .hero .cta-primary { background: white; color: #2563eb; padding: 14px 32px; border-radius: 12px; font-weight: 600; border: none; cursor: pointer; font-size: 1rem; }
    .hero .cta-secondary { border: 1px solid rgba(255,255,255,0.3); color: white; padding: 14px 32px; border-radius: 12px; font-weight: 600; background: transparent; cursor: pointer; font-size: 1rem; }
    .section { padding: 80px 24px; }
    .section-title { text-align: center; font-size: 2rem; font-weight: 700; margin-bottom: 48px; }
    .grid { display: grid; gap: 24px; max-width: 1200px; margin: 0 auto; }
    .grid-3 { grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }
    .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; }
    .card h3 { font-size: 1.25rem; font-weight: 600; margin-bottom: 8px; }
    .card p { color: #6b7280; font-size: 0.875rem; }
    .stats { background: #f9fafb; padding: 48px 24px; }
    .stats .grid { grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); text-align: center; }
    .stat-value { font-size: 2.25rem; font-weight: 700; color: #2563eb; }
    .stat-label { color: #6b7280; font-size: 0.875rem; margin-top: 4px; }
    .footer { background: #111827; color: #9ca3af; padding: 32px 24px; text-align: center; font-size: 0.875rem; }
    nav { display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; border-bottom: 1px solid #e5e7eb; }
    nav .brand { font-size: 1.25rem; font-weight: 700; }
    nav .links { display: flex; gap: 24px; }
    nav .links a { color: #6b7280; text-decoration: none; font-size: 0.875rem; }
    nav .links a:hover { color: #1a1a1a; }
  </style>
</head>
<body>
  <nav>
    <div class="brand">${content.websiteName}</div>
    <div class="links">
      ${content.navigation.map((n) => `<a href="${n.url}">${n.label}</a>`).join('\n      ')}
    </div>
  </nav>

  <div class="hero">
    <h1>${content.homepage.hero.headline}</h1>
    <p>${content.homepage.hero.subheadline}</p>
    <div class="cta-group">
      <button class="cta-primary">${content.homepage.hero.primaryCta}</button>
      <button class="cta-secondary">${content.homepage.hero.secondaryCta}</button>
    </div>
  </div>

  ${
    content.homepage.features.length > 0
      ? `<div class="section">
    <h2 class="section-title">Features</h2>
    <div class="grid grid-3">
      ${content.homepage.features
        .map(
          (f) => `<div class="card">
        <h3>${f.title}</h3>
        <p>${f.description}</p>
      </div>`,
        )
        .join('\n      ')}
    </div>
  </div>`
      : ''
  }

  ${
    content.homepage.statistics.length > 0
      ? `<div class="stats">
    <div class="grid">
      ${content.homepage.statistics
        .map(
          (s) => `<div>
        <div class="stat-value">${s.value}</div>
        <div class="stat-label">${s.label}</div>
      </div>`,
        )
        .join('\n      ')}
    </div>
  </div>`
      : ''
  }

  ${
    content.services.length > 0
      ? `<div class="section">
    <h2 class="section-title">Services</h2>
    <div class="grid grid-3">
      ${content.services
        .map(
          (s) => `<div class="card">
        <h3>${s.title}</h3>
        <p>${s.description}</p>
        ${s.price ? `<p style="font-weight:700;margin-top:8px">${s.price}</p>` : ''}
      </div>`,
        )
        .join('\n      ')}
    </div>
  </div>`
      : ''
  }

  ${
    content.faq.length > 0
      ? `<div class="section" style="background:#f9fafb">
    <h2 class="section-title">FAQ</h2>
    <div style="max-width:800px;margin:0 auto">
      ${content.faq
        .map(
          (f) => `<div class="card" style="margin-bottom:16px">
        <h3>${f.question}</h3>
        <p style="margin-top:8px">${f.answer}</p>
      </div>`,
        )
        .join('\n      ')}
    </div>
  </div>`
      : ''
  }

  <div class="section" style="background:#f9fafb;text-align:center">
    <h2 class="section-title">${content.contact.headline}</h2>
    <p style="color:#6b7280;max-width:600px;margin:0 auto">${content.contact.description}</p>
    <p style="margin-top:16px;font-weight:500">${content.contact.email}</p>
    ${content.contact.phone ? `<p>${content.contact.phone}</p>` : ''}
    ${content.contact.address ? `<p>${content.contact.address}</p>` : ''}
  </div>

  <footer class="footer">
    <p>${content.footer.copyright}</p>
  </footer>
</body>
</html>`;
}

export async function generateZip(content: WebsiteOutput): Promise<Blob> {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();

  zip.file('index.html', generateHtml(content));
  zip.file('content.json', JSON.stringify(content, null, 2));
  zip.file('README.md', generateMarkdown(content));

  return zip.generateAsync({ type: 'blob' });
}
