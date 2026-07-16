import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Image(Base):
    __tablename__ = "images"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False, index=True)
    folder_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    image_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    prompt: Mapped[str | None] = mapped_column(Text)
    negative_prompt: Mapped[str | None] = mapped_column(Text)
    style: Mapped[str | None] = mapped_column(String(100))
    url: Mapped[str | None] = mapped_column(String(500))
    thumbnail_url: Mapped[str | None] = mapped_column(String(500))
    local_path: Mapped[str | None] = mapped_column(String(500))
    file_size: Mapped[int | None] = mapped_column(Integer)
    width: Mapped[int | None] = mapped_column(Integer)
    height: Mapped[int | None] = mapped_column(Integer)
    format: Mapped[str] = mapped_column(String(20), default="png")
    mime_type: Mapped[str | None] = mapped_column(String(50))
    metadata_json: Mapped[dict | None] = mapped_column("image_metadata", JSON)
    generation_params: Mapped[dict | None] = mapped_column(JSON)
    is_favorite: Mapped[bool] = mapped_column(Boolean, default=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)
    tags: Mapped[dict | None] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    folder = relationship("ImageFolder", back_populates="images")
    history = relationship("ImageHistory", back_populates="image")


class ImageFolder(Base):
    __tablename__ = "image_folders"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False, index=True)
    parent_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), nullable=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    color: Mapped[str | None] = mapped_column(String(7))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    images = relationship("Image", back_populates="folder")


class ImageHistory(Base):
    __tablename__ = "image_history"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    image_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("images.id"), nullable=False, index=True)
    action: Mapped[str] = mapped_column(String(50), nullable=False)
    params: Mapped[dict | None] = mapped_column(JSON)
    result_url: Mapped[str | None] = mapped_column(String(500))
    result_local_path: Mapped[str | None] = mapped_column(String(500))
    provider: Mapped[str | None] = mapped_column(String(50))
    latency_ms: Mapped[float | None] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    image = relationship("Image", back_populates="history")
