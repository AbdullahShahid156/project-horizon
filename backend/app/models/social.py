import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class SocialPost(Base):
    __tablename__ = "social_posts"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False, index=True)
    campaign_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), nullable=True, index=True)
    platform: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    post_type: Mapped[str] = mapped_column(String(50), nullable=False, default="single")
    content: Mapped[str] = mapped_column(Text, nullable=False)
    headline: Mapped[str | None] = mapped_column(String(500))
    caption: Mapped[str | None] = mapped_column(Text)
    hashtags: Mapped[dict | None] = mapped_column(JSON)
    cta: Mapped[str | None] = mapped_column(String(500))
    emojis: Mapped[dict | None] = mapped_column(JSON)
    image_suggestions: Mapped[dict | None] = mapped_column(JSON)
    image_ids: Mapped[dict | None] = mapped_column(JSON)
    carousel_content: Mapped[dict | None] = mapped_column(JSON)
    story_content: Mapped[dict | None] = mapped_column(JSON)
    reel_script: Mapped[str | None] = mapped_column(Text)
    poll_ideas: Mapped[dict | None] = mapped_column(JSON)
    business: Mapped[str | None] = mapped_column(String(255))
    brand: Mapped[str | None] = mapped_column(String(255))
    target_audience: Mapped[str | None] = mapped_column(Text)
    goal: Mapped[str | None] = mapped_column(String(100))
    tone: Mapped[str | None] = mapped_column(String(100))
    keywords: Mapped[dict | None] = mapped_column(JSON)
    status: Mapped[str] = mapped_column(String(20), default="draft")
    scheduled_date: Mapped[str | None] = mapped_column(String(30))
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    performance_score: Mapped[float | None] = mapped_column(Float)
    ai_generated: Mapped[bool] = mapped_column(Boolean, default=False)
    ai_provider: Mapped[str | None] = mapped_column(String(50))
    ai_latency_ms: Mapped[float | None] = mapped_column(Float)
    metadata_json: Mapped[dict | None] = mapped_column("social_metadata", JSON)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    campaign = relationship("SocialCampaign", back_populates="posts")
    history = relationship("SocialPostHistory", back_populates="post")


class SocialCampaign(Base):
    __tablename__ = "social_campaigns"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    platforms: Mapped[dict | None] = mapped_column(JSON)
    start_date: Mapped[str | None] = mapped_column(String(30))
    end_date: Mapped[str | None] = mapped_column(String(30))
    status: Mapped[str] = mapped_column(String(20), default="active")
    target_audience: Mapped[str | None] = mapped_column(Text)
    goals: Mapped[dict | None] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    posts = relationship("SocialPost", back_populates="campaign")


class SocialCalendar(Base):
    __tablename__ = "social_calendars"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False, index=True)
    post_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), nullable=True)
    date: Mapped[str] = mapped_column(String(30), nullable=False)
    platform: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="draft")
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class SocialHashtag(Base):
    __tablename__ = "social_hashtags"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False, index=True)
    tag: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str | None] = mapped_column(String(100))
    usage_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class SocialPostHistory(Base):
    __tablename__ = "social_post_history"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    post_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("social_posts.id"), nullable=False, index=True)
    action: Mapped[str] = mapped_column(String(50), nullable=False)
    content_before: Mapped[str | None] = mapped_column(Text)
    content_after: Mapped[str | None] = mapped_column(Text)
    ai_provider: Mapped[str | None] = mapped_column(String(50))
    latency_ms: Mapped[float | None] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    post = relationship("SocialPost", back_populates="history")
