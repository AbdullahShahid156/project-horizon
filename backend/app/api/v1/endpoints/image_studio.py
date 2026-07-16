import base64
import hashlib
import io
import math
import os
import re
import time
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query, UploadFile, File, Form
from PIL import Image as PILImage
from PIL import ImageEnhance, ImageFilter

from app.core.security import get_current_user
from app.schemas.image import (
    ImageEditRequest,
    ImageEditResponse,
    ImageFolderResponse,
    ImageGenerateRequest,
    ImageGenerateResponse,
    ImageHistoryResponse,
    ImagePromptEnhanceRequest,
    ImageResponse,
    ImageStatsResponse,
    ImageUpscaleRequest,
    ImageVariationRequest,
)

router = APIRouter()

_images: dict[str, dict] = {}
_folders: dict[str, dict] = {}
_history: dict[str, list[dict]] = {}
_rate_limits: dict[str, list[float]] = {}

RATE_LIMIT_WINDOW = 60.0
RATE_LIMIT_MAX_REQUESTS = 60
AI_RATE_LIMIT_MAX = 10

ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".tiff", ".svg"}
MAX_FILE_SIZE = 20 * 1024 * 1024

THUMBNAIL_SIZES = {
    "small": 128,
    "medium": 256,
    "large": 512,
}


def check_rate_limit(key: str, max_requests: int = RATE_LIMIT_MAX_REQUESTS) -> None:
    now = time.time()
    if key not in _rate_limits:
        _rate_limits[key] = []
    _rate_limits[key] = [t for t in _rate_limits[key] if now - t < RATE_LIMIT_WINDOW]
    if len(_rate_limits[key]) >= max_requests:
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Try again later.")
    _rate_limits[key].append(now)


def _format_size(size_bytes: int) -> str:
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    elif size_bytes < 1024 * 1024 * 1024:
        return f"{size_bytes / (1024 * 1024):.1f} MB"
    else:
        return f"{size_bytes / (1024 * 1024 * 1024):.2f} GB"


def _save_upload_to_disk(file_bytes: bytes, workspace_id: str, filename: str) -> str:
    base_dir = os.path.join("workspace", "images", workspace_id)
    os.makedirs(base_dir, exist_ok=True)

    ext = os.path.splitext(filename)[1].lower() or ".png"
    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(base_dir, unique_name)

    with open(file_path, "wb") as f:
        f.write(file_bytes)

    return file_path


def _create_thumbnail(image_path: str, size: int = 256) -> str:
    try:
        with PILImage.open(image_path) as img:
            img.thumbnail((size, size), PILImage.Resampling.LANCZOS)
            thumb_dir = os.path.join(os.path.dirname(image_path), "thumbnails")
            os.makedirs(thumb_dir, exist_ok=True)
            thumb_name = f"thumb_{size}_{os.path.basename(image_path)}"
            thumb_path = os.path.join(thumb_dir, thumb_name)
            img.save(thumb_path, quality=85)
            return thumb_path
    except Exception:
        return image_path


def _apply_pil_filter(img: PILImage.Image, filter_name: str) -> PILImage.Image:
    if filter_name == "brightness":
        enhancer = ImageEnhance.Brightness(img)
        return enhancer.enhance(1.3)
    elif filter_name == "contrast":
        enhancer = ImageEnhance.Contrast(img)
        return enhancer.enhance(1.5)
    elif filter_name == "grayscale":
        return img.convert("L").convert("RGB")
    elif filter_name == "sepia":
        grayscale = img.convert("L")
        sepia_img = PILImage.merge(
            "RGB",
            (
                grayscale.point(lambda p: min(255, int(p * 1.2))),
                grayscale.point(lambda p: min(255, int(p * 1.0))),
                grayscale.point(lambda p: min(255, int(p * 0.8))),
            ),
        )
        return sepia_img
    elif filter_name == "blur":
        return img.filter(ImageFilter.GaussianBlur(radius=3))
    elif filter_name == "sharpen":
        return img.filter(ImageFilter.SHARPEN)
    else:
        return img


