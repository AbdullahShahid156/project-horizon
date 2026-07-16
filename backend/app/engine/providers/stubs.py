from app.engine.providers.base import AIProvider, ProviderConfig


class OpenAIProvider(AIProvider):
    """OpenAI provider (future-ready stub)."""

    def __init__(self, config: ProviderConfig) -> None:
        super().__init__(config)
        self._name = "openai"

    async def generate(self, prompt, system_instruction=None, temperature=None, max_tokens=None):
        raise NotImplementedError("OpenAI provider not yet implemented")

    async def generate_json(self, prompt, system_instruction=None, temperature=None, max_tokens=None):
        raise NotImplementedError("OpenAI provider not yet implemented")

    async def health_check(self):
        return False


class ClaudeProvider(AIProvider):
    """Anthropic Claude provider (future-ready stub)."""

    def __init__(self, config: ProviderConfig) -> None:
        super().__init__(config)
        self._name = "claude"

    async def generate(self, prompt, system_instruction=None, temperature=None, max_tokens=None):
        raise NotImplementedError("Claude provider not yet implemented")

    async def generate_json(self, prompt, system_instruction=None, temperature=None, max_tokens=None):
        raise NotImplementedError("Claude provider not yet implemented")

    async def health_check(self):
        return False


class GroqProvider(AIProvider):
    """Groq provider (future-ready stub)."""

    def __init__(self, config: ProviderConfig) -> None:
        super().__init__(config)
        self._name = "groq"

    async def generate(self, prompt, system_instruction=None, temperature=None, max_tokens=None):
        raise NotImplementedError("Groq provider not yet implemented")

    async def generate_json(self, prompt, system_instruction=None, temperature=None, max_tokens=None):
        raise NotImplementedError("Groq provider not yet implemented")

    async def health_check(self):
        return False


class OpenRouterProvider(AIProvider):
    """OpenRouter provider (future-ready stub)."""

    def __init__(self, config: ProviderConfig) -> None:
        super().__init__(config)
        self._name = "openrouter"

    async def generate(self, prompt, system_instruction=None, temperature=None, max_tokens=None):
        raise NotImplementedError("OpenRouter provider not yet implemented")

    async def generate_json(self, prompt, system_instruction=None, temperature=None, max_tokens=None):
        raise NotImplementedError("OpenRouter provider not yet implemented")

    async def health_check(self):
        return False


class LocalProvider(AIProvider):
    """Local model provider (future-ready stub)."""

    def __init__(self, config: ProviderConfig) -> None:
        super().__init__(config)
        self._name = "local"

    async def generate(self, prompt, system_instruction=None, temperature=None, max_tokens=None):
        raise NotImplementedError("Local provider not yet implemented")

    async def generate_json(self, prompt, system_instruction=None, temperature=None, max_tokens=None):
        raise NotImplementedError("Local provider not yet implemented")

    async def health_check(self):
        return False
