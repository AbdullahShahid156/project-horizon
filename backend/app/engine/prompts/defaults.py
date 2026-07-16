DEFAULT_PROMPTS = [
    {
        "name": "website_generation",
        "category": "website",
        "version": 1,
        "description": "Generate a complete multi-page website structure",
        "template": """You are an expert web designer and developer. Generate a complete website structure as JSON.

Business: {business_name}
Industry: {industry}
Description: {description}
Target: {target_audience}
Pages: {pages}
Style: {style}
Colors: Primary={primary_color}, Secondary={secondary_color}, Accent={accent_color}
Language: {language}
Country: {country}

Return a JSON object with: title, description, colors, typography, navigation, homepage (hero, features, benefits, services, testimonials, statistics), about (mission, vision, values), services, pricing, faq, contact, footer, team, seo.

Generate REAL, compelling copy. Specific to the {industry} industry.""",
    },
    {
        "name": "landing_page_generation",
        "category": "landing_page",
        "version": 2,
        "description": "Generate a premium, high-converting landing page",
        "template": """You are a world-class conversion copywriter and landing page strategist who has generated $500M+ in revenue for clients. Generate a PREMIUM, high-converting landing page as a JSON object.

BUSINESS INFORMATION:
- Business Name: {business_name}
- Product/Service: {product_name}
- Description: {description}
- Industry: {industry}
- Target Audience: {target_audience}
- Primary Goal: {primary_goal}
- Brand Voice: {brand_voice}
- Language: {language}
- Country: {country}
- Primary CTA: {primary_cta}
- Secondary CTA: {secondary_cta}
- Color Palette: Primary={primary_color}, Secondary={secondary_color}, Accent={accent_color}
- Typography: {typography}
- Sections to Include: {sections_required}

COPYWRITING FRAMEWORKS TO USE:
- Headlines: Use the "4 U's" framework — Useful, Urgent, Unique, Ultra-specific
- Problem section: Use PAS (Problem-Agitate-Solution) copywriting
- Benefits: Use before/after contrast with specific outcomes
- CTA sections: Create urgency with scarcity or time-sensitivity
- Social proof: Include specific numbers, recognizable brand patterns, real-sounding testimonials

QUALITY REQUIREMENTS:
1. Every headline must be under 10 words and make a bold promise or ask a provocative question
2. Every description must paint a vivid picture of the transformation/outcome
3. Use power words: "proven", "guaranteed", "instant", "exclusive", "transform", "unlock", "discover"
4. Include specific numbers and metrics wherever possible (e.g., "10,000+ teams", "99.9% uptime", "$2.4M saved")
5. Testimonials must include name, role, company, and a specific quote with measurable results
6. Pricing must have 3 tiers with the middle one highlighted as "Most Popular"
7. FAQ must have at least 5 detailed, realistic questions with thorough answers
8. Statistics section must have 4 impressive, specific numbers

GENERATE THIS JSON STRUCTURE:
{{
  "title": "string — compelling page title with primary keyword",
  "hero": {{
    "headline": "string — bold promise under 10 words",
    "subheadline": "string — specific value proposition with a number or outcome in 1-2 sentences",
    "primaryCta": "{primary_cta}",
    "secondaryCta": "{secondary_cta}",
    "trustBadges": ["string — e.g. 'No credit card required'", "string — e.g. 'Free 14-day trial'", "string — e.g. 'Cancel anytime'"],
    "imageUrl": null,
    "socialProof": {{
      "label": "string — e.g. 'Trusted by 10,000+ teams worldwide'",
      "logos": ["string — e.g. 'Google'", "string — e.g. 'Microsoft'", "string — e.g. 'Stripe'", "string — e.g. 'Shopify'"]
    }}
  }},
  "problem": {{
    "headline": "string — agitating headline that names the pain",
    "description": "string — 2-3 sentences that agitate the problem and make it feel urgent",
    "points": ["string — specific pain point 1 with emotional weight", "string — specific pain point 2", "string — specific pain point 3", "string — specific pain point 4"]
  }},
  "solution": {{
    "headline": "string — solution headline that promises transformation",
    "description": "string — how your product uniquely solves the problem, with specific features",
    "highlights": ["string — highlight 1 with specific outcome", "string — highlight 2 with specific outcome", "string — highlight 3 with specific outcome", "string — highlight 4 with specific outcome"]
  }},
  "benefits": [
    {{"title": "string — benefit-focused title", "description": "string — 2 sentences showing before/after transformation", "icon": "string — lucide icon name"}},
    {{"title": "string", "description": "string", "icon": "string"}},
    {{"title": "string", "description": "string", "icon": "string"}},
    {{"title": "string", "description": "string", "icon": "string"}},
    {{"title": "string", "description": "string", "icon": "string"}},
    {{"title": "string", "description": "string", "icon": "string"}}
  ],
  "features": [
    {{"title": "string — feature name", "description": "string — what it does and why it matters", "icon": "string — lucide icon name"}},
    {{"title": "string", "description": "string", "icon": "string"}},
    {{"title": "string", "description": "string", "icon": "string"}},
    {{"title": "string", "description": "string", "icon": "string"}},
    {{"title": "string", "description": "string", "icon": "string"}},
    {{"title": "string", "description": "string", "icon": "string"}}
  ],
  "howItWorks": {{
    "headline": "string — simple headline like 'Get started in 3 easy steps'",
    "steps": [
      {{"number": 1, "title": "string — action verb title", "description": "string — what happens in this step with specific detail"}},
      {{"number": 2, "title": "string", "description": "string"}},
      {{"number": 3, "title": "string", "description": "string"}}
    ]
  }},
  "socialProof": {{
    "headline": "string — e.g. 'Loved by industry leaders'",
    "logos": ["string — company name 1", "string — company name 2", "string — company name 3", "string — company name 4", "string — company name 5", "string — company name 6"],
    "metrics": [
      {{"value": "string — e.g. '10,000+'", "label": "string — e.g. 'Active users'"}},
      {{"value": "string — e.g. '99.9%'", "label": "string — e.g. 'Uptime'"}},
      {{"value": "string — e.g. '4.9/5'", "label": "string — e.g. 'Customer rating'"}},
      {{"value": "string — e.g. '$2.4M'", "label": "string — e.g. 'Saved for clients'"}}
    ]
  }},
  "testimonials": [
    {{"name": "string — real-sounding full name", "role": "string — job title", "company": "string — company name", "quote": "string — specific testimonial with measurable results (e.g. 'increased conversions by 47%')", "rating": 5, "imageUrl": null}},
    {{"name": "string", "role": "string", "company": "string", "quote": "string", "rating": 5, "imageUrl": null}},
    {{"name": "string", "role": "string", "company": "string", "quote": "string", "rating": 5, "imageUrl": null}}
  ],
  "statistics": [
    {{"value": "string — impressive number with unit", "label": "string — what it measures"}},
    {{"value": "string", "label": "string"}},
    {{"value": "string", "label": "string"}},
    {{"value": "string", "label": "string"}}
  ],
  "pricing": [
    {{"name": "string — e.g. 'Starter'", "price": "string — e.g. '$29'", "period": "string — e.g. '/month'", "description": "string — who it's for", "features": ["string — feature 1", "string — feature 2", "string — feature 3", "string — feature 4"], "cta": "string — action text", "highlighted": false}},
    {{"name": "string — e.g. 'Professional'", "price": "string — e.g. '$79'", "period": "string", "description": "string", "features": ["string — feature 1", "string — feature 2", "string — feature 3", "string — feature 4", "string — feature 5", "string — feature 6"], "cta": "string", "highlighted": true}},
    {{"name": "string — e.g. 'Enterprise'", "price": "string — e.g. '$199'", "period": "string", "description": "string", "features": ["string — feature 1", "string — feature 2", "string — feature 3", "string — feature 4", "string — feature 5", "string — feature 6", "string — feature 7", "string — feature 8"], "cta": "string", "highlighted": false}}
  ],
  "guarantee": {{
    "headline": "string — e.g. '100% Money-Back Guarantee'",
    "description": "string — risk reversal statement, specific time period, no-questions-asked",
    "icon": "string — lucide icon name like 'ShieldCheck'"
  }},
  "faq": [
    {{"question": "string — realistic customer question", "answer": "string — thorough 2-3 sentence answer addressing concerns"}},
    {{"question": "string", "answer": "string"}},
    {{"question": "string", "answer": "string"}},
    {{"question": "string", "answer": "string"}},
    {{"question": "string", "answer": "string"}}
  ],
  "finalCta": {{
    "headline": "string — urgent, compelling final headline",
    "subheadline": "string — specific benefit + urgency",
    "cta": "{primary_cta}"
  }},
  "contact": {{
    "headline": "string",
    "description": "string — 1-2 sentences inviting contact",
    "email": "string — placeholder email",
    "phone": "string or null"
  }},
  "footer": {{
    "description": "string — 1 sentence brand description",
    "copyright": "string — © {{year}} {business_name}. All rights reserved."
  }},
  "seo": {{
    "title": "string — under 60 chars with primary keyword",
    "description": "string — under 160 chars, compelling with CTA",
    "keywords": ["string — primary keyword", "string — secondary keyword", "string — long-tail keyword", "string — related keyword", "string — industry keyword"],
    "ogTitle": "string",
    "ogDescription": "string",
    "schemaOrg": {{
      "@type": "Organization",
      "name": "{business_name}",
      "description": "string",
      "url": "string"
    }}
  }},
  "twitterCard": {{
    "card": "summary_large_image",
    "title": "string",
    "description": "string"
  }},
  "colors": {{
    "primary": "{primary_color}",
    "secondary": "{secondary_color}",
    "accent": "{accent_color}"
  }},
  "typography": "{typography}"
}}

CRITICAL: Generate REAL, compelling, conversion-optimized copy. NOT placeholder text. NOT generic filler. Every word must earn its place. Make it specific to the {industry} industry and relevant to {target_audience}. Write like a top-tier agency delivering a $50,000 landing page."""
    },
    {
        "name": "copy_improve",
        "category": "copywriting",
        "version": 1,
        "description": "Improve existing copy with AI",
        "template": """You are an expert copywriter. {action} the following text.

Text: "{text}"
{tone_instruction}

Return ONLY the improved text. Keep the same language. Make it more engaging.""",
    },
    {
        "name": "seo_optimize",
        "category": "seo",
        "version": 1,
        "description": "Generate SEO metadata for a page",
        "template": """Generate SEO metadata for this page.

Page Title: {page_title}
Content Summary: {content_summary}
Target Keywords: {target_keywords}
Industry: {industry}
Language: {language}

Return JSON with: title (under 60 chars), description (under 160 chars), keywords (array), ogTitle, ogDescription, canonicalUrl, schemaOrg.""",
    },
    {
        "name": "blog_generation",
        "category": "blog",
        "version": 1,
        "description": "Generate a blog post",
        "template": """Write a blog post.

Topic: {topic}
Target Audience: {audience}
Tone: {tone}
Word Count: {word_count}
Keywords: {keywords}

Return JSON with: title, excerpt, content (markdown), tags, readingTime, seoTitle, seoDescription.""",
    },
    {
        "name": "email_generation",
        "category": "email",
        "version": 1,
        "description": "Generate marketing emails",
        "template": """Write a marketing email.

Type: {email_type}
Product: {product_name}
Audience: {audience}
Goal: {goal}
Tone: {tone}

Return JSON with: subject, previewText, preheader, body (HTML), cta, ctaUrl.""",
    },
    {
        "name": "ad_copy",
        "category": "ads",
        "version": 1,
        "description": "Generate ad copy",
        "template": """Write ad copy for: {platform}

Product: {product_name}
Audience: {audience}
Goal: {goal}
Character Limit: {char_limit}

Return JSON with: headline, description, cta, displayUrl.""",
    },
    {
        "name": "social_media",
        "category": "social",
        "version": 1,
        "description": "Generate social media posts",
        "template": """Write a social media post for: {platform}

Topic: {topic}
Audience: {audience}
Tone: {tone}
Include Hashtags: {include_hashtags}

Return JSON with: content, hashtags, bestTimeToPost.""",
    },
    {
        "name": "product_description",
        "category": "product",
        "version": 1,
        "description": "Generate product descriptions",
        "template": """Write a product description.

Product: {product_name}
Category: {category}
Features: {features}
Price: {price}
Audience: {audience}

Return JSON with: title, shortDescription, fullDescription, features (array of {title, description}), benefits.""",
    },
    {
        "name": "support_response",
        "category": "support",
        "version": 1,
        "description": "Generate support responses",
        "template": """Generate a customer support response.

Customer Issue: {issue}
Product: {product_name}
Tone: {tone}

Return JSON with: greeting, response, followUp, escalate (boolean).""",
    },
]
