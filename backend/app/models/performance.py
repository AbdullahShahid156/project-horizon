import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class PerformanceAudit(Base):
    __tablename__ = "performance_audits"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False, index=True)
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="pending")
    overall_score: Mapped[int] = mapped_column(Integer, default=0)
    performance_score: Mapped[int] = mapped_column(Integer, default=0)
    accessibility_score: Mapped[int] = mapped_column(Integer, default=0)
    best_practices_score: Mapped[int] = mapped_column(Integer, default=0)
    seo_score: Mapped[int] = mapped_column(Integer, default=0)
    metrics: Mapped[dict | None] = mapped_column(JSON)
    issues: Mapped[dict | None] = mapped_column(JSON)
    recommendations: Mapped[dict | None] = mapped_column(JSON)
    resources: Mapped[dict | None] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    vitals = relationship("CoreWebVitals", back_populates="audit")


class CoreWebVitals(Base):
    __tablename__ = "core_web_vitals"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    audit_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("performance_audits.id"), nullable=False, index=True)
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    lcp: Mapped[float] = mapped_column(Float, default=0.0)
    lcp_status: Mapped[str] = mapped_column(String(20), default="none")
    inp: Mapped[float] = mapped_column(Float, default=0.0)
    inp_status: Mapped[str] = mapped_column(String(20), default="none")
    cls: Mapped[float] = mapped_column(Float, default=0.0)
    cls_status: Mapped[str] = mapped_column(String(20), default="none")
    fcp: Mapped[float] = mapped_column(Float, default=0.0)
    fcp_status: Mapped[str] = mapped_column(String(20), default="none")
    ttfb: Mapped[float] = mapped_column(Float, default=0.0)
    ttfb_status: Mapped[str] = mapped_column(String(20), default="none")
    speed_index: Mapped[float] = mapped_column(Float, default=0.0)
    speed_index_status: Mapped[str] = mapped_column(String(20), default="none")
    tbt: Mapped[float] = mapped_column(Float, default=0.0)
    tbt_status: Mapped[str] = mapped_column(String(20), default="none")
    raw_data: Mapped[dict | None] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    audit = relationship("PerformanceAudit", back_populates="vitals")


class PerformanceRecommendation(Base):
    __tablename__ = "performance_recommendations"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    audit_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    priority: Mapped[str] = mapped_column(String(20), default="medium")
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    problem: Mapped[str | None] = mapped_column(Text)
    impact: Mapped[str | None] = mapped_column(String(200))
    estimated_improvement: Mapped[str | None] = mapped_column(String(200))
    implementation_guide: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(50), default="open")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class OptimizationHistory(Base):
    __tablename__ = "optimization_history"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False, index=True)
    event_type: Mapped[str] = mapped_column(String(50), nullable=False)
    data: Mapped[dict | None] = mapped_column(JSON)
    score_before: Mapped[int | None] = mapped_column(Integer)
    score_after: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class PerformanceReport(Base):
    __tablename__ = "performance_reports"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="pending")
    summary: Mapped[dict | None] = mapped_column(JSON)
    data: Mapped[dict | None] = mapped_column(JSON)
    score: Mapped[int] = mapped_column(Integer, default=0)
    file_url: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class ImageAudit(Base):
    __tablename__ = "image_audits"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    audit_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False, index=True)
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    original_size: Mapped[int] = mapped_column(Integer, default=0)
    optimized_size: Mapped[int | None] = mapped_column(Integer)
    format: Mapped[str] = mapped_column(String(20), default="unknown")
    recommended_format: Mapped[str | None] = mapped_column(String(20))
    width: Mapped[int | None] = mapped_column(Integer)
    height: Mapped[int | None] = mapped_column(Integer)
    has_lazy_loading: Mapped[bool] = mapped_column(Boolean, default=False)
    has_alt_text: Mapped[bool] = mapped_column(Boolean, default=False)
    issues: Mapped[dict | None] = mapped_column(JSON)
    savings_bytes: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class AssetAudit(Base):
    __tablename__ = "asset_audits"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    audit_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False, index=True)
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    asset_type: Mapped[str] = mapped_column(String(50), nullable=False)
    size: Mapped[int] = mapped_column(Integer, default=0)
    gzipped_size: Mapped[int | None] = mapped_column(Integer)
    is_minified: Mapped[bool] = mapped_column(Boolean, default=False)
    is_render_blocking: Mapped[bool] = mapped_column(Boolean, default=False)
    is_unused: Mapped[bool] = mapped_column(Boolean, default=False)
    cache_control: Mapped[str | None] = mapped_column(String(200))
    etag: Mapped[str | None] = mapped_column(String(200))
    issues: Mapped[dict | None] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
