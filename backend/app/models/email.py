import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class EmailCampaign(Base):
    __tablename__ = "email_campaigns"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    subject: Mapped[str] = mapped_column(String(500), nullable=False)
    preview_text: Mapped[str | None] = mapped_column(String(255))
    email_type: Mapped[str] = mapped_column(String(50), nullable=False, default="promotional")
    html_content: Mapped[str | None] = mapped_column(Text)
    markdown_content: Mapped[str | None] = mapped_column(Text)
    plain_text: Mapped[str | None] = mapped_column(Text)
    json_content: Mapped[dict | None] = mapped_column(JSON)
    brand: Mapped[str | None] = mapped_column(String(255))
    audience: Mapped[str | None] = mapped_column(Text)
    goal: Mapped[str | None] = mapped_column(String(100))
    tone: Mapped[str | None] = mapped_column(String(100))
    language: Mapped[str] = mapped_column(String(50), default="English")
    cta: Mapped[str | None] = mapped_column(String(500))
    product: Mapped[str | None] = mapped_column(String(255))
    keywords: Mapped[dict | None] = mapped_column(JSON)
    template_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False))
    status: Mapped[str] = mapped_column(String(20), default="draft")
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    open_rate: Mapped[float | None] = mapped_column(Float)
    click_rate: Mapped[float | None] = mapped_column(Float)
    unsubscribe_rate: Mapped[float | None] = mapped_column(Float)
    recipient_count: Mapped[int] = mapped_column(Integer, default=0)
    ai_generated: Mapped[bool] = mapped_column(Boolean, default=False)
    ai_provider: Mapped[str | None] = mapped_column(String(50))
    ai_latency_ms: Mapped[float | None] = mapped_column(Float)
    metadata_json: Mapped[dict | None] = mapped_column("email_metadata", JSON)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class EmailTemplate(Base):
    __tablename__ = "email_templates"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(50), nullable=False, default="business")
    email_type: Mapped[str] = mapped_column(String(50), nullable=False)
    subject: Mapped[str] = mapped_column(String(500), nullable=False)
    preview_text: Mapped[str | None] = mapped_column(String(255))
    html_content: Mapped[str] = mapped_column(Text, nullable=False)
    markdown_content: Mapped[str | None] = mapped_column(Text)
    json_content: Mapped[dict | None] = mapped_column(JSON)
    variables: Mapped[dict | None] = mapped_column(JSON)
    thumbnail_url: Mapped[str | None] = mapped_column(String(500))
    is_system: Mapped[bool] = mapped_column(Boolean, default=False)
    usage_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class EmailHistory(Base):
    __tablename__ = "email_history"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    campaign_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False, index=True)
    action: Mapped[str] = mapped_column(String(50), nullable=False)
    content_before: Mapped[str | None] = mapped_column(Text)
    content_after: Mapped[str | None] = mapped_column(Text)
    ai_provider: Mapped[str | None] = mapped_column(String(50))
    latency_ms: Mapped[float | None] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
