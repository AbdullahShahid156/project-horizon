from typing import Any, Optional
from pydantic import BaseModel


class ImageGenerateRequest(BaseModel):
    workspace_id: str
    prompt: str
    negative_prompt: Optional[str] = None
    style: Optional[str] = None
    width: int = 1024
    height: int = 1024
    image_type: str = "general"
    folder_id: Optional[str] = None
    name: Optional[str] = None
    num_variations: int = 1


class ImageEditRequest(BaseModel):
    image_id: str
    operation: str
    width: Optional[int] = None
    height: Optional[int] = None
    quality: int = 85
    output_format: Optional[str] = None
    crop_x: Optional[int] = None
    crop_y: Optional[int] = None
    crop_width: Optional[int] = None
    crop_height: Optional[int] = None
    filter_name: Optional[str] = None


class ImagePromptEnhanceRequest(BaseModel):
    prompt: str
    style: Optional[str] = None
    image_type: Optional[str] = None


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
    folder_id: Optional[str] = None
    name: str
    description: Optional[str] = None
    image_type: str
    prompt: Optional[str] = None
    negative_prompt: Optional[str] = None
    style: Optional[str] = None
    url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    file_size: Optional[int] = None
    width: Optional[int] = None
    height: Optional[int] = None
    format: str
    mime_type: Optional[str] = None
    metadata: Optional[dict[str, Any]] = None
    generation_params: Optional[dict[str, Any]] = None
    is_favorite: bool
    is_deleted: bool
    tags: Optional[list[str]] = None
    created_at: str
    updated_at: str


class ImageFolderResponse(BaseModel):
    id: str
    workspace_id: str
    parent_id: Optional[str] = None
    name: str
    description: Optional[str] = None
    color: Optional[str] = None
    image_count: int = 0
    created_at: str
    updated_at: str


class ImageHistoryResponse(BaseModel):
    id: str
    image_id: str
    action: str
    params: Optional[dict[str, Any]] = None
    result_url: Optional[str] = None
    provider: Optional[str] = None
    latency_ms: Optional[float] = None
    created_at: str


class ImageStatsResponse(BaseModel):
    total: int
    favorites: int
    by_type: dict[str, int]
    by_format: dict[str, int]
    total_size_bytes: int


class ImageGenerateResponse(BaseModel):
    images: list[ImageResponse]
    enhanced_prompt: Optional[str] = None
    provider: str
    latency_ms: float


class ImageEditResponse(BaseModel):
    id: str
    url: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    file_size: Optional[int] = None
    format: str
    operation: str
    latency_ms: float
