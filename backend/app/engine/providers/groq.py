import json
import re
import time

import httpx

from app.engine.providers.base import (
    AIProvider,
    ProviderConfig,
    ProviderResponse,
    TokenUsage,
)


class GroqProvider(AIProvider):
    """Groq AI provider — OpenAI-compatible API, free tier, very fast."""

    API_BASE = "https://api.groq.com/openai/v1"
    INPUT_COST_PER_1M = 0.0
    OUTPUT_COST_PER_1M = 0.0

    def __init__(self, config: ProviderConfig) -> None:
        super().__init__(config)
        self._name = "groq"

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.config.api_key}",
            "Content-Type": "application/json",
        }

    def _estimate_cost(self, tokens: TokenUsage) -> float:
        input_cost = (tokens.prompt_tokens / 1_000_000) * self.INPUT_COST_PER_1M
        output_cost = (tokens.completion_tokens / 1_000_000) * self.OUTPUT_COST_PER_1M
        return round(input_cost + output_cost, 6)

    def _count_tokens(self, text: str) -> int:
        return max(1, len(text) // 4)

    def _build_messages(
        self, prompt: str, system_instruction: str | None = None
    ) -> list[dict[str, str]]:
        messages: list[dict[str, str]] = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": prompt})
        return messages

    async def generate(
        self,
        prompt: str,
        system_instruction: str | None = None,
        temperature: float | None = None,
        max_tokens: int | None = None,
    ) -> ProviderResponse:
        start = time.time()
        try:
            messages = self._build_messages(prompt, system_instruction)
            payload: dict = {
                "model": self.config.model,
                "messages": messages,
                "temperature": temperature if temperature is not None else self.config.temperature,
                "max_tokens": max_tokens or self.config.max_tokens,
            }

            async with httpx.AsyncClient(timeout=self.config.timeout) as client:
                resp = await client.post(
                    f"{self.API_BASE}/chat/completions",
                    headers=self._headers(),
                    json=payload,
                )
                resp.raise_for_status()
                data = resp.json()

            latency = (time.time() - start) * 1000
            choice = data["choices"][0]
            text = choice["message"]["content"]
            usage = data.get("usage", {})

            tokens = TokenUsage(
                prompt_tokens=usage.get("prompt_tokens", self._count_tokens(prompt)),
                completion_tokens=usage.get("completion_tokens", self._count_tokens(text)),
                total_tokens=usage.get("total_tokens", 0),
            )
            tokens.total_tokens = tokens.prompt_tokens + tokens.completion_tokens
            tokens.estimated_cost = self._estimate_cost(tokens)

            return ProviderResponse(
                text=text,
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

    async def health_check(self) -> bool:
        try:
            response = await self.generate("Say 'ok' in one word.")
            return response.success
        except Exception:
            return False

    def _repair_json(self, text: str) -> dict | list | None:
        repairs = [
            text,
            text.rstrip(","),
            re.sub(r",\s*}", "}", text),
            re.sub(r",\s*]", "]", text),
            "{" + text.split("{", 1)[-1].rsplit("}", 1)[0] + "}",
        ]
        for attempt in repairs:
            try:
                return json.loads(attempt)
            except json.JSONDecodeError:
                continue
        return None
