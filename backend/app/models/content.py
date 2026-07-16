import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ContentFolder(Base):
    __tablename__ = "content_folders"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    workspace_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    parent_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("content_folders.id"),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    items = relationship("ContentItem", back_populates="folder")
    subfolders = relationship("ContentFolder", backref="parent", remote_side=[id])


class ContentItem(Base):
    __tablename__ = "content_items"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    workspace_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        nullable=False,
        index=True,
    )
    folder_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("content_folders.id"),
        nullable=True,
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    slug: Mapped[str] = mapped_column(String(500), nullable=False)
    content_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(50), default="draft", index=True)
    body: Mapped[dict | None] = mapped_column(JSON)
    html_body: Mapped[str | None] = mapped_column(Text)
    plain_body: Mapped[str | None] = mapped_column(Text)
    metadata_json: Mapped[dict | None] = mapped_column("content_metadata", JSON)
    seo_data: Mapped[dict | None] = mapped_column(JSON)
    prompt_data: Mapped[dict | None] = mapped_column(JSON)
    generation_settings: Mapped[dict | None] = mapped_column(JSON)
    current_version: Mapped[int] = mapped_column(Integer, default=1)
    word_count: Mapped[int] = mapped_column(Integer, default=0)
    is_favorite: Mapped[bool] = mapped_column(Boolean, default=False)
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False)
    tags: Mapped[dict | None] = mapped_column(JSON)
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

    folder = relationship("ContentFolder", back_populates="items")
    versions = relationship("ContentVersion", back_populates="content_item")
    tags_rel = relationship("ContentTag", secondary="content_item_tags", back_populates="content_item")


class ContentVersion(Base):
    __tablename__ = "content_versions"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    content_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("content_items.id"),
        nullable=False,
        index=True,
    )
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    body: Mapped[dict | None] = mapped_column(JSON)
    html_body: Mapped[str | None] = mapped_column(Text)
    plain_body: Mapped[str | None] = mapped_column(Text)
    metadata_json: Mapped[dict | None] = mapped_column("content_metadata", JSON)
    change_summary: Mapped[str | None] = mapped_column(String(500))
    is_auto_save: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    content_item = relationship("ContentItem", back_populates="versions")


class ContentTemplate(Base):
    __tablename__ = "content_templates"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    workspace_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(String(500))
    content_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(100), default="general")
    body: Mapped[dict] = mapped_column(JSON, nullable=False)
    system_prompt: Mapped[str | None] = mapped_column(Text)
    generation_settings: Mapped[dict | None] = mapped_column(JSON)
    is_shared: Mapped[bool] = mapped_column(default=False)
    is_favorite: Mapped[bool] = mapped_column(default=False)
    use_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )


class ContentTag(Base):
    __tablename__ = "content_tags"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    workspace_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    color: Mapped[str] = mapped_column(String(7), default="#6366F1")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    content_item = relationship("ContentItem", secondary="content_item_tags", back_populates="tags_rel")


class ContentItemTag(Base):
    __tablename__ = "content_item_tags"

    content_item_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("content_items.id"),
        primary_key=True,
    )
    content_tag_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("content_tags.id"),
        primary_key=True,
    )


class ContentExport(Base):
    __tablename__ = "content_exports"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    content_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        nullable=False,
        index=True,
    )
    format: Mapped[str] = mapped_column(String(20), nullable=False)
    file_url: Mapped[str | None] = mapped_column(String(500))
    file_size: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
