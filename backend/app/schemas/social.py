from typing import Any, Optional
from pydantic import BaseModel


class SocialPostCreateRequest(BaseModel):
    workspace_id: str
    campaign_id: Optional[str] = None
    platform: str
    post_type: str = "single"
    content: str
    headline: Optional[str] = None
    caption: Optional[str] = None
    hashtags: Optional[list[str]] = None
    cta: Optional[str] = None
    emojis: Optional[list[str]] = None
    image_ids: Optional[list[str]] = None
    carousel_content: Optional[list[dict[str, Any]]] = None
    story_content: Optional[dict[str, Any]] = None
    reel_script: Optional[str] = None
    poll_ideas: Optional[list[str]] = None
    business: Optional[str] = None
    brand: Optional[str] = None
    target_audience: Optional[str] = None
    goal: Optional[str] = None
    tone: Optional[str] = None
    keywords: Optional[list[str]] = None
    scheduled_date: Optional[str] = None


class SocialPostUpdateRequest(BaseModel):
    content: Optional[str] = None
    headline: Optional[str] = None
    caption: Optional[str] = None
    hashtags: Optional[list[str]] = None
    cta: Optional[str] = None
    emojis: Optional[list[str]] = None
    image_ids: Optional[list[str]] = None
    status: Optional[str] = None
    scheduled_date: Optional[str] = None


class SocialGenerateRequest(BaseModel):
    workspace_id: str
    platform: str
    post_type: str = "single"
    business: Optional[str] = None
    brand: Optional[str] = None
    campaign_id: Optional[str] = None
    target_audience: Optional[str] = None
    goal: Optional[str] = None
    tone: Optional[str] = None
    keywords: Optional[list[str]] = None
    cta: Optional[str] = None
    topic: Optional[str] = None
    num_variations: int = 1


class SocialAIRequest(BaseModel):
    post_id: str
    action: str
    context: Optional[str] = None


class SocialAIResponse(BaseModel):
    post_id: str
    content: str
    action: str
    provider: str
    latency_ms: float


class SocialGenerateResponse(BaseModel):
    posts: list[dict[str, Any]]
    provider: str
    latency_ms: float


class SocialCampaignCreateRequest(BaseModel):
    workspace_id: str
    name: str
    description: Optional[str] = None
    platforms: Optional[list[str]] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    target_audience: Optional[str] = None
    goals: Optional[list[str]] = None


class SocialCalendarEntryRequest(BaseModel):
    workspace_id: str
    post_id: Optional[str] = None
    date: str
    platform: str
    status: str = "draft"
    notes: Optional[str] = None


class SocialPostResponse(BaseModel):
    id: str
    workspace_id: str
    campaign_id: Optional[str] = None
    platform: str
    post_type: str
    content: str
    headline: Optional[str] = None
    caption: Optional[str] = None
    hashtags: Optional[list[str]] = None
    cta: Optional[str] = None
    emojis: Optional[list[str]] = None
    image_suggestions: Optional[list[str]] = None
    image_ids: Optional[list[str]] = None
    carousel_content: Optional[list[dict[str, Any]]] = None
    story_content: Optional[dict[str, Any]] = None
    reel_script: Optional[str] = None
    poll_ideas: Optional[list[str]] = None
    business: Optional[str] = None
    brand: Optional[str] = None
    target_audience: Optional[str] = None
    goal: Optional[str] = None
    tone: Optional[str] = None
    keywords: Optional[list[str]] = None
    status: str
    scheduled_date: Optional[str] = None
    published_at: Optional[str] = None
    performance_score: Optional[float] = None
    ai_generated: bool
    ai_provider: Optional[str] = None
    ai_latency_ms: Optional[float] = None
    created_at: str
    updated_at: str


class SocialCampaignResponse(BaseModel):
    id: str
    workspace_id: str
    name: str
    description: Optional[str] = None
    platforms: Optional[list[str]] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    status: str
    target_audience: Optional[str] = None
    goals: Optional[list[str]] = None
    post_count: int = 0
    created_at: str
    updated_at: str


class SocialCalendarResponse(BaseModel):
    id: str
    workspace_id: str
    post_id: Optional[str] = None
    date: str
    platform: str
    status: str
    notes: Optional[str] = None
    created_at: str
    updated_at: str


class SocialStatsResponse(BaseModel):
    total_posts: int
    by_platform: dict[str, int]
    by_status: dict[str, int]
    by_type: dict[str, int]
    ai_generated_count: int
    avg_performance_score: float
    total_campaigns: int
