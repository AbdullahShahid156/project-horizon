from typing import Any

from pydantic import BaseModel


class SEODomainCreateRequest(BaseModel):
    workspace_id: str
    url: str
    name: str


class SEODomainResponse(BaseModel):
    id: str
    workspace_id: str
    url: str
    name: str
    health_score: int
    technical_score: int
    content_score: int
    last_audited_at: str | None = None
    created_at: str
    updated_at: str


class SEOAuditRequest(BaseModel):
    domain_id: str
    url: str
    depth: str = "standard"


class SEOAuditResponse(BaseModel):
    id: str
    domain_id: str
    url: str
    status: str
    overall_score: int
    technical_score: int
    content_score: int
    on_page_score: int
    off_page_score: int
    issues: dict[str, Any] | None = None
    recommendations: dict[str, Any] | None = None
    metrics: dict[str, Any] | None = None
    created_at: str


class SEOAuditPageResponse(BaseModel):
    id: str
    audit_id: str
    url: str
    status_code: int | None = None
    title: str | None = None
    meta_description: str | None = None
    h1: str | None = None
    word_count: int
    internal_links: int
    external_links: int
    images_without_alt: int
    issues: dict[str, Any] | None = None
    score: int
    created_at: str


class SEOKeywordCreateRequest(BaseModel):
    domain_id: str
    keyword: str
    keyword_type: str = "primary"
    cluster_id: str | None = None
    is_tracked: bool = True


class SEOKeywordResponse(BaseModel):
    id: str
    domain_id: str
    keyword: str
    search_volume: int
    difficulty: int
    cpc: float
    intent: str
    keyword_type: str
    cluster_id: str | None = None
    position: int | None = None
    url: str | None = None
    is_tracked: bool
    created_at: str
    updated_at: str


class SEOKeywordGenerateRequest(BaseModel):
    domain_id: str
    seed_keywords: list[str]
    industry: str | None = None
    target_audience: str | None = None
    language: str = "English"
    count: int = 20


class SEOKeywordClusterResponse(BaseModel):
    id: str
    domain_id: str
    name: str
    description: str | None = None
    pillar_keyword: str | None = None
    keyword_count: int
    avg_volume: int
    created_at: str


class SEOKeywordClusterCreateRequest(BaseModel):
    domain_id: str
    name: str
    description: str | None = None
    pillar_keyword: str | None = None


class SEOOnPageRequest(BaseModel):
    url: str
    title: str | None = None
    meta_description: str | None = None
    headings: list[dict[str, str]] | None = None
    body: str | None = None
    images: list[dict[str, str]] | None = None
    keywords: list[str] | None = None


class SEOOnPageResponse(BaseModel):
    meta_title: str
    meta_description: str
    slug: str
    canonical: str
    og_title: str
    og_description: str
    og_image: str
    twitter_title: str
    twitter_description: str
    heading_structure: dict[str, str]
    image_alt_tags: list[dict[str, str]]
    recommendations: list[dict[str, Any]]
    score: int


class SEOTechnicalRequest(BaseModel):
    url: str
    check_links: bool = True
    check_meta: bool = True
    check_headings: bool = True
    check_images: bool = True


class SEOTechnicalIssue(BaseModel):
    type: str
    severity: str
    message: str
    url: str | None = None
    recommendation: str


class SEOTechnicalResponse(BaseModel):
    score: int
    issues: list[SEOTechnicalIssue]
    metrics: dict[str, Any]
    crawlable: bool
    robots_txt: bool
    sitemap: bool
    canonical: bool
    mixed_content: bool
    redirect_chain: bool


class SEOContentOptimizeRequest(BaseModel):
    url: str | None = None
    title: str
    body: str
    target_keywords: list[str]
    content_type: str = "article"


class SEOContentOptimizeResponse(BaseModel):
    score: int
    issues: list[dict[str, Any]]
    keyword_density: dict[str, float]
    readability: dict[str, Any]
    suggestions: list[str]
    optimized_title: str
    optimized_meta: str
    heading_suggestions: list[str]
    faq_suggestions: list[dict[str, str]]


class SEOSchemaCreateRequest(BaseModel):
    domain_id: str
    schema_type: str
    name: str
    url: str | None = None
    data: dict[str, Any]


class SEOSchemaResponse(BaseModel):
    id: str
    domain_id: str
    schema_type: str
    name: str
    json_ld: dict[str, Any]
    url: str | None = None
    is_active: bool
    created_at: str
    updated_at: str


class SEOInternalLinkResponse(BaseModel):
    id: str
    source_url: str
    target_url: str
    anchor_text: str | None = None
    suggestion_type: str
    is_implemented: bool
    created_at: str


class SEOInternalLinkSuggestRequest(BaseModel):
    domain_id: str
    url: str
    content: str | None = None
    max_suggestions: int = 10


class SEOReportCreateRequest(BaseModel):
    domain_id: str
    title: str
    report_type: str = "full"


class SEOReportResponse(BaseModel):
    id: str
    domain_id: str
    title: str
    report_type: str
    status: str
    summary: dict[str, Any] | None = None
    score: int
    issues_count: int
    recommendations_count: int
    file_url: str | None = None
    created_at: str
    completed_at: str | None = None


class SEORecommendationResponse(BaseModel):
    id: str
    domain_id: str
    category: str
    priority: str
    title: str
    description: str | None = None
    impact: str | None = None
    effort: str | None = None
    status: str
    url: str | None = None
    created_at: str


class SEOCompetitorCreateRequest(BaseModel):
    domain_id: str
    competitor_url: str
    competitor_name: str
    notes: str | None = None


class SEOCompetitorResponse(BaseModel):
    id: str
    domain_id: str
    competitor_url: str
    competitor_name: str
    notes: str | None = None
    analysis: dict[str, Any] | None = None
    created_at: str
    updated_at: str


class SEOCompetitorAnalyzeRequest(BaseModel):
    domain_url: str
    competitor_url: str
    industry: str | None = None


class SEOCompetitorAnalysis(BaseModel):
    strengths: list[str]
    weaknesses: list[str]
    keyword_opportunities: list[str]
    content_gaps: list[str]
    overall_comparison: str


class SEOHistoryResponse(BaseModel):
    id: str
    domain_id: str
    event_type: str
    data: dict[str, Any] | None = None
    score: int | None = None
    created_at: str


class SEOExportRequest(BaseModel):
    format: str = "pdf"


class SEOExportResponse(BaseModel):
    content: str
    format: str
    filename: str


class SEOAISuggestRequest(BaseModel):
    action: str
    context: str
    keywords: list[str] | None = None
    content_type: str | None = None
    language: str = "English"


class SEOAISuggestResponse(BaseModel):
    suggestions: list[dict[str, Any]]
    action: str
    provider: str
    latency_ms: float


class SEODashboardResponse(BaseModel):
    health_score: int
    technical_score: int
    content_score: int
    keyword_coverage: int
    broken_links: int
    missing_meta_tags: int
    schema_coverage: int
    indexability: int
    issues_summary: dict[str, int]
    total_keywords: int
    total_pages: int
    total_audits: int
