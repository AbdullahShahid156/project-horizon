from typing import Any, Optional
from pydantic import BaseModel


class EmailCampaignCreateRequest(BaseModel):
    workspace_id: str
    name: str
    subject: str
    preview_text: Optional[str] = None
    email_type: str = "promotional"
    html_content: Optional[str] = None
    markdown_content: Optional[str] = None
    json_content: Optional[dict[str, Any]] = None
    brand: Optional[str] = None
    audience: Optional[str] = None
    goal: Optional[str] = None
    tone: Optional[str] = None
    language: str = "English"
    cta: Optional[str] = None
    product: Optional[str] = None
    keywords: Optional[list[str]] = None
    template_id: Optional[str] = None


class EmailCampaignUpdateRequest(BaseModel):
    name: Optional[str] = None
    subject: Optional[str] = None
    preview_text: Optional[str] = None
    html_content: Optional[str] = None
    markdown_content: Optional[str] = None
    json_content: Optional[dict[str, Any]] = None
    status: Optional[str] = None


class EmailGenerateRequest(BaseModel):
    workspace_id: str
    email_type: str
    brand: Optional[str] = None
    campaign_name: Optional[str] = None
    audience: Optional[str] = None
    goal: Optional[str] = None
    tone: Optional[str] = None
    language: str = "English"
    cta: Optional[str] = None
    product: Optional[str] = None
    keywords: Optional[list[str]] = None
    context: Optional[str] = None
    num_variations: int = 1


class EmailAIRequest(BaseModel):
    campaign_id: str
    action: str
    context: Optional[str] = None


class EmailTemplateCreateRequest(BaseModel):
    workspace_id: str
    name: str
    description: Optional[str] = None
    category: str = "business"
    email_type: str
    subject: str
    preview_text: Optional[str] = None
    html_content: str
    markdown_content: Optional[str] = None
    variables: Optional[list[str]] = None


class EmailCampaignResponse(BaseModel):
    id: str
    workspace_id: str
    name: str
    subject: str
    preview_text: Optional[str] = None
    email_type: str
    html_content: Optional[str] = None
    markdown_content: Optional[str] = None
    plain_text: Optional[str] = None
    json_content: Optional[dict[str, Any]] = None
    brand: Optional[str] = None
    audience: Optional[str] = None
    goal: Optional[str] = None
    tone: Optional[str] = None
    language: str
    cta: Optional[str] = None
    product: Optional[str] = None
    keywords: Optional[list[str]] = None
    template_id: Optional[str] = None
    status: str
    sent_at: Optional[str] = None
    open_rate: Optional[float] = None
    click_rate: Optional[float] = None
    unsubscribe_rate: Optional[float] = None
    recipient_count: int
    ai_generated: bool
    ai_provider: Optional[str] = None
    ai_latency_ms: Optional[float] = None
    created_at: str
    updated_at: str


class EmailTemplateResponse(BaseModel):
    id: str
    workspace_id: str
    name: str
    description: Optional[str] = None
    category: str
    email_type: str
    subject: str
    preview_text: Optional[str] = None
    html_content: str
    markdown_content: Optional[str] = None
    json_content: Optional[dict[str, Any]] = None
    variables: Optional[list[str]] = None
    thumbnail_url: Optional[str] = None
    is_system: bool
    usage_count: int
    created_at: str
    updated_at: str


class EmailHistoryResponse(BaseModel):
    id: str
    campaign_id: str
    action: str
    content_before: Optional[str] = None
    content_after: Optional[str] = None
    ai_provider: Optional[str] = None
    latency_ms: Optional[float] = None
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
