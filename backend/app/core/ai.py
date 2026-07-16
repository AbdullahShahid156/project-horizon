from abc import ABC, abstractmethod
from typing import Any

from app.core.config import settings


class AIProvider(ABC):
    @abstractmethod
    async def generate(self, prompt: str, system_instruction: str | None = None) -> str:
        pass

    @abstractmethod
    async def generate_json(self, prompt: str, system_instruction: str | None = None) -> dict[str, Any]:
        pass


class GeminiProvider(AIProvider):
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model = settings.GEMINI_MODEL

    async def generate(self, prompt: str, system_instruction: str | None = None) -> str:
        import google.generativeai as genai

        genai.configure(api_key=self.api_key)
        model = genai.GenerativeModel(self.model)

        kwargs: dict[str, Any] = {}
        if system_instruction:
            kwargs["system_instruction"] = system_instruction

        response = await model.generate_content_async(prompt, **kwargs)
        return response.text

    async def generate_json(self, prompt: str, system_instruction: str | None = None) -> dict[str, Any]:
        import json

        json_instruction = (
            (system_instruction or "")
            + "\n\nIMPORTANT: Return ONLY valid JSON. No markdown, no code blocks, no extra text."
        )

        raw = await self.generate(prompt, json_instruction.strip())

        cleaned = raw.strip()
        if cleaned.startswith("```"):
            lines = cleaned.split("\n")
            cleaned = "\n".join(lines[1:-1])

        return json.loads(cleaned)


def get_ai_provider() -> AIProvider:
    provider = settings.AI_PROVIDER.lower()
    if provider == "gemini":
        return GeminiProvider()
    raise ValueError(f"Unsupported AI provider: {provider}")


