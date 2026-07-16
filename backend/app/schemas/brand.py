from typing import Any, Optional
from pydantic import BaseModel


class BrandCreateRequest(BaseModel):
    workspace_id: str
    name: str
    tagline: Optional[str] = None
    industry: Optional[str] = None
    description: Optional[str] = None
    target_audience: Optional[str] = None
    brand_personality: Optional[str] = None
    tone_of_voice: Optional[str] = None
    mission: Optional[str] = None
    vision: Optional[str] = None
    values: Optional[list[str]] = None
    primary_color: str = "#6366F1"
    secondary_color: str = "#4F46E5"
    accent_color: str = "#818CF8"
    typography: Optional[str] = None
    logo_style: Optional[str] = None
    icon_style: Optional[str] = None


class BrandUpdateRequest(BaseModel):
    name: Optional[str] = None
    tagline: Optional[str] = None
    industry: Optional[str] = None
    description: Optional[str] = None
    target_audience: Optional[str] = None
    brand_personality: Optional[str] = None
    tone_of_voice: Optional[str] = None
    mission: Optional[str] = None
    vision: Optional[str] = None
    values: Optional[list[str]] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    accent_color: Optional[str] = None
    typography: Optional[str] = None
    logo_style: Optional[str] = None
    icon_style: Optional[str] = None
    change_summary: Optional[str] = None


class BrandGenerateRequest(BaseModel):
    workspace_id: str
    name: str
    industry: Optional[str] = None
    target_audience: Optional[str] = None
    brand_personality: Optional[str] = None
    tone_of_voice: Optional[str] = None
    description: Optional[str] = None
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
    field: Optional[str] = None
    context: Optional[str] = None


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
    change_summary: Optional[str] = None
    created_at: str


class BrandAssetResponse(BaseModel):
    id: str
    brand_id: str
    asset_type: str
    name: str
    url: Optional[str] = None
    data: Optional[dict[str, Any]] = None
    metadata: Optional[dict[str, Any]] = None
    created_at: str


class BrandResponse(BaseModel):
    id: str
    workspace_id: str
    name: str
    slug: str
    tagline: Optional[str] = None
    industry: Optional[str] = None
    description: Optional[str] = None
    target_audience: Optional[str] = None
    brand_personality: Optional[str] = None
    tone_of_voice: Optional[str] = None
    mission: Optional[str] = None
    vision: Optional[str] = None
    values: Optional[list[str]] = None
    primary_color: str
    secondary_color: str
    accent_color: str
    typography: Optional[str] = None
    logo_style: Optional[str] = None
    icon_style: Optional[str] = None
    brand_summary: Optional[str] = None
    tagline_suggestions: Optional[list[str]] = None
    brand_voice: Optional[str] = None
    elevator_pitch: Optional[str] = None
    usp: Optional[str] = None
    color_palette: Optional[dict[str, str]] = None
    font_pairings: Optional[list[dict[str, str]]] = None
    icon_suggestions: Optional[list[str]] = None
    brand_keywords: Optional[list[str]] = None
    brand_guidelines: Optional[str] = None
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
