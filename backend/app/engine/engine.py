import time
import uuid
from typing import Any, AsyncIterator

from app.engine.providers.base import AIProvider, ProviderConfig, ProviderResponse, TokenUsage
from app.engine.providers.registry import get_provider_registry
from app.engine.prompts.library import get_prompt_library, PromptTemplate
from app.engine.parsers import OutputParser
from app.engine.cache import get_ai_cache, AICache
from app.engine.queue import AIJobQueue, AIJob, JobStatus, get_job_queue
from app.engine.analytics import UsageTracker, UsageRecord, get_usage_tracker


class AIEngine:
    """Centralized AI engine that powers all AI features.

    Handles: provider management, prompt rendering, generation,
    validation, caching, queuing, streaming, and usage tracking.
    """

    def __init__(self) -> None:
        self.registry = get_provider_registry()
        self.prompts = get_prompt_library()
        self.cache = get_ai_cache()
        self.queue = get_job_queue()
        self.tracker = get_usage_tracker()
        self.parser = OutputParser()

    def _get_provider_config(self, provider_name: str | None = None) -> ProviderConfig:
        from app.core.config import settings
        name = provider_name or settings.AI_PROVIDER

        config_map = {
            "gemini": ProviderConfig(
                api_key=settings.GEMINI_API_KEY,
                model=settings.GEMINI_MODEL,
                temperature=0.7,
                max_tokens=4096,
            ),
        }
        return config_map.get(name, ProviderConfig(api_key="", model=""))

    def _get_provider(self, provider_name: str | None = None) -> AIProvider:
        from app.core.config import settings
        name = provider_name or settings.AI_PROVIDER
        config = self._get_provider_config(name)
        return self.registry.get(name, config)

    async def generate(
        self,
        prompt: str,
        system_instruction: str | None = None,
        temperature: float | None = None,
        max_tokens: int | None = None,
        provider: str | None = None,
        use_cache: bool = True,
        user_id: str | None = None,
        operation: str = "generate",
    ) -> ProviderResponse:
        cache_key = AICache.make_key(prompt, system_instruction, temperature, max_tokens, provider)

        if use_cache:
            cached = self.cache.get(cache_key)
            if cached is not None:
                record = UsageRecord(
                    id=str(uuid.uuid4()),
                    user_id=user_id,
                    provider=cached.get("provider", "unknown"),
                    model=cached.get("model", "unknown"),
                    operation=operation,
                    success=True,
                    cached=True,
                )
                self.tracker.record(record)
                return ProviderResponse(
                    text=cached.get("text", ""),
                    json_data=cached.get("json_data"),
                    tokens=TokenUsage(),
                    provider=cached.get("provider", "cached"),
                    model=cached.get("model", "cached"),
                    latency_ms=0,
                    success=True,
                )

        ai_provider = self._get_provider(provider)
        start = time.time()
        response = await ai_provider.generate(prompt, system_instruction, temperature, max_tokens)
        response.latency_ms = (time.time() - start) * 1000

        record = UsageRecord(
            id=str(uuid.uuid4()),
            user_id=user_id,
            provider=response.provider,
            model=response.model,
            operation=operation,
            prompt_tokens=response.tokens.prompt_tokens,
            completion_tokens=response.tokens.completion_tokens,
            total_tokens=response.tokens.total_tokens,
            estimated_cost=response.tokens.estimated_cost,
            latency_ms=response.latency_ms,
            success=response.success,
            error=response.error,
            cached=False,
        )
        self.tracker.record(record)

        if use_cache and response.success:
            self.cache.set(cache_key, {
                "text": response.text,
                "provider": response.provider,
                "model": response.model,
            })

        return response

    async def generate_image(
        self,
        prompt: str,
        width: int = 1024,
        height: int = 1024,
        provider: str | None = None,
    ) -> tuple[bool, list[str], str]:
        """Generate images using the AI provider.
        Returns (success, list_of_base64_image_data, error_message)."""
        ai_provider = self._get_provider(provider)
        if hasattr(ai_provider, 'generate_image'):
            return await ai_provider.generate_image(prompt, width, height)
        return False, [], f"Provider {ai_provider.name} does not support image generation"

    async def generate_json(
        self,
        prompt: str,
        system_instruction: str | None = None,
        temperature: float | None = None,
        max_tokens: int | None = None,
        provider: str | None = None,
        use_cache: bool = True,
        user_id: str | None = None,
        operation: str = "generate_json",
    ) -> ProviderResponse:
        cache_key = AICache.make_key("json", prompt, system_instruction, temperature, max_tokens, provider)

        if use_cache:
            cached = self.cache.get(cache_key)
            if cached is not None:
                record = UsageRecord(
                    id=str(uuid.uuid4()),
                    user_id=user_id,
                    provider=cached.get("provider", "cached"),
                    model=cached.get("model", "cached"),
                    operation=operation,
                    success=True,
                    cached=True,
                )
                self.tracker.record(record)
                return ProviderResponse(
                    text=cached.get("text", ""),
                    json_data=cached.get("json_data"),
                    tokens=TokenUsage(),
                    provider=cached.get("provider", "cached"),
                    model=cached.get("model", "cached"),
                    latency_ms=0,
                    success=True,
                )

        ai_provider = self._get_provider(provider)
        start = time.time()
        response = await ai_provider.generate_json(prompt, system_instruction, temperature, max_tokens)
        response.latency_ms = (time.time() - start) * 1000

        record = UsageRecord(
            id=str(uuid.uuid4()),
            user_id=user_id,
            provider=response.provider,
            model=response.model,
            operation=operation,
            prompt_tokens=response.tokens.prompt_tokens,
            completion_tokens=response.tokens.completion_tokens,
            total_tokens=response.tokens.total_tokens,
            estimated_cost=response.tokens.estimated_cost,
            latency_ms=response.latency_ms,
            success=response.success,
            error=response.error,
            cached=False,
        )
        self.tracker.record(record)

        if use_cache and response.success:
            self.cache.set(cache_key, {
                "text": response.text,
                "json_data": response.json_data,
                "provider": response.provider,
                "model": response.model,
            })

        return response

    async def generate_stream(
        self,
        prompt: str,
        system_instruction: str | None = None,
        temperature: float | None = None,
        max_tokens: int | None = None,
        provider: str | None = None,
        user_id: str | None = None,
        operation: str = "generate_stream",
    ) -> AsyncIterator[str]:
        ai_provider = self._get_provider(provider)
        async for chunk in ai_provider.generate_stream(prompt, system_instruction, temperature, max_tokens):
            yield chunk

    def submit_job(
        self,
        job_type: str,
        params: dict[str, Any],
        user_id: str | None = None,
    ) -> str:
        job = AIJob(
            id=str(uuid.uuid4()),
            type=job_type,
            params=params,
            user_id=user_id,
        )
        import asyncio
        asyncio.create_task(self.queue.submit(job))
        return job.id

    def get_job(self, job_id: str) -> AIJob | None:
        return self.queue.get_job(job_id)

    def cancel_job(self, job_id: str) -> bool:
        return self.queue.cancel(job_id)

    def list_jobs(self, user_id: str | None = None, status: JobStatus | None = None) -> list[AIJob]:
        return self.queue.list_jobs(user_id, status)

    def render_prompt(self, template_name: str, category: str = "general", **kwargs: Any) -> str:
        template = self.prompts.get(template_name, category)
        if template is None:
            raise ValueError(f"Prompt template not found: {category}/{template_name}")
        errors = template.validate(kwargs)
        if errors:
            raise ValueError(f"Prompt validation failed: {errors}")
        return template.render(**kwargs)

    def get_usage_summary(self, user_id: str | None = None, days: int = 30) -> dict[str, Any]:
        return self.tracker.get_summary(user_id, days)

    def get_daily_usage(self, days: int = 30) -> list[dict[str, Any]]:
        return self.tracker.get_daily_usage(days)

    def get_usage_history(self, user_id: str | None = None, limit: int = 50) -> list[dict[str, Any]]:
        return self.tracker.get_history(user_id, limit)

    def get_cache_stats(self) -> dict[str, Any]:
        return self.cache.stats()

    def clear_cache(self) -> int:
        return self.cache.clear()


_engine: AIEngine | None = None


def get_ai_engine() -> AIEngine:
    global _engine
    if _engine is None:
        _engine = AIEngine()
    return _engine
