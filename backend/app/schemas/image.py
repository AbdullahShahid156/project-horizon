from typing import Any

from pydantic import BaseModel


class ImageGenerateRequest(BaseModel):
    workspace_id: str
    prompt: str
    negative_prompt: str | None = None
    style: str | None = None
    width: int = 1024
    height: int = 1024
    image_type: str = "general"
    folder_id: str | None = None
    name: str | None = None
    num_variations: int = 1


class ImageEditRequest(BaseModel):
    image_id: str
    operation: str
    width: int | None = None
    height: int | None = None
    quality: int = 85
    output_format: str | None = None
    crop_x: int | None = None
    crop_y: int | None = None
    crop_width: int | None = None
    crop_height: int | None = None
    filter_name: str | None = None


class ImagePromptEnhanceRequest(BaseModel):
    prompt: str
    style: str | None = None
    image_type: str | None = None


class ImageVariationRequest(BaseModel):
    image_id: str
    num_variations: int = 4
    strength: float = 0.7


class ImageUpscaleRequest(BaseModel):
    image_id: str
    scale: int = 2


class ImageResponse(BaseModel):
    id: str
    workspace_id: str
    folder_id: str | None = None
    name: str
    description: str | None = None
    image_type: str
    prompt: str | None = None
    negative_prompt: str | None = None
    style: str | None = None
    url: str | None = None
    thumbnail_url: str | None = None
    file_size: int | None = None
    width: int | None = None
    height: int | None = None
    format: str
    mime_type: str | None = None
    metadata: dict[str, Any] | None = None
    generation_params: dict[str, Any] | None = None
    is_favorite: bool
    is_deleted: bool
    tags: list[str] | None = None
    created_at: str
    updated_at: str


class ImageFolderResponse(BaseModel):
    id: str
    workspace_id: str
    parent_id: str | None = None
    name: str
    description: str | None = None
    color: str | None = None
    image_count: int = 0
    created_at: str
    updated_at: str


class ImageHistoryResponse(BaseModel):
    id: str
    image_id: str
    action: str
    params: dict[str, Any] | None = None
    result_url: str | None = None
    provider: str | None = None
    latency_ms: float | None = None
    created_at: str


class ImageStatsResponse(BaseModel):
    total: int
    favorites: int
    by_type: dict[str, int]
    by_format: dict[str, int]
    total_size_bytes: int


class ImageGenerateResponse(BaseModel):
    images: list[ImageResponse]
    enhanced_prompt: str | None = None
    provider: str
    latency_ms: float


class ImageEditResponse(BaseModel):
    id: str
    url: str | None = None
    width: int | None = None
    height: int | None = None
    file_size: int | None = None
    format: str
    operation: str
    latency_ms: float