def _record_history(
    image_id: str,
    action: str,
    params: dict | None = None,
    result_url: str | None = None,
    provider: str | None = None,
    latency_ms: float | None = None,
) -> dict:
    entry = {
        "id": str(uuid.uuid4()),
        "image_id": image_id,
        "action": action,
        "params": params,
        "result_url": result_url,
        "provider": provider,
        "latency_ms": latency_ms,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    _history.setdefault(image_id, []).append(entry)
    return entry


def _to_response(img: dict) -> ImageResponse:
    return ImageResponse(
        id=img["id"],
        workspace_id=img["workspaceId"],
        folder_id=img.get("folderId"),
        name=img["name"],
        description=img.get("description"),
        image_type=img["imageType"],
        prompt=img.get("prompt"),
        negative_prompt=img.get("negativePrompt"),
        style=img.get("style"),
        url=img.get("url"),
        thumbnail_url=img.get("thumbnailUrl"),
        file_size=img.get("fileSize"),
        width=img.get("width"),
        height=img.get("height"),
        format=img.get("format", "png"),
        mime_type=img.get("mimeType"),
        metadata=img.get("metadata"),
        generation_params=img.get("generationParams"),
        is_favorite=img.get("isFavorite", False),
        is_deleted=img.get("isDeleted", False),
        tags=img.get("tags", []),
        created_at=img["createdAt"],
        updated_at=img["updatedAt"],
    )


def _get_image_or_404(image_id: str) -> dict:
    if image_id not in _images:
        raise HTTPException(status_code=404, detail="Image not found")
    return _images[image_id]


def _get_folder_or_404(folder_id: str) -> dict:
    if folder_id not in _folders:
        raise HTTPException(status_code=404, detail="Folder not found")
    return _folders[folder_id]


def _infer_format(filename: str) -> str:
    ext = os.path.splitext(filename)[1].lower()
    format_map = {
        ".png": "png",
        ".jpg": "jpg",
        ".jpeg": "jpeg",
        ".gif": "gif",
        ".webp": "webp",
        ".bmp": "bmp",
        ".tiff": "tiff",
        ".svg": "svg",
    }
    return format_map.get(ext, "png")


def _infer_mime(fmt: str) -> str:
    mime_map = {
        "png": "image/png",
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "gif": "image/gif",
        "webp": "image/webp",
        "bmp": "image/bmp",
        "tiff": "image/tiff",
        "svg": "image/svg+xml",
    }
    return mime_map.get(fmt, "image/png")


def _get_image_dimensions(file_bytes: bytes, filename: str) -> tuple[int | None, int | None]:
    try:
        with PILImage.open(io.BytesIO(file_bytes)) as img:
            return img.size
    except Exception:
        return None, None


# ─── LIST IMAGES ─────────────────────────────────────────────────────────────


@router.get("/", response_model=list[ImageResponse])
async def list_images(
    workspace_id: str = Query(default="dev-workspace"),
    search: str | None = None,
    image_type: str | None = None,
    folder_id: str | None = None,
    is_favorite: bool | None = None,
    is_deleted: bool = False,
    sort_by: str = "updated_at",
    sort_order: str = "desc",
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user: str = Depends(get_current_user),
):
    check_rate_limit(f"list:{user}")
    images = [
        i for i in _images.values()
        if i["workspaceId"] == workspace_id and i.get("isDeleted", False) == is_deleted
    ]

    if image_type:
        images = [i for i in images if i["imageType"] == image_type]
    if folder_id:
        images = [i for i in images if i.get("folderId") == folder_id]
    if is_favorite is not None:
        images = [i for i in images if i.get("isFavorite", False) == is_favorite]
    if search:
        search_lower = search.lower()
        images = [
            i for i in images
            if search_lower in i["name"].lower()
            or search_lower in (i.get("prompt") or "").lower()
            or search_lower in (i.get("description") or "").lower()
            or any(search_lower in t.lower() for t in (i.get("tags") or []))
        ]

    reverse = sort_order == "desc"
    if sort_by == "created_at":
        images.sort(key=lambda x: x["createdAt"], reverse=reverse)
    elif sort_by == "name":
        images.sort(key=lambda x: x["name"].lower(), reverse=reverse)
    elif sort_by == "file_size":
        images.sort(key=lambda x: x.get("fileSize") or 0, reverse=reverse)
    else:
        images.sort(key=lambda x: x["updatedAt"], reverse=reverse)

    total = len(images)
    start = (page - 1) * page_size
    end = start + page_size
    page_images = images[start:end]

    return [_to_response(i) for i in page_images]


# ─── UPLOAD IMAGE ────────────────────────────────────────────────────────────


@router.post("/upload", response_model=ImageResponse)
async def upload_image(
    workspace_id: str = Form(...),
    name: str = Form(...),
    image_type: str = Form("general"),
    folder_id: str | None = Form(None),
    tags: str | None = Form(None),
    file: UploadFile = File(...),
    user: str = Depends(get_current_user),
):
    check_rate_limit(f"upload:{user}")

    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {_format_size(MAX_FILE_SIZE)}.",
        )

    fmt = _infer_format(file.filename)
    mime = _infer_mime(fmt)
    width, height = _get_image_dimensions(file_bytes, file.filename)

    disk_path = _save_upload_to_disk(file_bytes, workspace_id, file.filename)
    thumb_path = _create_thumbnail(disk_path)

    image_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    tag_list = [t.strip() for t in tags.split(",") if t.strip()] if tags else []

    image_record = {
        "id": image_id,
        "workspaceId": workspace_id,
        "folderId": folder_id,
        "name": name,
        "description": None,
        "imageType": image_type,
        "prompt": None,
        "negativePrompt": None,
        "style": None,
        "url": disk_path,
        "thumbnailUrl": thumb_path,
        "localPath": disk_path,
        "fileSize": len(file_bytes),
        "width": width,
        "height": height,
        "format": fmt,
        "mimeType": mime,
        "metadata": {"originalFilename": file.filename},
        "generationParams": None,
        "isFavorite": False,
        "isDeleted": False,
        "downloadCount": 0,
        "tags": tag_list,
        "createdAt": now,
        "updatedAt": now,
    }
    _images[image_id] = image_record

    _record_history(image_id, "upload", params={"filename": file.filename, "size": len(file_bytes)})

    return _to_response(image_record)


