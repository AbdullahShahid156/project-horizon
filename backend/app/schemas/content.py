from typing import Any

from pydantic import BaseModel


class ContentCreateRequest(BaseModel):
    workspace_id: str
    folder_id: str | None = None
    title: str
    content_type: str
    body: dict[str, Any] | None = None
    html_body: str | None = None
    plain_body: str | None = None
    metadata: dict[str, Any] | None = None
    seo_data: dict[str, Any] | None = None
    prompt_data: dict[str, Any] | None = None
    generation_settings: dict[str, Any] | None = None
    tags: list[str] | None = None


class ContentUpdateRequest(BaseModel):
    title: str | None = None
    folder_id: str | None = None
    body: dict[str, Any] | None = None
    html_body: str | None = None
    plain_body: str | None = None
    metadata: dict[str, Any] | None = None
    seo_data: dict[str, Any] | None = None
    status: str | None = None
    tags: list[str] | None = None
    change_summary: str | None = None


class ContentBulkUpdateRequest(BaseModel):
    ids: list[str]
    folder_id: str | None = None
    status: str | None = None
    is_archived: bool | None = None


class ContentRestoreRequest(BaseModel):
    version_number: int


class ContentGenerateRequest(BaseModel):
    workspace_id: str
    content_type: str
    title: str | None = None
    business_name: str | None = None
    product: str | None = None
    industry: str | None = None
    target_audience: str | None = None
    language: str = "English"
    country: str = "US"
    tone: str = "professional"
    content_goal: str = "inform"
    length: str = "medium"
    keywords: list[str] | None = None
    competitors: list[str] | None = None
    call_to_action: str | None = None
    additional_instructions: str | None = None
    system_prompt: str | None = None


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
    tone: str | None = None
    context: str | None = None
    content_type: str | None = None
    keywords: list[str] | None = None


class ContentAIOptimizeResponse(BaseModel):
    original: str
    optimized: str
    action: str
    provider: str
    latency_ms: float


class ContentSEOAnalyzeRequest(BaseModel):
    title: str
    body: str
    meta_title: str | None = None
    meta_description: str | None = None
    keywords: list[str] | None = None
    url: str | None = None


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
    body: dict[str, Any] | None = None
    html_body: str | None = None
    plain_body: str | None = None
    metadata: dict[str, Any] | None = None
    change_summary: str | None = None
    is_auto_save: bool
    created_at: str


class ContentItemResponse(BaseModel):
    id: str
    workspace_id: str
    folder_id: str | None = None
    title: str
    slug: str
    content_type: str
    status: str
    body: dict[str, Any] | None = None
    html_body: str | None = None
    plain_body: str | None = None
    metadata: dict[str, Any] | None = None
    seo_data: dict[str, Any] | None = None
    prompt_data: dict[str, Any] | None = None
    generation_settings: dict[str, Any] | None = None
    current_version: int
    word_count: int
    is_favorite: bool
    is_archived: bool
    tags: list[str] | None = None
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
    parent_id: str | None = None


class ContentFolderResponse(BaseModel):
    id: str
    workspace_id: str
    name: str
    parent_id: str | None = None
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
    description: str | None = None
    content_type: str
    category: str = "general"
    body: dict[str, Any]
    system_prompt: str | None = None
    generation_settings: dict[str, Any] | None = None


class ContentTemplateResponse(BaseModel):
    id: str
    workspace_id: str
    name: str
    slug: str
    description: str | None = None
    content_type: str
    category: str
    body: dict[str, Any]
    system_prompt: str | None = None
    generation_settings: dict[str, Any] | None = None
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
