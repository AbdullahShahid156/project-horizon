from typing import Any, Optional

from pydantic import BaseModel


class GenerateRequest(BaseModel):
    prompt: str
    system_instruction: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    provider: Optional[str] = None
    use_cache: bool = True


class GenerateResponse(BaseModel):
    text: str
    provider: str
    model: str
    latency_ms: float
    tokens: dict[str, Any]
    cached: bool = False


class PromptRenderRequest(BaseModel):
    template_name: str
    category: str = "general"
    variables: dict[str, Any] = {}


class PromptRenderResponse(BaseModel):
    rendered: str
    template_name: str
    category: str
    version: int
    variables_used: list[str]


class PromptTemplateResponse(BaseModel):
    name: str
    category: str
    version: int
    description: str
    variables: list[str]


class JobSubmitRequest(BaseModel):
    type: str
    params: dict[str, Any] = {}


class JobResponse(BaseModel):
    id: str
    type: str
    status: str
    progress: float
    result: Optional[dict[str, Any]] = None
    error: Optional[str] = None
    created_at: float
    started_at: Optional[float] = None
    completed_at: Optional[float] = None


class UsageSummaryResponse(BaseModel):
    total_generations: int
    total_tokens: int
    total_cost: float
    successes: int
    failures: int
    success_rate: float
    cached: int
    cache_rate: float
    avg_latency_ms: float
    providers: dict[str, int]
    models: dict[str, int]
    operations: dict[str, int]


class DailyUsageResponse(BaseModel):
    date: str
    generations: int
    tokens: int
    cost: float
    successes: int
    failures: int
    avg_latency_ms: float


class CacheStatsResponse(BaseModel):
    size: int
    max_size: int
    hits: int
    misses: int
    hit_rate: float


class ProviderInfo(BaseModel):
    name: str
    available: bool
    is_active: bool


class AIEngineStatusResponse(BaseModel):
    providers: list[ProviderInfo]
    active_provider: str
    cache_stats: CacheStatsResponse
    queue_size: int
    total_jobs: int
