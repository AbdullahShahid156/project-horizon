import re
from typing import Any


class PromptTemplate:
    """A versioned prompt template with variable interpolation and conditional blocks."""

    def __init__(
        self,
        name: str,
        template: str,
        category: str = "general",
        version: int = 1,
        description: str = "",
        variables: list[str] | None = None,
    ) -> None:
        self.name = name
        self.template = template
        self.category = category
        self.version = version
        self.description = description
        self.variables = variables or self._extract_variables()

    def _extract_variables(self) -> list[str]:
        return list(set(re.findall(r"\{(\w+)\}", self.template)))

    def render(self, **kwargs: Any) -> str:
        """Render the template with variables. Missing vars become empty strings."""
        result = self.template
        for key, value in kwargs.items():
            result = result.replace("{" + key + "}", str(value))
        result = self._process_conditionals(result, kwargs)
        return result

    def _process_conditionals(self, text: str, vars: dict[str, Any]) -> str:
        """Process {if:var}...{endif} blocks."""
        pattern = r"\{if:(\w+)\}(.*?)\{endif\}"

        def replacer(match: re.Match) -> str:
            var_name = match.group(1)
            content = match.group(2)
            if vars.get(var_name):
                return content
            return ""

        return re.sub(pattern, replacer, text, flags=re.DOTALL)

    def validate(self, data: dict[str, Any]) -> list[str]:
        """Validate that all required variables are present."""
        errors = []
        for var in self.variables:
            if var not in data or not data[var]:
                errors.append(f"Missing required variable: {var}")
        return errors

    def to_dict(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "template": self.template,
            "category": self.category,
            "version": self.version,
            "description": self.description,
            "variables": self.variables,
        }


class PromptLibrary:
    """In-memory prompt library with versioning and categorization."""

    def __init__(self) -> None:
        self._prompts: dict[str, list[PromptTemplate]] = {}
        self._initialize_defaults()

    def _initialize_defaults(self) -> None:
        from app.engine.prompts.defaults import DEFAULT_PROMPTS
        for prompt_data in DEFAULT_PROMPTS:
            template = PromptTemplate(**prompt_data)
            self.register(template)

    def register(self, template: PromptTemplate) -> None:
        key = f"{template.category}/{template.name}"
        if key not in self._prompts:
            self._prompts[key] = []
        existing = [p for p in self._prompts[key] if p.version == template.version]
        if existing:
            self._prompts[key] = [p for p in self._prompts[key] if p.version != template.version]
        self._prompts[key].append(template)

    def get(self, name: str, category: str = "general", version: int | None = None) -> PromptTemplate | None:
        key = f"{category}/{name}"
        templates = self._prompts.get(key, [])
        if not templates:
            return None
        if version is not None:
            for t in templates:
                if t.version == version:
                    return t
        return max(templates, key=lambda t: t.version)

    def list_by_category(self, category: str) -> list[PromptTemplate]:
        result = []
        for key, templates in self._prompts.items():
            if key.startswith(f"{category}/"):
                result.append(max(templates, key=lambda t: t.version))
        return result

    def list_categories(self) -> list[str]:
        categories = set()
        for key in self._prompts:
            cat = key.split("/")[0]
            categories.add(cat)
        return sorted(categories)

    def list_all(self) -> list[PromptTemplate]:
        result = []
        for templates in self._prompts.values():
            result.append(max(templates, key=lambda t: t.version))
        return result

    def get_versions(self, name: str, category: str = "general") -> list[PromptTemplate]:
        key = f"{category}/{name}"
        return sorted(self._prompts.get(key, []), key=lambda t: t.version)

    def delete(self, name: str, category: str = "general") -> bool:
        key = f"{category}/{name}"
        if key in self._prompts:
            del self._prompts[key]
            return True
        return False


_library: PromptLibrary | None = None


def get_prompt_library() -> PromptLibrary:
    global _library
    if _library is None:
        _library = PromptLibrary()
    return _library