LANDING_PAGE_GENERATION_PROMPT = """You are a world-class conversion copywriter and landing page strategist who has generated $500M+ in revenue for clients. Generate a PREMIUM, high-converting landing page as a JSON object.

Business Information:
- Business Name: {business_name}
- Product Name: {product_name}
- Description: {description}
- Industry: {industry}
- Target Audience: {target_audience}
- Primary Goal: {primary_goal}
- Brand Voice: {brand_voice}
- Language: {language}
- Country: {country}
- Primary CTA: {primary_cta}
- Secondary CTA: {secondary_cta}
- Colors: Primary={primary_color}, Secondary={secondary_color}, Accent={accent_color}
- Typography: {typography}
- Sections Required: {sections_required}

COPYWRITING FRAMEWORKS:
- Headlines: Use the "4 U's" — Useful, Urgent, Unique, Ultra-specific
- Problem: Use PAS (Problem-Agitate-Solution) copywriting
- Benefits: Before/after contrast with specific outcomes
- CTA: Urgency with scarcity or time-sensitivity
- Social proof: Specific numbers, recognizable brands, real testimonials

QUALITY RULES:
1. Headlines under 10 words — bold promise or provocative question
2. Descriptions paint vivid transformation/outcome pictures
3. Power words: "proven", "guaranteed", "instant", "exclusive", "transform", "unlock"
4. Specific numbers everywhere (10,000+ teams, 99.9% uptime, $2.4M saved)
5. Testimonials with name, role, company, specific quote with measurable results
6. 3 pricing tiers, middle one "Most Popular"
7. 5+ detailed FAQ items
8. 4 impressive statistics

Generate this EXACT JSON structure:
{{
  "title": "string — page title with keyword",
  "hero": {{
    "headline": "string — bold promise under 10 words",
    "subheadline": "string — value prop with number/outcome, 1-2 sentences",
    "primaryCta": "{primary_cta}",
    "secondaryCta": "{secondary_cta}",
    "trustBadges": ["string — e.g. 'No credit card required'", "string — e.g. 'Free 14-day trial'", "string — e.g. 'Cancel anytime'"],
    "imageUrl": null,
    "socialProof": {{
      "label": "string — e.g. 'Trusted by 10,000+ teams'",
      "logos": ["string — company 1", "string — company 2", "string — company 3", "string — company 4"]
    }}
  }},
  "problem": {{
    "headline": "string — agitating pain headline",
    "description": "string — 2-3 sentences agitating the problem",
    "points": ["string — pain point 1", "string — pain point 2", "string — pain point 3", "string — pain point 4"]
  }},
  "solution": {{
    "headline": "string — transformation headline",
    "description": "string — how product uniquely solves the problem",
    "highlights": ["string — highlight 1 with outcome", "string — highlight 2", "string — highlight 3", "string — highlight 4"]
  }},
  "benefits": [
    {{"title": "string", "description": "string — 2 sentences with before/after", "icon": "string — lucide icon"}},
    {{"title": "string", "description": "string", "icon": "string"}},
    {{"title": "string", "description": "string", "icon": "string"}},
    {{"title": "string", "description": "string", "icon": "string"}},
    {{"title": "string", "description": "string", "icon": "string"}},
    {{"title": "string", "description": "string", "icon": "string"}}
  ],
  "features": [
    {{"title": "string", "description": "string — what it does + why it matters", "icon": "string — lucide icon"}},
    {{"title": "string", "description": "string", "icon": "string"}},
    {{"title": "string", "description": "string", "icon": "string"}},
    {{"title": "string", "description": "string", "icon": "string"}},
    {{"title": "string", "description": "string", "icon": "string"}},
    {{"title": "string", "description": "string", "icon": "string"}}
  ],
  "howItWorks": {{
    "headline": "string",
    "steps": [
      {{"number": 1, "title": "string — action verb", "description": "string — specific detail"}},
      {{"number": 2, "title": "string", "description": "string"}},
      {{"number": 3, "title": "string", "description": "string"}}
    ]
  }},
  "socialProof": {{
    "headline": "string — e.g. 'Loved by industry leaders'",
    "logos": ["string — company 1", "string — company 2", "string — company 3", "string — company 4", "string — company 5", "string — company 6"],
    "metrics": [
      {{"value": "string — e.g. '10,000+'", "label": "string — e.g. 'Active users'"}},
      {{"value": "string", "label": "string"}},
      {{"value": "string", "label": "string"}},
      {{"value": "string", "label": "string"}}
    ]
  }},
  "testimonials": [
    {{"name": "string", "role": "string", "company": "string", "quote": "string — with measurable results", "rating": 5, "imageUrl": null}},
    {{"name": "string", "role": "string", "company": "string", "quote": "string", "rating": 5, "imageUrl": null}},
    {{"name": "string", "role": "string", "company": "string", "quote": "string", "rating": 5, "imageUrl": null}}
  ],
  "statistics": [
    {{"value": "string", "label": "string"}},
    {{"value": "string", "label": "string"}},
    {{"value": "string", "label": "string"}},
    {{"value": "string", "label": "string"}}
  ],
  "pricing": [
    {{"name": "string", "price": "string", "period": "string", "description": "string — who it's for", "features": ["string", "string", "string", "string"], "cta": "string", "highlighted": false}},
    {{"name": "string", "price": "string", "period": "string", "description": "string", "features": ["string", "string", "string", "string", "string", "string"], "cta": "string", "highlighted": true}},
    {{"name": "string", "price": "string", "period": "string", "description": "string", "features": ["string", "string", "string", "string", "string", "string", "string", "string"], "cta": "string", "highlighted": false}}
  ],
  "guarantee": {{
    "headline": "string — e.g. '100% Money-Back Guarantee'",
    "description": "string — risk reversal with specific time period",
    "icon": "string — lucide icon"
  }},
  "faq": [
    {{"question": "string", "answer": "string — 2-3 sentences"}},
    {{"question": "string", "answer": "string"}},
    {{"question": "string", "answer": "string"}},
    {{"question": "string", "answer": "string"}},
    {{"question": "string", "answer": "string"}}
  ],
  "finalCta": {{
    "headline": "string — urgent headline",
    "subheadline": "string — specific benefit + urgency",
    "cta": "{primary_cta}"
  }},
  "contact": {{
    "headline": "string",
    "description": "string",
    "email": "string",
    "phone": "string or null"
  }},
  "footer": {{
    "description": "string",
    "copyright": "string — © year {business_name}. All rights reserved."
  }},
  "seo": {{
    "title": "string — under 60 chars",
    "description": "string — under 160 chars",
    "keywords": ["string", "string", "string", "string", "string"],
    "ogTitle": "string",
    "ogDescription": "string",
    "schemaOrg": {{"@type": "Organization", "name": "{business_name}", "description": "string"}}
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

Generate REAL, compelling, conversion-optimized copy. NOT placeholder text. Every word must earn its place. Specific to {industry} and {target_audience}. Write like a top-tier agency delivering a $50,000 landing page."""