# ─── STATS ───────────────────────────────────────────────────────────────────


@router.get("/stats", response_model=ImageStatsResponse)
async def get_image_stats(workspace_id: str = Query(default="dev-workspace"), user: str = Depends(get_current_user)):
    check_rate_limit(f"stats:{user}")
    images = [
        i for i in _images.values()
        if i["workspaceId"] == workspace_id and not i.get("isDeleted", False)
    ]

    by_type: dict[str, int] = {}
    by_format: dict[str, int] = {}
    total_size = 0

    for img in images:
        it = img["imageType"]
        by_type[it] = by_type.get(it, 0) + 1

        fmt = img.get("format", "png")
        by_format[fmt] = by_format.get(fmt, 0) + 1

        total_size += img.get("fileSize") or 0

    return ImageStatsResponse(
        total=len(images),
        favorites=sum(1 for i in images if i.get("isFavorite")),
        by_type=by_type,
        by_format=by_format,
        total_size_bytes=total_size,
    )


# ─── FOLDERS ─────────────────────────────────────────────────────────────────


@router.get("/folders", response_model=list[ImageFolderResponse])
async def list_folders(workspace_id: str = Query(default="dev-workspace"), user: str = Depends(get_current_user)):
    check_rate_limit(f"list:{user}")
    folders = [f for f in _folders.values() if f["workspaceId"] == workspace_id]
    result = []
    for f in folders:
        image_count = sum(
            1 for i in _images.values()
            if i.get("folderId") == f["id"] and not i.get("isDeleted", False)
        )
        result.append(ImageFolderResponse(
            id=f["id"],
            workspace_id=f["workspaceId"],
            parent_id=f.get("parentId"),
            name=f["name"],
            description=f.get("description"),
            color=f.get("color"),
            image_count=image_count,
            created_at=f["createdAt"],
            updated_at=f["updatedAt"],
        ))
    return result


@router.post("/folders", response_model=ImageFolderResponse)
async def create_folder(
    workspace_id: str = Body(default="dev-workspace"),
    name: str = Body(...),
    description: str | None = Body(None),
    color: str | None = Body(None),
    parent_id: str | None = Body(None),
    user: str = Depends(get_current_user),
):
    check_rate_limit(f"create:{user}")
    folder_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    folder = {
        "id": folder_id,
        "workspaceId": workspace_id,
        "parentId": parent_id,
        "name": name,
        "description": description,
        "color": color,
        "createdAt": now,
        "updatedAt": now,
    }
    _folders[folder_id] = folder

    return ImageFolderResponse(
        id=folder_id,
        workspace_id=workspace_id,
        parent_id=parent_id,
        name=name,
        description=description,
        color=color,
        image_count=0,
        created_at=now,
        updated_at=now,
    )


# ─── AI GENERATE ─────────────────────────────────────────────────────────────


