import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class SEODomain(Base):
    __tablename__ = "seo_domains"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False, index=True)
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    health_score: Mapped[int] = mapped_column(Integer, default=0)
    technical_score: Mapped[int] = mapped_column(Integer, default=0)
    content_score: Mapped[int] = mapped_column(Integer, default=0)
    last_audited_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    audits = relationship("SEOAudit", back_populates="domain")
    keywords = relationship("SEOKeyword", back_populates="domain")
    competitors = relationship("SEOCompetitor", back_populates="domain")


class SEOAudit(Base):
    __tablename__ = "seo_audits"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    domain_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("seo_domains.id"), nullable=False, index=True)
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="pending")
    overall_score: Mapped[int] = mapped_column(Integer, default=0)
    technical_score: Mapped[int] = mapped_column(Integer, default=0)
    content_score: Mapped[int] = mapped_column(Integer, default=0)
    on_page_score: Mapped[int] = mapped_column(Integer, default=0)
    off_page_score: Mapped[int] = mapped_column(Integer, default=0)
    issues: Mapped[dict | None] = mapped_column(JSON)
    recommendations: Mapped[dict | None] = mapped_column(JSON)
    metrics: Mapped[dict | None] = mapped_column(JSON)
    raw_data: Mapped[dict | None] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    domain = relationship("SEODomain", back_populates="audits")


class SEOKeyword(Base):
    __tablename__ = "seo_keywords"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    domain_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("seo_domains.id"), nullable=False, index=True)
    keyword: Mapped[str] = mapped_column(String(255), nullable=False)
    search_volume: Mapped[int] = mapped_column(Integer, default=0)
    difficulty: Mapped[int] = mapped_column(Integer, default=0)
    cpc: Mapped[float] = mapped_column(Float, default=0.0)
    intent: Mapped[str] = mapped_column(String(50), default="informational")
    keyword_type: Mapped[str] = mapped_column(String(50), default="primary")
    cluster_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), ForeignKey("seo_keyword_clusters.id"), nullable=True)
    position: Mapped[int | None] = mapped_column(Integer)
    url: Mapped[str | None] = mapped_column(String(500))
    is_tracked: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    domain = relationship("SEODomain", back_populates="keywords")
    cluster = relationship("SEOKeywordCluster", back_populates="keywords")
    rankings = relationship("SEOKeywordRanking", back_populates="keyword")


class SEOKeywordCluster(Base):
    __tablename__ = "seo_keyword_clusters"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    domain_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(String(500))
    pillar_keyword: Mapped[str | None] = mapped_column(String(255))
    keyword_count: Mapped[int] = mapped_column(Integer, default=0)
    avg_volume: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    keywords = relationship("SEOKeyword", back_populates="cluster")


class SEOKeywordRanking(Base):
    __tablename__ = "seo_keyword_rankings"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    keyword_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("seo_keywords.id"), nullable=False, index=True)
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    url: Mapped[str | None] = mapped_column(String(500))
    previous_position: Mapped[int | None] = mapped_column(Integer)
    change: Mapped[int] = mapped_column(Integer, default=0)
    checked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    keyword = relationship("SEOKeyword", back_populates="rankings")


class SEOAuditPage(Base):
    __tablename__ = "seo_audit_pages"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    audit_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("seo_audits.id"), nullable=False, index=True)
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    status_code: Mapped[int | None] = mapped_column(Integer)
    title: Mapped[str | None] = mapped_column(String(500))
    meta_description: Mapped[str | None] = mapped_column(String(500))
    h1: Mapped[str | None] = mapped_column(String(500))
    word_count: Mapped[int] = mapped_column(Integer, default=0)
    internal_links: Mapped[int] = mapped_column(Integer, default=0)
    external_links: Mapped[int] = mapped_column(Integer, default=0)
    images_without_alt: Mapped[int] = mapped_column(Integer, default=0)
    issues: Mapped[dict | None] = mapped_column(JSON)
    score: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class SEOSchema(Base):
    __tablename__ = "seo_schemas"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    domain_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False, index=True)
    schema_type: Mapped[str] = mapped_column(String(50), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    json_ld: Mapped[dict] = mapped_column(JSON, nullable=False)
    url: Mapped[str | None] = mapped_column(String(500))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class SEOReport(Base):
    __tablename__ = "seo_reports"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    domain_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    report_type: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="pending")
    summary: Mapped[dict | None] = mapped_column(JSON)
    data: Mapped[dict | None] = mapped_column(JSON)
    score: Mapped[int] = mapped_column(Integer, default=0)
    issues_count: Mapped[int] = mapped_column(Integer, default=0)
    recommendations_count: Mapped[int] = mapped_column(Integer, default=0)
    file_url: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class SEORecommendation(Base):
    __tablename__ = "seo_recommendations"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    domain_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    priority: Mapped[str] = mapped_column(String(20), default="medium")
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    impact: Mapped[str | None] = mapped_column(String(200))
    effort: Mapped[str | None] = mapped_column(String(200))
    status: Mapped[str] = mapped_column(String(50), default="open")
    url: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class SEOCompetitor(Base):
    __tablename__ = "seo_competitors"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    domain_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("seo_domains.id"), nullable=False, index=True)
    competitor_url: Mapped[str] = mapped_column(String(500), nullable=False)
    competitor_name: Mapped[str] = mapped_column(String(255), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)
    analysis: Mapped[dict | None] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    domain = relationship("SEODomain", back_populates="competitors")


class SEOHistory(Base):
    __tablename__ = "seo_history"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    domain_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False, index=True)
    event_type: Mapped[str] = mapped_column(String(50), nullable=False)
    data: Mapped[dict | None] = mapped_column(JSON)
    score: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class SEOInternalLink(Base):
    __tablename__ = "seo_internal_links"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    domain_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False, index=True)
    source_url: Mapped[str] = mapped_column(String(500), nullable=False)
    target_url: Mapped[str] = mapped_column(String(500), nullable=False)
    anchor_text: Mapped[str | None] = mapped_column(String(255))
    suggestion_type: Mapped[str] = mapped_column(String(50), default="related")
    is_implemented: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
