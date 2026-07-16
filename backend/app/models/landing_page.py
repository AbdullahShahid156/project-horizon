import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class LandingPage(Base):
    __tablename__ = "landing_pages"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    project_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("projects.id"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="draft", index=True)
    current_version: Mapped[int] = mapped_column(Integer, default=1)
    generation_prompt: Mapped[dict | None] = mapped_column(JSON)
    ai_response: Mapped[dict | None] = mapped_column(JSON)
    seo_data: Mapped[dict | None] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    project = relationship("Project", back_populates="landing_pages")
    versions = relationship("LandingPageVersion", back_populates="landing_page")

    __table_args__ = (
        UniqueConstraint("project_id", "slug", name="uq_project_landing_page_slug"),
    )


class LandingPageVersion(Base):
    __tablename__ = "landing_page_versions"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    landing_page_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("landing_pages.id"),
        nullable=False,
        index=True,
    )
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    content: Mapped[dict] = mapped_column(JSON, nullable=False)
    change_summary: Mapped[str | None] = mapped_column(String(500))
    is_auto_save: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    landing_page = relationship("LandingPage", back_populates="versions")

    __table_args__ = (
        UniqueConstraint("landing_page_id", "version_number", name="uq_landing_page_version"),
    )


class LandingPageTemplate(Base):
    __tablename__ = "landing_page_templates"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String(500))
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    thumbnail_url: Mapped[str | None] = mapped_column(String(500))
    content: Mapped[dict] = mapped_column(JSON, nullable=False)
    is_featured: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