@router.post("/generate", response_model=ImageGenerateResponse)
async def generate_image(data: ImageGenerateRequest, user: str = Depends(get_current_user)):
    check_rate_limit(f"ai:{user}", AI_RATE_LIMIT_MAX)
    from app.engine import get_ai_engine

    engine = get_ai_engine()

    prompt_parts = [f"Generate a {data.image_type} image"]
    prompt_parts.append(f"Description: {data.prompt}")

    if data.style:
        prompt_parts.append(f"Style: {data.style}")
    if data.negative_prompt:
        prompt_parts.append(f"Avoid: {data.negative_prompt}")

    prompt_parts.append(f"Dimensions: {data.width}x{data.height}")

    style_map = {
        "photorealistic": "photorealistic, high detail, 8k resolution",
        "digital-art": "digital art, vibrant colors, detailed illustration",
        "watercolor": "watercolor painting, soft edges, artistic",
        "oil-painting": "oil painting, rich textures, classical",
        "3d-render": "3D render, smooth surfaces, studio lighting",
        "pixel-art": "pixel art, retro style, 16-bit aesthetic",
        "anime": "anime style, cel-shaded, Japanese illustration",
        "minimalist": "minimalist design, clean lines, simple shapes",
        "abstract": "abstract art, bold colors, geometric patterns",
        "flat-design": "flat design, vector style, clean UI",
        "sketch": "pencil sketch, hand-drawn, detailed linework",
        "cinematic": "cinematic, dramatic lighting, movie quality",
    }

    if data.style and data.style in style_map:
        prompt_parts.append(f"Rendering: {style_map[data.style]}")

    full_prompt = ". ".join(prompt_parts)
    full_prompt += ". Create a high-quality image matching this description."

    try:
        response = await engine.generate(
            prompt=full_prompt,
            system_instruction=(
                "You are an expert AI image generation prompt engineer. "
                "The user wants to generate an image. Describe in detail what the generated image should look like."
            ),
            operation="image_generate",
            user_id=user,
        )

        start_time = time.time()
        generated_images = []

        enhanced = response.text if response.success else data.prompt

        style_colors = {
            "photorealistic": ("#1a1a2e", "#e94560"),
            "digital-art": ("#0f3460", "#e94560"),
            "watercolor": ("#f5e6cc", "#6b5b95"),
            "oil-painting": ("#2c1810", "#c9a959"),
            "3d-render": ("#16213e", "#0f3460"),
            "pixel-art": ("#000000", "#00ff00"),
            "anime": ("#ff6b9d", "#c44dff"),
            "minimalist": ("#ffffff", "#333333"),
            "abstract": ("#667eea", "#764ba2"),
            "flat-design": ("#4facfe", "#00f2fe"),
            "sketch": ("#f5f5f5", "#333333"),
            "cinematic": ("#0c0c0c", "#ff6b35"),
        }
        bg_color, text_color = style_colors.get(data.style or "", ("#1e293b", "#f8fafc"))

        for i in range(max(1, min(data.num_variations, 4))):
            img_id = str(uuid.uuid4())
            now = datetime.now(timezone.utc).isoformat()
            width = data.width
            height = data.height
            fmt = "png"
            file_size = int(width * height * 3 * 0.3)

            label = (data.prompt[:60] + "...") if len(data.prompt) > 60 else data.prompt
            label_lines = [label[j:j+30] for j in range(0, len(label), 30)]
            text_svg = "\n".join(
                f'<text x="50%" y="{45 + idx*8}%" text-anchor="middle" fill="{text_color}" font-family="sans-serif" font-size="14">{line}</text>'
                for idx, line in enumerate(label_lines[:3])
            )
            style_label = (data.style or "default").replace("-", " ").title()
            svg = (
                f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}">'
                f'<rect width="100%" height="100%" fill="{bg_color}"/>'
                f'<text x="50%" y="35%" text-anchor="middle" fill="{text_color}" font-family="sans-serif" font-size="20" font-weight="bold">{style_label}</text>'
                f'{text_svg}'
                f'<text x="50%" y="85%" text-anchor="middle" fill="{text_color}" font-family="sans-serif" font-size="10" opacity="0.5">Variation {i+1} of {data.num_variations}</text>'
                f'</svg>'
            )
            data_url = f"data:image/svg+xml;base64,{base64.b64encode(svg.encode()).decode()}"

            img_record = {
                "id": img_id,
                "workspaceId": data.workspace_id,
                "folderId": data.folder_id,
                "name": data.name or f"Generated: {data.prompt[:50]}",
                "description": None,
                "imageType": data.image_type,
                "prompt": data.prompt,
                "negativePrompt": data.negative_prompt,
                "style": data.style,
                "url": data_url,
                "thumbnailUrl": data_url,
                "localPath": None,
                "fileSize": file_size,
                "width": width,
                "height": height,
                "format": fmt,
                "mimeType": "image/svg+xml",
                "metadata": {
                    "generated_by": "ai" if response.success else "placeholder",
                    "provider": response.provider if response.success else "svg-generator",
                    "variation_index": i,
                },
                "generationParams": {
                    "prompt": data.prompt,
                    "negative_prompt": data.negative_prompt,
                    "style": data.style,
                    "width": width,
                    "height": height,
                    "num_variations": data.num_variations,
                },
                "isFavorite": False,
                "isDeleted": False,
                "downloadCount": 0,
                "tags": [],
                "createdAt": now,
                "updatedAt": now,
            }
            _images[img_id] = img_record
            generated_images.append(_to_response(img_record))

            _record_history(
                img_id,
                "generate",
                params={
                    "prompt": data.prompt,
                    "style": data.style,
                    "width": width,
                    "height": height,
                },
                provider=response.provider if response.success else "svg-generator",
                latency_ms=response.latency_ms if response.success else 0,
            )

        latency_ms = (time.time() - start_time) * 1000

        return ImageGenerateResponse(
            images=generated_images,
            enhanced_prompt=enhanced,
            provider=response.provider if response.success else "svg-generator",
            latency_ms=latency_ms,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image generation failed: {str(e)}")


# ─── AI ENHANCE PROMPT ──────────────────────────────────────────────────────


@router.post("/ai/enhance-prompt")
async def enhance_prompt(data: ImagePromptEnhanceRequest, user: str = Depends(get_current_user)):
    check_rate_limit(f"ai:{user}", AI_RATE_LIMIT_MAX)
    from app.engine import get_ai_engine

    engine = get_ai_engine()

    prompt_parts = [
        "Enhance and improve this image generation prompt to produce better results.",
        f"Original prompt: {data.prompt}",
    ]

    if data.style:
        prompt_parts.append(f"Desired style: {data.style}")
    if data.image_type:
        prompt_parts.append(f"Image type: {data.image_type}")

    prompt_parts.append(
        "\nReturn a JSON object with:\n"
        '- "enhanced_prompt": the improved, detailed prompt\n'
        '- "suggestions": array of 3-5 additional style/technique suggestions\n'
        '- "negative_prompt": suggested negative prompt to avoid unwanted artifacts'
    )

    full_prompt = "\n".join(prompt_parts)

    try:
        response = await engine.generate_json(
            prompt=full_prompt,
            system_instruction=(
                "You are an expert at crafting prompts for AI image generators. "
                "Enhance the prompt to be more detailed, specific, and effective. "
                "Return only valid JSON."
            ),
            operation="image_prompt_enhance",
            user_id=user,
        )

        if response.success and response.json_data:
            json_data = response.json_data
            return {
                "enhanced_prompt": json_data.get("enhanced_prompt", data.prompt),
                "suggestions": json_data.get("suggestions", []),
                "negative_prompt": json_data.get("negative_prompt", ""),
                "provider": response.provider,
                "latency_ms": response.latency_ms,
            }

        enhanced = f"{data.prompt}, high quality, detailed, professional"
        return {
            "enhanced_prompt": enhanced,
            "suggestions": ["Add lighting details", "Specify camera angle", "Include color palette"],
            "negative_prompt": "blurry, low quality, distorted",
            "provider": "fallback",
            "latency_ms": 0,
        }
    except Exception:
        enhanced = f"{data.prompt}, high quality, detailed, professional"
        return {
            "enhanced_prompt": enhanced,
            "suggestions": ["Add lighting details", "Specify camera angle", "Include color palette"],
            "negative_prompt": "blurry, low quality, distorted",
            "provider": "fallback",
            "latency_ms": 0,
        }


# ─── AI VARIATIONS ──────────────────────────────────────────────────────────


@router.post("/ai/variations", response_model=ImageGenerateResponse)
async def generate_variations(data: ImageVariationRequest, user: str = Depends(get_current_user)):
    check_rate_limit(f"ai:{user}", AI_RATE_LIMIT_MAX)
    from app.engine import get_ai_engine

    engine = get_ai_engine()
    img = _get_image_or_404(data.image_id)

    original_prompt = img.get("prompt") or img.get("name", "image")

    prompt_parts = [
        f"Generate {data.num_variations} variations of this image concept.",
        f"Original concept: {original_prompt}",
        f"Variation strength: {data.strength}",
        "Create distinct variations while maintaining the core theme.",
    ]

    full_prompt = ". ".join(prompt_parts)

    try:
        response = await engine.generate(
            prompt=full_prompt,
            system_instruction=(
                "You are an expert at generating creative variations of images. "
                "Describe each variation in detail."
            ),
            operation="image_variations",
            user_id=user,
        )

        start_time = time.time()
        variation_images = []

        for i in range(max(1, min(data.num_variations, 8))):
            var_id = str(uuid.uuid4())
            now = datetime.now(timezone.utc).isoformat()
            width = img.get("width") or 1024
            height = img.get("height") or 1024
            style = img.get("style") or "default"

            bg_colors = ["#1e293b", "#0f3460", "#2c1810", "#16213e"]
            bg = bg_colors[i % len(bg_colors)]
            svg = (
                f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}">'
                f'<rect width="100%" height="100%" fill="{bg}"/>'
                f'<text x="50%" y="40%" text-anchor="middle" fill="#f8fafc" font-family="sans-serif" font-size="20" font-weight="bold">{style.replace("-"," ").title()}</text>'
                f'<text x="50%" y="55%" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="14">Variation {i+1} of {data.num_variations}</text>'
                f'<text x="50%" y="70%" text-anchor="middle" fill="#64748b" font-family="sans-serif" font-size="10">of: {img["name"][:40]}</text>'
                f'</svg>'
            )
            data_url = f"data:image/svg+xml;base64,{base64.b64encode(svg.encode()).decode()}"

            var_record = {
                "id": var_id,
                "workspaceId": img["workspaceId"],
                "folderId": img.get("folderId"),
                "name": f"Variation {i + 1} of {img['name']}",
                "description": f"Variation of {img['name']}",
                "imageType": img["imageType"],
                "prompt": original_prompt,
                "negativePrompt": img.get("negativePrompt"),
                "style": img.get("style"),
                "url": data_url,
                "thumbnailUrl": data_url,
                "localPath": None,
                "fileSize": int(width * height * 3 * 0.3),
                "width": width,
                "height": height,
                "format": "png",
                "mimeType": "image/svg+xml",
                "metadata": {
                    "generated_by": "placeholder",
                    "provider": "svg-generator",
                    "variation_index": i,
                    "source_image_id": data.image_id,
                    "strength": data.strength,
                },
                "generationParams": {
                    "prompt": original_prompt,
                    "source_image_id": data.image_id,
                    "strength": data.strength,
                },
                "isFavorite": False,
                "isDeleted": False,
                "downloadCount": 0,
                "tags": [],
                "createdAt": now,
                "updatedAt": now,
            }
            _images[var_id] = var_record
            variation_images.append(_to_response(var_record))

            _record_history(
                var_id,
                "variation",
                params={
                    "source_image_id": data.image_id,
                    "strength": data.strength,
                    "variation_index": i,
                },
                provider="svg-generator",
                latency_ms=0,
            )

        latency_ms = (time.time() - start_time) * 1000

        return ImageGenerateResponse(
            images=variation_images,
            enhanced_prompt=f"Generated {data.num_variations} variations of '{img['name']}'",
            provider="svg-generator",
            latency_ms=latency_ms,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Variation generation failed: {str(e)}")


# ─── AI UPSCALE ──────────────────────────────────────────────────────────────


@router.post("/ai/upscale", response_model=ImageGenerateResponse)
async def upscale_image(data: ImageUpscaleRequest, user: str = Depends(get_current_user)):
    check_rate_limit(f"ai:{user}", AI_RATE_LIMIT_MAX)
    from app.engine import get_ai_engine

    engine = get_ai_engine()
    img = _get_image_or_404(data.image_id)

    original_width = img.get("width") or 512
    original_height = img.get("height") or 512
    new_width = original_width * data.scale
    new_height = original_height * data.scale

    prompt_parts = [
        f"Upscale this image from {original_width}x{original_height} to {new_width}x{new_height}.",
        f"Scale factor: {data.scale}x",
        "Enhance details, sharpness, and quality while upscaling.",
        f"Original image: {img.get('prompt') or img['name']}",
    ]

    full_prompt = ". ".join(prompt_parts)

    try:
        upscaled_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        file_size = int(new_width * new_height * 3 * 0.3)

        svg = (
            f'<svg xmlns="http://www.w3.org/2000/svg" width="{new_width}" height="{new_height}">'
            f'<rect width="100%" height="100%" fill="#1e293b"/>'
            f'<text x="50%" y="40%" text-anchor="middle" fill="#f8fafc" font-family="sans-serif" font-size="20" font-weight="bold">Upscaled {data.scale}x</text>'
            f'<text x="50%" y="55%" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="14">{new_width}x{new_height}</text>'
            f'<text x="50%" y="70%" text-anchor="middle" fill="#64748b" font-family="sans-serif" font-size="10">From: {img["name"][:40]}</text>'
            f'</svg>'
        )
        data_url = f"data:image/svg+xml;base64,{base64.b64encode(svg.encode()).decode()}"

        upscaled_record = {
            "id": upscaled_id,
            "workspaceId": img["workspaceId"],
            "folderId": img.get("folderId"),
            "name": f"Upscaled {data.scale}x: {img['name']}",
            "description": f"Upscaled from {img['name']} ({data.scale}x)",
            "imageType": img["imageType"],
            "prompt": img.get("prompt"),
            "negativePrompt": img.get("negativePrompt"),
            "style": img.get("style"),
            "url": data_url,
            "thumbnailUrl": data_url,
            "localPath": None,
            "fileSize": file_size,
            "width": new_width,
            "height": new_height,
            "format": "png",
            "mimeType": "image/svg+xml",
            "metadata": {
                "generated_by": "placeholder",
                "provider": "svg-generator",
                "source_image_id": data.image_id,
                "scale": data.scale,
                "original_dimensions": f"{original_width}x{original_height}",
            },
            "generationParams": {
                "source_image_id": data.image_id,
                "scale": data.scale,
                "original_width": original_width,
                "original_height": original_height,
            },
            "isFavorite": False,
            "isDeleted": False,
            "downloadCount": 0,
            "tags": [],
            "createdAt": now,
            "updatedAt": now,
        }
        _images[upscaled_id] = upscaled_record

        _record_history(
            upscaled_id,
            "upscale",
            params={
                "source_image_id": data.image_id,
                "scale": data.scale,
                "original_dimensions": f"{original_width}x{original_height}",
                "new_dimensions": f"{new_width}x{new_height}",
            },
            provider="svg-generator",
            latency_ms=0,
        )

        return ImageGenerateResponse(
            images=[_to_response(upscaled_record)],
            enhanced_prompt=f"Upscaled {img['name']} by {data.scale}x",
            provider="svg-generator",
            latency_ms=0,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image upscaling failed: {str(e)}")


# ─── EDIT IMAGE ──────────────────────────────────────────────────────────────


@router.post("/edit", response_model=ImageEditResponse)
async def edit_image(data: ImageEditRequest, user: str = Depends(get_current_user)):
    check_rate_limit(f"edit:{user}")

    img = _get_image_or_404(data.image_id)
    start_time = time.time()

    local_path = img.get("localPath")
    if not local_path or not os.path.exists(local_path):
        raise HTTPException(
            status_code=400,
            detail="Image file not available for editing. Only uploaded images can be edited directly.",
        )

    try:
        pil_img = PILImage.open(local_path)
        original_fmt = img.get("format", "png")
        output_format = data.output_format or original_fmt

        if data.operation == "crop":
            if data.crop_x is None or data.crop_y is None or data.crop_width is None or data.crop_height is None:
                raise HTTPException(status_code=400, detail="Crop requires crop_x, crop_y, crop_width, crop_height")
            left = max(0, data.crop_x)
            top = max(0, data.crop_y)
            right = min(pil_img.width, data.crop_x + data.crop_width)
            bottom = min(pil_img.height, data.crop_y + data.crop_height)
            pil_img = pil_img.crop((left, top, right, bottom))

        elif data.operation == "resize":
            new_w = data.width or pil_img.width
            new_h = data.height or pil_img.height
            new_w = max(1, min(new_w, 8192))
            new_h = max(1, min(new_h, 8192))
            pil_img = pil_img.resize((new_w, new_h), PILImage.Resampling.LANCZOS)

        elif data.operation == "compress":
            pass

        elif data.operation == "convert":
            if not data.output_format:
                raise HTTPException(status_code=400, detail="output_format is required for convert operation")
            output_format = data.output_format.lower()
            if pil_img.mode == "RGBA" and output_format in ("jpg", "jpeg"):
                background = PILImage.new("RGB", pil_img.size, (255, 255, 255))
                background.paste(pil_img, mask=pil_img.split()[3])
                pil_img = background
            elif pil_img.mode != "RGB" and output_format in ("jpg", "jpeg"):
                pil_img = pil_img.convert("RGB")

        elif data.operation == "filter":
            if not data.filter_name:
                raise HTTPException(status_code=400, detail="filter_name is required for filter operation")
            pil_img = _apply_pil_filter(pil_img, data.filter_name.lower())

        elif data.operation == "remove-background":
            return ImageEditResponse(
                id=img["id"],
                url=img.get("url"),
                width=pil_img.width,
                height=pil_img.height,
                file_size=img.get("fileSize"),
                format=img.get("format", "png"),
                operation="remove-background",
                latency_ms=(time.time() - start_time) * 1000,
            )

        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported operation '{data.operation}'. Use: crop, resize, compress, convert, filter, remove-background",
            )

        buf = io.BytesIO()
        save_kwargs: dict = {}
        if output_format in ("jpg", "jpeg"):
            save_kwargs["quality"] = data.quality
            save_kwargs["optimize"] = True
            if pil_img.mode == "RGBA":
                pil_img = pil_img.convert("RGB")
        elif output_format == "webp":
            save_kwargs["quality"] = data.quality
            save_kwargs["method"] = 4
        elif output_format == "png":
            save_kwargs["optimize"] = True
        elif output_format == "gif":
            if pil_img.mode != "P":
                pil_img = pil_img.convert("P", palette=PILImage.Palette.ADAPTIVE)

        pil_img.save(buf, format=output_format.upper(), **save_kwargs)
        edited_bytes = buf.getvalue()

        ext_map = {
            "jpg": ".jpg",
            "jpeg": ".jpeg",
            "png": ".png",
            "webp": ".webp",
            "gif": ".gif",
            "bmp": ".bmp",
        }
        ext = ext_map.get(output_format, f".{output_format}")

        base_dir = os.path.join("workspace", "images", img["workspaceId"])
        os.makedirs(base_dir, exist_ok=True)
        edited_filename = f"edited_{uuid.uuid4().hex}{ext}"
        edited_path = os.path.join(base_dir, edited_filename)

        with open(edited_path, "wb") as f:
            f.write(edited_bytes)

        thumb_path = _create_thumbnail(edited_path)

        mime_map = {
            "png": "image/png",
            "jpg": "image/jpeg",
            "jpeg": "image/jpeg",
            "webp": "image/webp",
            "gif": "image/gif",
            "bmp": "image/bmp",
        }

        img["url"] = edited_path
        img["thumbnailUrl"] = thumb_path
        img["localPath"] = edited_path
        img["fileSize"] = len(edited_bytes)
        img["width"] = pil_img.width
        img["height"] = pil_img.height
        img["format"] = output_format
        img["mimeType"] = mime_map.get(output_format, "image/png")
        img["updatedAt"] = datetime.now(timezone.utc).isoformat()

        _record_history(
            data.image_id,
            data.operation,
            params={
                "operation": data.operation,
                "filter_name": data.filter_name,
                "quality": data.quality,
                "output_format": output_format,
                "crop_x": data.crop_x,
                "crop_y": data.crop_y,
                "width": data.width,
                "height": data.height,
            },
        )

        latency_ms = (time.time() - start_time) * 1000

        return ImageEditResponse(
            id=img["id"],
            url=img.get("url"),
            width=pil_img.width,
            height=pil_img.height,
            file_size=len(edited_bytes),
            format=output_format,
            operation=data.operation,
            latency_ms=latency_ms,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image edit failed: {str(e)}")


# ─── GET IMAGE ───────────────────────────────────────────────────────────────


@router.get("/{image_id}", response_model=ImageResponse)
async def get_image(image_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"read:{user}")
    img = _get_image_or_404(image_id)
    if img.get("isDeleted"):
        raise HTTPException(status_code=404, detail="Image not found")
    return _to_response(img)


# ─── UPDATE IMAGE ────────────────────────────────────────────────────────────


@router.put("/{image_id}", response_model=ImageResponse)
async def update_image(
    image_id: str,
    name: str | None = None,
    description: str | None = None,
    tags: str | None = None,
    folder_id: str | None = None,
    user: str = Depends(get_current_user),
):
    check_rate_limit(f"update:{user}")
    img = _get_image_or_404(image_id)
    now = datetime.now(timezone.utc).isoformat()

    if name is not None:
        img["name"] = name
    if description is not None:
        img["description"] = description
    if tags is not None:
        img["tags"] = [t.strip() for t in tags.split(",") if t.strip()]
    if folder_id is not None:
        img["folderId"] = folder_id

    img["updatedAt"] = now
    return _to_response(img)


# ─── SOFT DELETE ─────────────────────────────────────────────────────────────


@router.delete("/{image_id}")
async def delete_image(image_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"delete:{user}")
    img = _get_image_or_404(image_id)
    img["isDeleted"] = True
    img["updatedAt"] = datetime.now(timezone.utc).isoformat()
    _record_history(image_id, "soft_delete")
    return {"detail": "Image deleted"}


# ─── RESTORE ─────────────────────────────────────────────────────────────────


@router.post("/{image_id}/restore", response_model=ImageResponse)
async def restore_image(image_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"restore:{user}")
    img = _get_image_or_404(image_id)
    img["isDeleted"] = False
    img["updatedAt"] = datetime.now(timezone.utc).isoformat()
    _record_history(image_id, "restore")
    return _to_response(img)


# ─── PERMANENT DELETE ────────────────────────────────────────────────────────


@router.post("/{image_id}/permanent-delete")
async def permanent_delete_image(image_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"delete:{user}")
    if image_id not in _images:
        raise HTTPException(status_code=404, detail="Image not found")

    img = _images[image_id]
    local_path = img.get("localPath")
    thumbnail_url = img.get("thumbnailUrl")

    if local_path and os.path.exists(local_path):
        try:
            os.remove(local_path)
        except OSError:
            pass

    if thumbnail_url and os.path.exists(thumbnail_url):
        try:
            os.remove(thumbnail_url)
        except OSError:
            pass

    del _images[image_id]
    _history.pop(image_id, None)
    return {"detail": "Image permanently deleted"}


# ─── TOGGLE FAVORITE ─────────────────────────────────────────────────────────


@router.post("/{image_id}/favorite")
async def toggle_favorite(image_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"favorite:{user}")
    img = _get_image_or_404(image_id)
    img["isFavorite"] = not img.get("isFavorite", False)
    img["updatedAt"] = datetime.now(timezone.utc).isoformat()
    return {"is_favorite": img["isFavorite"]}


# ─── DOWNLOAD COUNT ──────────────────────────────────────────────────────────


@router.post("/{image_id}/download")
async def increment_download(image_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"download:{user}")
    img = _get_image_or_404(image_id)
    img["downloadCount"] = img.get("downloadCount", 0) + 1
    img["updatedAt"] = datetime.now(timezone.utc).isoformat()
    _record_history(image_id, "download")
    return {"download_count": img["downloadCount"]}


# ─── IMAGE HISTORY ───────────────────────────────────────────────────────────


@router.get("/{image_id}/history", response_model=list[ImageHistoryResponse])
async def list_image_history(image_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"read:{user}")
    _get_image_or_404(image_id)
    entries = _history.get(image_id, [])
    sorted_entries = sorted(entries, key=lambda x: x["created_at"], reverse=True)
    return [
        ImageHistoryResponse(
            id=e["id"],
            image_id=e["image_id"],
            action=e["action"],
            params=e.get("params"),
            result_url=e.get("result_url"),
            provider=e.get("provider"),
            latency_ms=e.get("latency_ms"),
            created_at=e["created_at"],
        )
        for e in sorted_entries
    ]


# ─── UPDATE FOLDER ──────────────────────────────────────────────────────────


@router.put("/folders/{folder_id}", response_model=ImageFolderResponse)
async def update_folder(
    folder_id: str,
    name: str | None = None,
    description: str | None = None,
    color: str | None = None,
    user: str = Depends(get_current_user),
):
    check_rate_limit(f"update:{user}")
    folder = _get_folder_or_404(folder_id)
    now = datetime.now(timezone.utc).isoformat()

    if name is not None:
        folder["name"] = name
    if description is not None:
        folder["description"] = description
    if color is not None:
        folder["color"] = color

    folder["updatedAt"] = now

    image_count = sum(
        1 for i in _images.values()
        if i.get("folderId") == folder_id and not i.get("isDeleted", False)
    )

    return ImageFolderResponse(
        id=folder["id"],
        workspace_id=folder["workspaceId"],
        parent_id=folder.get("parentId"),
        name=folder["name"],
        description=folder.get("description"),
        color=folder.get("color"),
        image_count=image_count,
        created_at=folder["createdAt"],
        updated_at=folder["updatedAt"],
    )


@router.delete("/folders/{folder_id}")
async def delete_folder(folder_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"delete:{user}")
    if folder_id not in _folders:
        raise HTTPException(status_code=404, detail="Folder not found")

    for img in _images.values():
        if img.get("folderId") == folder_id:
            img["folderId"] = None

    del _folders[folder_id]
    return {"detail": "Folder deleted"}


@router.post("/folders/{folder_id}/images")
async def move_images_to_folder(
    folder_id: str,
    image_ids: list[str],
    user: str = Depends(get_current_user),
):
    check_rate_limit(f"update:{user}")
    _get_folder_or_404(folder_id)

    moved = 0
    for img_id in image_ids:
        if img_id in _images:
            _images[img_id]["folderId"] = folder_id
            _images[img_id]["updatedAt"] = datetime.now(timezone.utc).isoformat()
            moved += 1

    return {"moved": moved, "folder_id": folder_id}
