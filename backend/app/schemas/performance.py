from typing import Any

from pydantic import BaseModel


class PerformanceAuditRequest(BaseModel):
    project_id: str
    url: str


class CoreWebVitalsResponse(BaseModel):
    id: str
    audit_id: str
    url: str
    lcp: float
    lcp_status: str
    inp: float
    inp_status: str
    cls: float
    cls_status: str
    fcp: float
    fcp_status: str
    ttfb: float
    ttfb_status: str
    speed_index: float
    speed_index_status: str
    tbt: float
    tbt_status: str
    created_at: str


class PerformanceAuditResponse(BaseModel):
    id: str
    project_id: str
    url: str
    status: str
    overall_score: int
    performance_score: int
    accessibility_score: int
    best_practices_score: int
    seo_score: int
    metrics: dict[str, Any] | None = None
    issues: dict[str, Any] | None = None
    recommendations: dict[str, Any] | None = None
    resources: dict[str, Any] | None = None
    created_at: str
    completed_at: str | None = None


class PerformanceRecommendationResponse(BaseModel):
    id: str
    audit_id: str
    category: str
    priority: str
    title: str
    problem: str | None = None
    impact: str | None = None
    estimated_improvement: str | None = None
    implementation_guide: str | None = None
    status: str
    created_at: str


class OptimizationHistoryResponse(BaseModel):
    id: str
    project_id: str
    event_type: str
    data: dict[str, Any] | None = None
    score_before: int | None = None
    score_after: int | None = None
    created_at: str


class PerformanceReportCreateRequest(BaseModel):
    project_id: str
    title: str


class PerformanceReportResponse(BaseModel):
    id: str
    project_id: str
    title: str
    status: str
    summary: dict[str, Any] | None = None
    score: int
    file_url: str | None = None
    created_at: str
    completed_at: str | None = None


class ImageAuditResponse(BaseModel):
    id: str
    audit_id: str
    url: str
    original_size: int
    optimized_size: int | None = None
    format: str
    recommended_format: str | None = None
    width: int | None = None
    height: int | None = None
    has_lazy_loading: bool
    has_alt_text: bool
    issues: dict[str, Any] | None = None
    savings_bytes: int
    created_at: str


class AssetAuditResponse(BaseModel):
    id: str
    audit_id: str
    url: str
    asset_type: str
    size: int
    gzipped_size: int | None = None
    is_minified: bool
    is_render_blocking: bool
    is_unused: bool
    cache_control: str | None = None
    etag: str | None = None
    issues: dict[str, Any] | None = None
    created_at: str


class PerformanceDashboardResponse(BaseModel):
    overall_score: int
    performance_score: int
    accessibility_score: int
    best_practices_score: int
    seo_score: int
    total_audits: int
    total_issues: int
    total_recommendations: int
    resolved_recommendations: int
    avg_lcp: float
    avg_cls: float
    avg_inp: float
    trend: list[dict[str, Any]]


class PerformanceExportRequest(BaseModel):
    format: str = "json"


class PerformanceExportResponse(BaseModel):
    content: str
    format: str
    filename: str


class PerformanceAIRecommendRequest(BaseModel):
    url: str
    scores: dict[str, int]
    metrics: dict[str, Any]
    issues: dict[str, Any] | None = None


class PerformanceAIRecommendResponse(BaseModel):
    recommendations: list[dict[str, Any]]
    provider: str
    latency_ms: float