COPY_IMPROVE_PROMPT = """You are an expert copywriter. {action} the following text.

Text to improve:
"{text}"

{tone_instruction}

Rules:
- Maintain the original meaning and intent
- Keep the same language
- Make it more engaging and persuasive
- Return ONLY the improved text, no explanations
- Keep it concise"""


LANDING_PAGE_TEMPLATES = [
    {
        "name": "SaaS Product",
        "slug": "saas-product",
        "description": "High-converting template for SaaS products with pricing, social proof, and feature deep-dives",
        "category": "SaaS",
        "content": {
            "hero": {"headline": "Ship Products 10x Faster With One Platform", "subheadline": "Join 12,000+ engineering teams who cut their release cycle from months to days. No credit card required.", "primaryCta": "Start Free Trial", "secondaryCta": "Watch 2-Min Demo"},
            "sections": ["hero", "socialProof", "problem", "solution", "benefits", "features", "howItWorks", "testimonials", "statistics", "pricing", "guarantee", "faq", "finalCta"],
        },
    },
    {
        "name": "Agency",
        "slug": "agency",
        "description": "Premium template for creative and marketing agencies with portfolio showcase",
        "category": "Agency",
        "content": {
            "hero": {"headline": "We Turn Bold Ideas Into Breakthrough Brands", "subheadline": "Award-winning agency trusted by Fortune 500 companies. Average 340% ROI for our clients.", "primaryCta": "Start a Project", "secondaryCta": "View Case Studies"},
            "sections": ["hero", "socialProof", "problem", "solution", "features", "testimonials", "statistics", "pricing", "faq", "contact", "finalCta"],
        },
    },
    {
        "name": "E-commerce",
        "slug": "ecommerce",
        "description": "High-converting template for online stores with urgency and social proof",
        "category": "E-commerce",
        "content": {
            "hero": {"headline": "Discover Products That Change Everything", "subheadline": "Trusted by 50,000+ customers. Free shipping on orders over $50. 30-day hassle-free returns.", "primaryCta": "Shop the Collection", "secondaryCta": "Take the Style Quiz"},
            "sections": ["hero", "socialProof", "benefits", "features", "testimonials", "statistics", "pricing", "guarantee", "faq", "finalCta"],
        },
    },
    {
        "name": "Startup",
        "slug": "startup",
        "description": "Bold, energetic template for early-stage startups with beta waitlist",
        "category": "Startup",
        "content": {
            "hero": {"headline": "The Future of Work Starts Here", "subheadline": "Built for teams that move fast. Backed by Y Combinator. Join 5,000+ early adopters on the waitlist.", "primaryCta": "Join the Beta", "secondaryCta": "Read Our Story"},
            "sections": ["hero", "socialProof", "problem", "solution", "benefits", "testimonials", "pricing", "faq", "finalCta"],
        },
    },
    {
        "name": "Local Business",
        "slug": "local-business",
        "description": "Trust-building template for local businesses with reviews and location info",
        "category": "Local",
        "content": {
            "hero": {"headline": "Your Trusted Local Partner Since 2010", "subheadline": "Over 15 years of serving the community. 4.9-star rating from 2,000+ happy customers.", "primaryCta": "Get a Free Quote", "secondaryCta": "Call (555) 123-4567"},
            "sections": ["hero", "socialProof", "benefits", "testimonials", "statistics", "faq", "contact", "guarantee", "finalCta"],
        },
    },
    {
        "name": "Event",
        "slug": "event",
        "description": "High-energy template for events, conferences, and webinars with countdown urgency",
        "category": "Event",
        "content": {
            "hero": {"headline": "Where Industry Leaders Shape the Future", "subheadline": "Join 2,000+ innovators at the must-attend event of 2026. Early-bird pricing ends soon.", "primaryCta": "Get Your Ticket", "secondaryCta": "See the Lineup"},
            "sections": ["hero", "socialProof", "features", "testimonials", "statistics", "pricing", "faq", "finalCta"],
        },
    },
]
