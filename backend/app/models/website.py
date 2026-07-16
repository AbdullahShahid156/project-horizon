from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class GeneratedWebsite(Base):
    __tablename__ = "generated_websites"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(__import__("uuid").uuid4()),
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

    project = relationship("Project", back_populates="websites")
    versions = relationship("WebsiteVersion", back_populates="website")

    __table_args__ = (
        UniqueConstraint("project_id", "slug", name="uq_project_website_slug"),
    )


class WebsiteVersion(Base):
    __tablename__ = "website_versions"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(__import__("uuid").uuid4()),
    )
    website_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("generated_websites.id"),
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

    website = relationship("GeneratedWebsite", back_populates="versions")

    __table_args__ = (
        UniqueConstraint("website_id", "version_number", name="uq_website_version"),
    )
