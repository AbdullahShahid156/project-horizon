from typing import Any

from pydantic import BaseModel


class SocialPostCreateRequest(BaseModel):
    workspace_id: str
    campaign_id: str | None = None
    platform: str
    post_type: str = "single"
    content: str
    headline: str | None = None
    caption: str | None = None
    hashtags: list[str] | None = None
    cta: str | None = None
    emojis: list[str] | None = None
    image_ids: list[str] | None = None
    carousel_content: list[dict[str, Any]] | None = None
    story_content: dict[str, Any] | None = None
    reel_script: str | None = None
    poll_ideas: list[str] | None = None
    business: str | None = None
    brand: str | None = None
    target_audience: str | None = None
    goal: str | None = None
    tone: str | None = None
    keywords: list[str] | None = None
    scheduled_date: str | None = None


class SocialPostUpdateRequest(BaseModel):
    content: str | None = None
    headline: str | None = None
    caption: str | None = None
    hashtags: list[str] | None = None
    cta: str | None = None
    emojis: list[str] | None = None
    image_ids: list[str] | None = None
    status: str | None = None
    scheduled_date: str | None = None


class SocialGenerateRequest(BaseModel):
    workspace_id: str
    platform: str
    post_type: str = "single"
    business: str | None = None
    brand: str | None = None
    campaign_id: str | None = None
    target_audience: str | None = None
    goal: str | None = None
    tone: str | None = None
    keywords: list[str] | None = None
    cta: str | None = None
    topic: str | None = None
    num_variations: int = 1


class SocialAIRequest(BaseModel):
    post_id: str
    action: str
    context: str | None = None


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
    description: str | None = None
    platforms: list[str] | None = None
    start_date: str | None = None
    end_date: str | None = None
    target_audience: str | None = None
    goals: list[str] | None = None


class SocialCalendarEntryRequest(BaseModel):
    workspace_id: str
    post_id: str | None = None
    date: str
    platform: str
    status: str = "draft"
    notes: str | None = None


class SocialPostResponse(BaseModel):
    id: str
    workspace_id: str
    campaign_id: str | None = None
    platform: str
    post_type: str
    content: str
    headline: str | None = None
    caption: str | None = None
    hashtags: list[str] | None = None
    cta: str | None = None
    emojis: list[str] | None = None
    image_suggestions: list[str] | None = None
    image_ids: list[str] | None = None
    carousel_content: list[dict[str, Any]] | None = None
    story_content: dict[str, Any] | None = None
    reel_script: str | None = None
    poll_ideas: list[str] | None = None
    business: str | None = None
    brand: str | None = None
    target_audience: str | None = None
    goal: str | None = None
    tone: str | None = None
    keywords: list[str] | None = None
    status: str
    scheduled_date: str | None = None
    published_at: str | None = None
    performance_score: float | None = None
    ai_generated: bool
    ai_provider: str | None = None
    ai_latency_ms: float | None = None
    created_at: str
    updated_at: str


class SocialCampaignResponse(BaseModel):
    id: str
    workspace_id: str
    name: str
    description: str | None = None
    platforms: list[str] | None = None
    start_date: str | None = None
    end_date: str | None = None
    status: str
    target_audience: str | None = None
    goals: list[str] | None = None
    post_count: int = 0
    created_at: str
    updated_at: str


class SocialCalendarResponse(BaseModel):
    id: str
    workspace_id: str
    post_id: str | None = None
    date: str
    platform: str
    status: str
    notes: str | None = None
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
