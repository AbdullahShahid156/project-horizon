from typing import Any

from app.engine.engine import get_ai_engine


class WebsiteGenerator:
    """Generate complete websites using the AI engine."""

    async def generate(self, params: dict[str, Any], user_id: str | None = None) -> dict[str, Any]:
        engine = get_ai_engine()
        prompt = engine.render_prompt("website_generation", "website", **params)
        response = await engine.generate_json(prompt, operation="website_generation", user_id=user_id)
        if not response.success:
            raise RuntimeError(response.error or "Generation failed")
        return response.json_data or {}


class LandingPageGenerator:
    """Generate landing pages using the AI engine."""

    async def generate(self, params: dict[str, Any], user_id: str | None = None) -> dict[str, Any]:
        engine = get_ai_engine()
        prompt = engine.render_prompt("landing_page_generation", "landing_page", **params)
        response = await engine.generate_json(prompt, operation="landing_page_generation", user_id=user_id)
        if not response.success:
            raise RuntimeError(response.error or "Generation failed")
        return response.json_data or {}


class SEOGenerator:
    """Generate SEO metadata using the AI engine."""

    async def generate(self, params: dict[str, Any], user_id: str | None = None) -> dict[str, Any]:
        engine = get_ai_engine()
        prompt = engine.render_prompt("seo_optimize", "seo", **params)
        response = await engine.generate_json(prompt, operation="seo_optimization", user_id=user_id)
        if not response.success:
            raise RuntimeError(response.error or "Generation failed")
        return response.json_data or {}


class BlogGenerator:
    """Generate blog posts using the AI engine."""

    async def generate(self, params: dict[str, Any], user_id: str | None = None) -> dict[str, Any]:
        engine = get_ai_engine()
        prompt = engine.render_prompt("blog_generation", "blog", **params)
        response = await engine.generate_json(prompt, operation="blog_generation", user_id=user_id)
        if not response.success:
            raise RuntimeError(response.error or "Generation failed")
        return response.json_data or {}


class EmailGenerator:
    """Generate marketing emails using the AI engine."""

    async def generate(self, params: dict[str, Any], user_id: str | None = None) -> dict[str, Any]:
        engine = get_ai_engine()
        prompt = engine.render_prompt("email_generation", "email", **params)
        response = await engine.generate_json(prompt, operation="email_generation", user_id=user_id)
        if not response.success:
            raise RuntimeError(response.error or "Generation failed")
        return response.json_data or {}


class AdCopyGenerator:
    """Generate ad copy using the AI engine."""

    async def generate(self, params: dict[str, Any], user_id: str | None = None) -> dict[str, Any]:
        engine = get_ai_engine()
        prompt = engine.render_prompt("ad_copy", "ads", **params)
        response = await engine.generate_json(prompt, operation="ad_copy_generation", user_id=user_id)
        if not response.success:
            raise RuntimeError(response.error or "Generation failed")
        return response.json_data or {}


class SocialMediaGenerator:
    """Generate social media posts using the AI engine."""

    async def generate(self, params: dict[str, Any], user_id: str | None = None) -> dict[str, Any]:
        engine = get_ai_engine()
        prompt = engine.render_prompt("social_media", "social", **params)
        response = await engine.generate_json(prompt, operation="social_media_generation", user_id=user_id)
        if not response.success:
            raise RuntimeError(response.error or "Generation failed")
        return response.json_data or {}


class ProductDescriptionGenerator:
    """Generate product descriptions using the AI engine."""

    async def generate(self, params: dict[str, Any], user_id: str | None = None) -> dict[str, Any]:
        engine = get_ai_engine()
        prompt = engine.render_prompt("product_description", "product", **params)
        response = await engine.generate_json(prompt, operation="product_description_generation", user_id=user_id)
        if not response.success:
            raise RuntimeError(response.error or "Generation failed")
        return response.json_data or {}


class SupportResponseGenerator:
    """Generate support responses using the AI engine."""

    async def generate(self, params: dict[str, Any], user_id: str | None = None) -> dict[str, Any]:
        engine = get_ai_engine()
        prompt = engine.render_prompt("support_response", "support", **params)
        response = await engine.generate_json(prompt, operation="support_response_generation", user_id=user_id)
        if not response.success:
            raise RuntimeError(response.error or "Generation failed")
        return response.json_data or {}
