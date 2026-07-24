from abc import ABC, abstractmethod
from collections.abc import AsyncIterator
from dataclasses import dataclass, field
from typing import Any


@dataclass
class TokenUsage:
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    estimated_cost: float = 0.0

    def add(self, other: "TokenUsage") -> None:
        self.prompt_tokens += other.prompt_tokens
        self.completion_tokens += other.completion_tokens
        self.total_tokens += other.total_tokens
        self.estimated_cost += other.estimated_cost


@dataclass
class ProviderConfig:
    api_key: str = ""
    model: str = ""
    temperature: float = 0.7
    max_tokens: int = 4096
    top_p: float = 1.0
    timeout: float = 60.0
    max_retries: int = 3
    extra: dict[str, Any] = field(default_factory=dict)


@dataclass
class ProviderResponse:
    text: str = ""
    json_data: dict[str, Any] | None = None
    tokens: TokenUsage = field(default_factory=TokenUsage)
    provider: str = ""
    model: str = ""
    latency_ms: float = 0.0
    success: bool = True
    error: str | None = None
    finish_reason: str = "stop"


class AIProvider(ABC):
    """Abstract base class for AI providers.

    Every provider must implement generate() and generate_json().
    The UI never knows which provider is being used.
    """

    def __init__(self, config: ProviderConfig) -> None:
        self.config = config
        self._name: str = "base"

    @property
    def name(self) -> str:
        return self._name

    @abstractmethod
    async def generate(
        self,
        prompt: str,
        system_instruction: str | None = None,
        temperature: float | None = None,
        max_tokens: int | None = None,
    ) -> ProviderResponse:
        """Generate a text response from a prompt."""

    @abstractmethod
    async def generate_json(
        self,
        prompt: str,
        system_instruction: str | None = None,
        temperature: float | None = None,
        max_tokens: int | None = None,
    ) -> ProviderResponse:
        """Generate a structured JSON response from a prompt."""

    async def generate_stream(
        self,
        prompt: str,
        system_instruction: str | None = None,
        temperature: float | None = None,
        max_tokens: int | None = None,
    ) -> AsyncIterator[str]:
        """Generate a streaming text response. Override if supported."""
        response = await self.generate(prompt, system_instruction, temperature, max_tokens)
        yield response.text

    @abstractmethod
    async def health_check(self) -> bool:
        """Check if the provider is available."""

    def _estimate_cost(self, tokens: TokenUsage) -> float:
        """Estimate cost based on token usage. Override per provider."""
        return 0.0
