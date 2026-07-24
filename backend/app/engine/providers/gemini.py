import base64
import json
import re
import time
from typing import Any

from app.engine.providers.base import (
    AIProvider,
    ProviderConfig,
    ProviderResponse,
    TokenUsage,
)


class GeminiProvider(AIProvider):
    """Google Gemini AI provider."""

    # Pricing per 1M tokens (approximate)
    INPUT_COST_PER_1M = 0.075
    OUTPUT_COST_PER_1M = 0.30

    def __init__(self, config: ProviderConfig) -> None:
        super().__init__(config)
        self._name = "gemini"
        self._client = None

    def _get_client(self, system_instruction: str | None = None):
        import google.generativeai as genai
        genai.configure(api_key=self.config.api_key)
        kwargs: dict[str, Any] = {}
        if system_instruction:
            kwargs["system_instruction"] = system_instruction
        return genai.GenerativeModel(self.config.model, **kwargs)

    def _count_tokens(self, text: str) -> int:
        """Approximate token count (rough: 1 token ≈ 4 chars)."""
        return max(1, len(text) // 4)

    def _estimate_cost(self, tokens: TokenUsage) -> float:
        input_cost = (tokens.prompt_tokens / 1_000_000) * self.INPUT_COST_PER_1M
        output_cost = (tokens.completion_tokens / 1_000_000) * self.OUTPUT_COST_PER_1M
        return round(input_cost + output_cost, 6)

    async def generate(
        self,
        prompt: str,
        system_instruction: str | None = None,
        temperature: float | None = None,
        max_tokens: int | None = None,
    ) -> ProviderResponse:
        start = time.time()
        try:
            client = self._get_client(system_instruction)
            kwargs: dict[str, Any] = {}
            if temperature is not None:
                kwargs["generation_config"] = {"temperature": temperature, "max_tokens": max_tokens or self.config.max_tokens}

            response = await client.generate_content_async(prompt, **kwargs)
            latency = (time.time() - start) * 1000

            prompt_tokens = self._count_tokens(prompt)
            completion_tokens = self._count_tokens(response.text)
            tokens = TokenUsage(
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                total_tokens=prompt_tokens + completion_tokens,
            )
            tokens.estimated_cost = self._estimate_cost(tokens)

            return ProviderResponse(
                text=response.text,
                tokens=tokens,
                provider=self.name,
                model=self.config.model,
                latency_ms=latency,
                success=True,
            )
        except Exception as e:
            latency = (time.time() - start) * 1000
            return ProviderResponse(
                text="",
                tokens=TokenUsage(),
                provider=self.name,
                model=self.config.model,
                latency_ms=latency,
                success=False,
                error=str(e),
            )

    async def generate_image(
        self,
        prompt: str,
        width: int = 1024,
        height: int = 1024,
    ) -> tuple[bool, list[str], str]:
        """Generate images using Pollinations.ai (free, no API key).
        Returns (success, list_of_base64_image_data, error_message)."""
        import asyncio

        def _pollinations_fetch():
            import urllib.parse

            import requests as http_requests
            encoded_prompt = urllib.parse.quote(prompt)
            pollinations_url = (
                f"https://image.pollinations.ai/prompt/{encoded_prompt}"
                f"?width={width}&height={height}&nologo=true&model=flux&enhance=true"
            )
            resp = http_requests.get(pollinations_url, timeout=120, headers={"User-Agent": "BuilderWeb/1.0"})
            resp.raise_for_status()
            return resp.content

        try:
            img_bytes = await asyncio.wait_for(
                asyncio.to_thread(_pollinations_fetch),
                timeout=130,
            )
            img_b64 = base64.b64encode(img_bytes).decode()
            return True, [img_b64], ""
        except Exception as e:
            return False, [], str(e)

    async def generate_json(
        self,
        prompt: str,
        system_instruction: str | None = None,
        temperature: float | None = None,
        max_tokens: int | None = None,
    ) -> ProviderResponse:
        json_instruction = (
            (system_instruction or "")
            + "\n\nIMPORTANT: Return ONLY valid JSON. No markdown, no code blocks, no extra text."
        )

        response = await self.generate(prompt, json_instruction.strip(), temperature, max_tokens)

        if not response.success:
            return response

        cleaned = response.text.strip()
        if cleaned.startswith("```"):
            lines = cleaned.split("\n")
            cleaned = "\n".join(lines[1:-1])

        try:
            parsed = json.loads(cleaned)
            response.json_data = parsed
        except json.JSONDecodeError:
            repaired = self._repair_json(cleaned)
            if repaired is not None:
                response.json_data = repaired
            else:
                response.success = False
                response.error = f"Failed to parse JSON: {cleaned[:200]}"
                response.json_data = None

        return response

    async def generate_stream(
        self,
        prompt: str,
        system_instruction: str | None = None,
        temperature: float | None = None,
        max_tokens: int | None = None,
    ):
        client = self._get_client(system_instruction)
        response = await client.generate_content_async(prompt, stream=True)
        async for chunk in response:
            if chunk.text:
                yield chunk.text

    async def health_check(self) -> bool:
        try:
            response = await self.generate("Say 'ok' in one word.")
            return response.success
        except Exception:
            return False

    def _repair_json(self, text: str) -> dict | list | None:
        """Attempt to repair malformed JSON."""
        repairs = [
            text,
            text.rstrip(","),
            re.sub(r',\s*}', '}', text),
            re.sub(r',\s*]', ']', text),
            '{' + text.split('{', 1)[-1].rsplit('}', 1)[0] + '}',
        ]
        for attempt in repairs:
            try:
                return json.loads(attempt)
            except json.JSONDecodeError:
                continue
        return None
