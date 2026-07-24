from typing import Any

from pydantic import BaseModel


class EmailCampaignCreateRequest(BaseModel):
    workspace_id: str
    name: str
    subject: str
    preview_text: str | None = None
    email_type: str = "promotional"
    html_content: str | None = None
    markdown_content: str | None = None
    json_content: dict[str, Any] | None = None
    brand: str | None = None
    audience: str | None = None
    goal: str | None = None
    tone: str | None = None
    language: str = "English"
    cta: str | None = None
    product: str | None = None
    keywords: list[str] | None = None
    template_id: str | None = None


class EmailCampaignUpdateRequest(BaseModel):
    name: str | None = None
    subject: str | None = None
    preview_text: str | None = None
    html_content: str | None = None
    markdown_content: str | None = None
    json_content: dict[str, Any] | None = None
    status: str | None = None


class EmailGenerateRequest(BaseModel):
    workspace_id: str
    email_type: str
    brand: str | None = None
    campaign_name: str | None = None
    audience: str | None = None
    goal: str | None = None
    tone: str | None = None
    language: str = "English"
    cta: str | None = None
    product: str | None = None
    keywords: list[str] | None = None
    context: str | None = None
    num_variations: int = 1


class EmailAIRequest(BaseModel):
    campaign_id: str
    action: str
    context: str | None = None


class EmailTemplateCreateRequest(BaseModel):
    workspace_id: str
    name: str
    description: str | None = None
    category: str = "business"
    email_type: str
    subject: str
    preview_text: str | None = None
    html_content: str
    markdown_content: str | None = None
    variables: list[str] | None = None


class EmailCampaignResponse(BaseModel):
    id: str
    workspace_id: str
    name: str
    subject: str
    preview_text: str | None = None
    email_type: str
    html_content: str | None = None
    markdown_content: str | None = None
    plain_text: str | None = None
    json_content: dict[str, Any] | None = None
    brand: str | None = None
    audience: str | None = None
    goal: str | None = None
    tone: str | None = None
    language: str
    cta: str | None = None
    product: str | None = None
    keywords: list[str] | None = None
    template_id: str | None = None
    status: str
    sent_at: str | None = None
    open_rate: float | None = None
    click_rate: float | None = None
    unsubscribe_rate: float | None = None
    recipient_count: int
    ai_generated: bool
    ai_provider: str | None = None
    ai_latency_ms: float | None = None
    created_at: str
    updated_at: str


class EmailTemplateResponse(BaseModel):
    id: str
    workspace_id: str
    name: str
    description: str | None = None
    category: str
    email_type: str
    subject: str
    preview_text: str | None = None
    html_content: str
    markdown_content: str | None = None
    json_content: dict[str, Any] | None = None
    variables: list[str] | None = None
    thumbnail_url: str | None = None
    is_system: bool
    usage_count: int
    created_at: str
    updated_at: str


class EmailHistoryResponse(BaseModel):
    id: str
    campaign_id: str
    action: str
    content_before: str | None = None
    content_after: str | None = None
    ai_provider: str | None = None
    latency_ms: float | None = None
    created_at: str


class EmailStatsResponse(BaseModel):
    total_campaigns: int
    by_type: dict[str, int]
    by_status: dict[str, int]
    ai_generated_count: int
    total_templates: int
    avg_open_rate: float
    avg_click_rate: float
    total_recipients: int


class EmailGenerateResponse(BaseModel):
    campaigns: list[EmailCampaignResponse]
    provider: str
    latency_ms: float


class EmailAIResponse(BaseModel):
    campaign_id: str
    field: str
    original: str
    updated: str
    action: str
    provider: str
    latency_ms: float
