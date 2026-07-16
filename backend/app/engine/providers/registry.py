from typing import Any

from app.engine.providers.base import AIProvider, ProviderConfig
from app.engine.providers.gemini import GeminiProvider
from app.engine.providers.stubs import (
    OpenAIProvider,
    ClaudeProvider,
    GroqProvider,
    OpenRouterProvider,
    LocalProvider,
)


PROVIDER_MAP: dict[str, type[AIProvider]] = {
    "gemini": GeminiProvider,
    "openai": OpenAIProvider,
    "claude": ClaudeProvider,
    "groq": GroqProvider,
    "openrouter": OpenRouterProvider,
    "local": LocalProvider,
}


class ProviderRegistry:
    """Registry of available AI providers.

    Providers are registered by name and instantiated on demand.
    The UI never knows which provider is being used.
    """

    def __init__(self) -> None:
        self._providers: dict[str, type[AIProvider]] = dict(PROVIDER_MAP)
        self._instances: dict[str, AIProvider] = {}

    def register(self, name: str, provider_class: type[AIProvider]) -> None:
        self._providers[name] = provider_class

    def get(self, name: str, config: ProviderConfig | None = None) -> AIProvider:
        if name in self._instances and config is None:
            return self._instances[name]

        provider_class = self._providers.get(name)
        if provider_class is None:
            raise ValueError(f"Unknown provider: {name}. Available: {list(self._providers.keys())}")

        if config is None:
            config = ProviderConfig()

        provider = provider_class(config)
        if config.api_key:
            self._instances[name] = provider
        return provider

    def list_providers(self) -> list[str]:
        return list(self._providers.keys())

    def is_available(self, name: str) -> bool:
        return name in self._providers


_registry: ProviderRegistry | None = None


def get_provider_registry() -> ProviderRegistry:
    global _registry
    if _registry is None:
        _registry = ProviderRegistry()
    return _registry
