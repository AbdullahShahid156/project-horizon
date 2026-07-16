import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Brand(Base):
    __tablename__ = "brands"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), nullable=False)
    tagline: Mapped[str | None] = mapped_column(String(500))
    industry: Mapped[str | None] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text)
    target_audience: Mapped[str | None] = mapped_column(Text)
    brand_personality: Mapped[str | None] = mapped_column(Text)
    tone_of_voice: Mapped[str | None] = mapped_column(Text)
    mission: Mapped[str | None] = mapped_column(Text)
    vision: Mapped[str | None] = mapped_column(Text)
    values: Mapped[dict | None] = mapped_column(JSON)
    primary_color: Mapped[str] = mapped_column(String(7), default="#6366F1")
    secondary_color: Mapped[str] = mapped_column(String(7), default="#4F46E5")
    accent_color: Mapped[str] = mapped_column(String(7), default="#818CF8")
    typography: Mapped[str | None] = mapped_column(String(255))
    logo_style: Mapped[str | None] = mapped_column(String(255))
    icon_style: Mapped[str | None] = mapped_column(String(255))
    brand_summary: Mapped[str | None] = mapped_column(Text)
    tagline_suggestions: Mapped[dict | None] = mapped_column(JSON)
    brand_voice: Mapped[str | None] = mapped_column(Text)
    elevator_pitch: Mapped[str | None] = mapped_column(Text)
    usp: Mapped[str | None] = mapped_column(Text)
    color_palette: Mapped[dict | None] = mapped_column(JSON)
    font_pairings: Mapped[dict | None] = mapped_column(JSON)
    icon_suggestions: Mapped[dict | None] = mapped_column(JSON)
    brand_keywords: Mapped[dict | None] = mapped_column(JSON)
    brand_guidelines: Mapped[str | None] = mapped_column(Text)
    ai_data: Mapped[dict | None] = mapped_column(JSON)
    current_version: Mapped[int] = mapped_column(Integer, default=1)
    is_favorite: Mapped[bool] = mapped_column(Boolean, default=False)
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    versions = relationship("BrandVersion", back_populates="brand")
    assets = relationship("BrandAsset", back_populates="brand")


class BrandVersion(Base):
    __tablename__ = "brand_versions"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    brand_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("brands.id"), nullable=False, index=True)
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    data: Mapped[dict] = mapped_column(JSON, nullable=False)
    change_summary: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    brand = relationship("Brand", back_populates="versions")


class BrandAsset(Base):
    __tablename__ = "brand_assets"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    brand_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("brands.id"), nullable=False, index=True)
    asset_type: Mapped[str] = mapped_column(String(50), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    url: Mapped[str | None] = mapped_column(String(500))
    data: Mapped[dict | None] = mapped_column(JSON)
    asset_metadata: Mapped[dict | None] = mapped_column("asset_metadata", JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    brand = relationship("Brand", back_populates="assets")
