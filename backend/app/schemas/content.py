from typing import Any, Optional

from pydantic import BaseModel, Field


class ContentCreateRequest(BaseModel):
    workspace_id: str
    folder_id: Optional[str] = None
    title: str
    content_type: str
    body: Optional[dict[str, Any]] = None
    html_body: Optional[str] = None
    plain_body: Optional[str] = None
    metadata: Optional[dict[str, Any]] = None
    seo_data: Optional[dict[str, Any]] = None
    prompt_data: Optional[dict[str, Any]] = None
    generation_settings: Optional[dict[str, Any]] = None
    tags: Optional[list[str]] = None


class ContentUpdateRequest(BaseModel):
    title: Optional[str] = None
    folder_id: Optional[str] = None
    body: Optional[dict[str, Any]] = None
    html_body: Optional[str] = None
    plain_body: Optional[str] = None
    metadata: Optional[dict[str, Any]] = None
    seo_data: Optional[dict[str, Any]] = None
    status: Optional[str] = None
    tags: Optional[list[str]] = None
    change_summary: Optional[str] = None


class ContentBulkUpdateRequest(BaseModel):
    ids: list[str]
    folder_id: Optional[str] = None
    status: Optional[str] = None
    is_archived: Optional[bool] = None


class ContentRestoreRequest(BaseModel):
    version_number: int


class ContentGenerateRequest(BaseModel):
    workspace_id: str
    content_type: str
    title: Optional[str] = None
    business_name: Optional[str] = None
    product: Optional[str] = None
    industry: Optional[str] = None
    target_audience: Optional[str] = None
    language: str = "English"
    country: str = "US"
    tone: str = "professional"
    content_goal: str = "inform"
    length: str = "medium"
    keywords: Optional[list[str]] = None
    competitors: Optional[list[str]] = None
    call_to_action: Optional[str] = None
    additional_instructions: Optional[str] = None
    system_prompt: Optional[str] = None


class ContentGenerateResponse(BaseModel):
    content_id: str
    title: str
    body: dict[str, Any]
    html_body: str
    plain_body: str
    word_count: int
    seo_data: dict[str, Any]
    provider: str
    model: str
    latency_ms: float
    tokens: dict[str, Any]


class ContentAIOptimizeRequest(BaseModel):
    text: str
    action: str
    tone: Optional[str] = None
    context: Optional[str] = None
    content_type: Optional[str] = None
    keywords: Optional[list[str]] = None


class ContentAIOptimizeResponse(BaseModel):
    original: str
    optimized: str
    action: str
    provider: str
    latency_ms: float


class ContentSEOAnalyzeRequest(BaseModel):
    title: str
    body: str
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    keywords: Optional[list[str]] = None
    url: Optional[str] = None


class ContentSEOAnalysis(BaseModel):
    score: int
    issues: list[dict[str, Any]]
    keyword_density: dict[str, float]
    readability: dict[str, Any]
    heading_analysis: dict[str, Any]
    links: dict[str, Any] = {}
    suggestions: list[str]


class ContentVersionResponse(BaseModel):
    id: str
    version_number: int
    title: str
    body: Optional[dict[str, Any]] = None
    html_body: Optional[str] = None
    plain_body: Optional[str] = None
    metadata: Optional[dict[str, Any]] = None
    change_summary: Optional[str] = None
    is_auto_save: bool
    created_at: str


class ContentItemResponse(BaseModel):
    id: str
    workspace_id: str
    folder_id: Optional[str] = None
    title: str
    slug: str
    content_type: str
    status: str
    body: Optional[dict[str, Any]] = None
    html_body: Optional[str] = None
    plain_body: Optional[str] = None
    metadata: Optional[dict[str, Any]] = None
    seo_data: Optional[dict[str, Any]] = None
    prompt_data: Optional[dict[str, Any]] = None
    generation_settings: Optional[dict[str, Any]] = None
    current_version: int
    word_count: int
    is_favorite: bool
    is_archived: bool
    tags: Optional[list[str]] = None
    created_at: str
    updated_at: str


class ContentListResponse(BaseModel):
    items: list[ContentItemResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class ContentFolderCreateRequest(BaseModel):
    workspace_id: str
    name: str
    parent_id: Optional[str] = None


class ContentFolderResponse(BaseModel):
    id: str
    workspace_id: str
    name: str
    parent_id: Optional[str] = None
    item_count: int = 0
    created_at: str
    updated_at: str


class ContentTagCreateRequest(BaseModel):
    workspace_id: str
    name: str
    color: str = "#6366F1"


class ContentTagResponse(BaseModel):
    id: str
    workspace_id: str
    name: str
    color: str
    item_count: int = 0
    created_at: str


class ContentTemplateCreateRequest(BaseModel):
    workspace_id: str
    name: str
    description: Optional[str] = None
    content_type: str
    category: str = "general"
    body: dict[str, Any]
    system_prompt: Optional[str] = None
    generation_settings: Optional[dict[str, Any]] = None


class ContentTemplateResponse(BaseModel):
    id: str
    workspace_id: str
    name: str
    slug: str
    description: Optional[str] = None
    content_type: str
    category: str
    body: dict[str, Any]
    system_prompt: Optional[str] = None
    generation_settings: Optional[dict[str, Any]] = None
    is_shared: bool
    is_favorite: bool
    use_count: int
    created_at: str
    updated_at: str


class ContentExportRequest(BaseModel):
    format: str = "html"
    content: str = ""
    item_id: str | None = None


class ContentExportResponse(BaseModel):
    content: str
    format: str
    filename: str


class ContentStatsResponse(BaseModel):
    total: int
    drafts: int
    published: int
    archived: int
    favorites: int
    by_type: dict[str, int]
    by_status: dict[str, int]
