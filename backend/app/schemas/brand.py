from typing import Any

from pydantic import BaseModel


class BrandCreateRequest(BaseModel):
    workspace_id: str
    name: str
    tagline: str | None = None
    industry: str | None = None
    description: str | None = None
    target_audience: str | None = None
    brand_personality: str | None = None
    tone_of_voice: str | None = None
    mission: str | None = None
    vision: str | None = None
    values: list[str] | None = None
    primary_color: str = "#6366F1"
    secondary_color: str = "#4F46E5"
    accent_color: str = "#818CF8"
    typography: str | None = None
    logo_style: str | None = None
    icon_style: str | None = None


class BrandUpdateRequest(BaseModel):
    name: str | None = None
    tagline: str | None = None
    industry: str | None = None
    description: str | None = None
    target_audience: str | None = None
    brand_personality: str | None = None
    tone_of_voice: str | None = None
    mission: str | None = None
    vision: str | None = None
    values: list[str] | None = None
    primary_color: str | None = None
    secondary_color: str | None = None
    accent_color: str | None = None
    typography: str | None = None
    logo_style: str | None = None
    icon_style: str | None = None
    change_summary: str | None = None


class BrandGenerateRequest(BaseModel):
    workspace_id: str
    name: str
    industry: str | None = None
    target_audience: str | None = None
    brand_personality: str | None = None
    tone_of_voice: str | None = None
    description: str | None = None
    language: str = "English"


class BrandGenerateResponse(BaseModel):
    brand_id: str
    name: str
    tagline: str
    brand_summary: str
    tagline_suggestions: list[str]
    mission: str
    vision: str
    values: list[str]
    brand_voice: str
    elevator_pitch: str
    usp: str
    color_palette: dict[str, str]
    font_pairings: list[dict[str, str]]
    icon_suggestions: list[str]
    brand_keywords: list[str]
    brand_guidelines: str
    primary_color: str
    secondary_color: str
    accent_color: str
    provider: str
    latency_ms: float


class BrandAIOptimizeRequest(BaseModel):
    brand_id: str
    action: str
    field: str | None = None
    context: str | None = None


class BrandAIOptimizeResponse(BaseModel):
    field: str
    original: str
    optimized: str
    action: str
    provider: str
    latency_ms: float


class BrandVersionResponse(BaseModel):
    id: str
    brand_id: str
    version_number: int
    data: dict[str, Any]
    change_summary: str | None = None
    created_at: str


class BrandAssetResponse(BaseModel):
    id: str
    brand_id: str
    asset_type: str
    name: str
    url: str | None = None
    data: dict[str, Any] | None = None
    metadata: dict[str, Any] | None = None
    created_at: str


class BrandResponse(BaseModel):
    id: str
    workspace_id: str
    name: str
    slug: str
    tagline: str | None = None
    industry: str | None = None
    description: str | None = None
    target_audience: str | None = None
    brand_personality: str | None = None
    tone_of_voice: str | None = None
    mission: str | None = None
    vision: str | None = None
    values: list[str] | None = None
    primary_color: str
    secondary_color: str
    accent_color: str
    typography: str | None = None
    logo_style: str | None = None
    icon_style: str | None = None
    brand_summary: str | None = None
    tagline_suggestions: list[str] | None = None
    brand_voice: str | None = None
    elevator_pitch: str | None = None
    usp: str | None = None
    color_palette: dict[str, str] | None = None
    font_pairings: list[dict[str, str]] | None = None
    icon_suggestions: list[str] | None = None
    brand_keywords: list[str] | None = None
    brand_guidelines: str | None = None
    current_version: int
    is_favorite: bool
    is_archived: bool
    created_at: str
    updated_at: str


class BrandStatsResponse(BaseModel):
    total: int
    favorites: int
    archived: int
    by_industry: dict[str, int]
