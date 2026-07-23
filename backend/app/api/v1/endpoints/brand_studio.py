import re
import time
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.security import get_current_user
from app.schemas.brand import (
    BrandAIOptimizeRequest,
    BrandAIOptimizeResponse,
    BrandAssetResponse,
    BrandCreateRequest,
    BrandGenerateRequest,
    BrandGenerateResponse,
    BrandResponse,
    BrandStatsResponse,
    BrandUpdateRequest,
    BrandVersionResponse,
)

router = APIRouter()

_brands: dict[str, dict] = {}
_versions: dict[str, list[dict]] = {}
_assets: dict[str, list[dict]] = {}
_rate_limits: dict[str, list[float]] = {}

RATE_LIMIT_WINDOW = 60.0
RATE_LIMIT_MAX_REQUESTS = 60
AI_RATE_LIMIT_MAX = 10


def check_rate_limit(key: str, max_requests: int = RATE_LIMIT_MAX_REQUESTS) -> None:
    now = time.time()
    if key not in _rate_limits:
        _rate_limits[key] = []
    _rate_limits[key] = [t for t in _rate_limits[key] if now - t < RATE_LIMIT_WINDOW]
    if len(_rate_limits[key]) >= max_requests:
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Try again later.")
    _rate_limits[key].append(now)


def slugify(text: str) -> str:
    slug = text.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_]+", "-", slug)
    slug = re.sub(r"-+", "-", slug)
    return slug.strip("-")[:500]


def _to_response(brand: dict) -> BrandResponse:
    return BrandResponse(
        id=brand["id"],
        workspace_id=brand["workspaceId"],
        name=brand["name"],
        slug=brand["slug"],
        tagline=brand.get("tagline"),
        industry=brand.get("industry"),
        description=brand.get("description"),
        target_audience=brand.get("targetAudience"),
        brand_personality=brand.get("brandPersonality"),
        tone_of_voice=brand.get("toneOfVoice"),
        mission=brand.get("mission"),
        vision=brand.get("vision"),
        values=brand.get("values"),
        primary_color=brand.get("primaryColor", "#6366F1"),
        secondary_color=brand.get("secondaryColor", "#4F46E5"),
        accent_color=brand.get("accentColor", "#818CF8"),
        typography=brand.get("typography"),
        logo_style=brand.get("logoStyle"),
        icon_style=brand.get("iconStyle"),
        brand_summary=brand.get("brandSummary"),
        tagline_suggestions=brand.get("taglineSuggestions"),
        brand_voice=brand.get("brandVoice"),
        elevator_pitch=brand.get("elevatorPitch"),
        usp=brand.get("usp"),
        color_palette=brand.get("colorPalette"),
        font_pairings=brand.get("fontPairings"),
        icon_suggestions=brand.get("iconSuggestions"),
        brand_keywords=brand.get("brandKeywords"),
        brand_guidelines=brand.get("brandGuidelines"),
        current_version=brand.get("currentVersion", 1),
        is_favorite=brand.get("isFavorite", False),
        is_archived=brand.get("isArchived", False),
        created_at=brand["createdAt"],
        updated_at=brand["updatedAt"],
    )


# ─── STATS ─────────────────────────────────────────────────────────────────


@router.get("/stats", response_model=BrandStatsResponse)
async def get_brand_stats(workspace_id: str = Query(default="dev-workspace"), user: str = Depends(get_current_user)):
    check_rate_limit(f"stats:{user}")
    brands = [b for b in _brands.values() if b["workspaceId"] == workspace_id]
    by_industry: dict[str, int] = {}
    for b in brands:
        industry = b.get("industry") or "Other"
        by_industry[industry] = by_industry.get(industry, 0) + 1
    return BrandStatsResponse(
        total=len(brands),
        favorites=sum(1 for b in brands if b.get("isFavorite")),
        archived=sum(1 for b in brands if b.get("isArchived")),
        by_industry=by_industry,
    )


# ─── LIST / CREATE ──────────────────────────────────────────────────────────


@router.get("/", response_model=list[BrandResponse])
async def list_brands(
    workspace_id: str = Query(default="dev-workspace"),
    search: str | None = None,
    is_archived: bool | None = None,
    is_favorite: bool | None = None,
    industry: str | None = None,
    sort_by: str = "updated_at",
    sort_order: str = "desc",
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user: str = Depends(get_current_user),
):
    check_rate_limit(f"list:{user}")
    brands = [
        b for b in _brands.values()
        if b["workspaceId"] == workspace_id and not b.get("deletedAt")
    ]

    if is_archived is not None:
        brands = [b for b in brands if b.get("isArchived", False) == is_archived]
    if is_favorite is not None:
        brands = [b for b in brands if b.get("isFavorite", False) == is_favorite]
    if industry:
        brands = [b for b in brands if b.get("industry") == industry]
    if search:
        search_lower = search.lower()
        brands = [
            b for b in brands
            if search_lower in b["name"].lower()
            or search_lower in (b.get("tagline") or "").lower()
            or search_lower in (b.get("industry") or "").lower()
            or search_lower in (b.get("description") or "").lower()
        ]

    reverse = sort_order == "desc"
    if sort_by == "updated_at":
        brands.sort(key=lambda x: x["updatedAt"], reverse=reverse)
    elif sort_by == "created_at":
        brands.sort(key=lambda x: x["createdAt"], reverse=reverse)
    elif sort_by == "name":
        brands.sort(key=lambda x: x["name"].lower(), reverse=reverse)
    elif sort_by == "industry":
        brands.sort(key=lambda x: (x.get("industry") or "").lower(), reverse=reverse)

    start = (page - 1) * page_size
    end = start + page_size
    page_brands = brands[start:end]
    total = len(brands)
    total_pages = (total + page_size - 1) // page_size

    return {
        "items": [_to_response(b) for b in page_brands],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@router.post("/", response_model=BrandResponse)
async def create_brand(data: BrandCreateRequest, user: str = Depends(get_current_user)):
    check_rate_limit(f"create:{user}")
    brand_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    slug = slugify(data.name)

    brand = {
        "id": brand_id,
        "workspaceId": data.workspace_id,
        "name": data.name,
        "slug": slug,
        "tagline": data.tagline,
        "industry": data.industry,
        "description": data.description,
        "targetAudience": data.target_audience,
        "brandPersonality": data.brand_personality,
        "toneOfVoice": data.tone_of_voice,
        "mission": data.mission,
        "vision": data.vision,
        "values": data.values,
        "primaryColor": data.primary_color,
        "secondaryColor": data.secondary_color,
        "accentColor": data.accent_color,
        "typography": data.typography,
        "logoStyle": data.logo_style,
        "iconStyle": data.icon_style,
        "brandSummary": None,
        "taglineSuggestions": None,
        "brandVoice": None,
        "elevatorPitch": None,
        "usp": None,
        "colorPalette": None,
        "fontPairings": None,
        "iconSuggestions": None,
        "brandKeywords": None,
        "brandGuidelines": None,
        "currentVersion": 1,
        "isFavorite": False,
        "isArchived": False,
        "deletedAt": None,
        "createdAt": now,
        "updatedAt": now,
    }
    _brands[brand_id] = brand

    version_entry = {
        "id": str(uuid.uuid4()),
        "brandId": brand_id,
        "versionNumber": 1,
        "data": {
            "name": data.name,
            "tagline": data.tagline,
            "industry": data.industry,
            "description": data.description,
            "targetAudience": data.target_audience,
            "brandPersonality": data.brand_personality,
            "toneOfVoice": data.tone_of_voice,
            "mission": data.mission,
            "vision": data.vision,
            "values": data.values,
            "primaryColor": data.primary_color,
            "secondaryColor": data.secondary_color,
            "accentColor": data.accent_color,
            "typography": data.typography,
            "logoStyle": data.logo_style,
            "iconStyle": data.icon_style,
        },
        "changeSummary": "Initial creation",
        "createdAt": now,
    }
    _versions[brand_id] = [version_entry]

    return _to_response(brand)


# ─── AI GENERATE ────────────────────────────────────────────────────────────


@router.post("/generate", response_model=BrandGenerateResponse)
async def generate_brand(data: BrandGenerateRequest, user: str = Depends(get_current_user)):
    check_rate_limit(f"ai:{user}", AI_RATE_LIMIT_MAX)
    from app.engine import get_ai_engine

    engine = get_ai_engine()

    prompt_parts = [
        f"Generate a complete brand identity for: {data.name}",
    ]
    if data.industry:
        prompt_parts.append(f"Industry: {data.industry}")
    if data.target_audience:
        prompt_parts.append(f"Target Audience: {data.target_audience}")
    if data.brand_personality:
        prompt_parts.append(f"Brand Personality: {data.brand_personality}")
    if data.tone_of_voice:
        prompt_parts.append(f"Tone of Voice: {data.tone_of_voice}")
    if data.description:
        prompt_parts.append(f"Business Description: {data.description}")
    prompt_parts.append(f"Language: {data.language}")

    prompt_parts.append(
        "\nReturn a JSON object with these fields:\n"
        '- "tagline": a compelling brand tagline\n'
        '- "brand_summary": a 2-3 sentence brand summary\n'
        '- "tagline_suggestions": array of 5 alternative taglines\n'
        '- "mission": a clear mission statement\n'
        '- "vision": an inspiring vision statement\n'
        '- "values": array of 4-6 core brand values\n'
        '- "brand_voice": a description of the brand voice and tone\n'
        '- "elevator_pitch": a 30-second elevator pitch\n'
        '- "usp": a unique selling proposition\n'
        '- "color_palette": object with keys primary, secondary, accent, background, text (hex codes)\n'
        '- "font_pairings": array of 3 objects with keys heading and body (font names)\n'
        '- "icon_suggestions": array of 5 icon style suggestions\n'
        '- "brand_keywords": array of 8-10 brand-associated keywords\n'
        '- "brand_guidelines": a brief brand guidelines overview\n'
    )

    full_prompt = "\n".join(prompt_parts)

    try:
        response = await engine.generate_json(
            prompt=full_prompt,
            system_instruction=(
                "You are an expert brand strategist and designer. "
                "Generate a complete, cohesive brand identity. "
                "Return only valid JSON without any markdown formatting."
            ),
            operation="brand_generate",
            user_id=user,
        )

        json_data = response.json_data or {} if response.success else {}

        brand_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        slug = slugify(data.name)

        color_palette = json_data.get("color_palette", {})
        primary_color = color_palette.get("primary", "#6366F1")
        secondary_color = color_palette.get("secondary", "#4F46E5")
        accent_color = color_palette.get("accent", "#818CF8")

        brand = {
            "id": brand_id,
            "workspaceId": data.workspace_id,
            "name": data.name,
            "slug": slug,
            "tagline": json_data.get("tagline", ""),
            "industry": data.industry,
            "description": data.description,
            "targetAudience": data.target_audience,
            "brandPersonality": data.brand_personality,
            "toneOfVoice": data.tone_of_voice,
            "mission": json_data.get("mission", ""),
            "vision": json_data.get("vision", ""),
            "values": json_data.get("values", []),
            "primaryColor": primary_color,
            "secondaryColor": secondary_color,
            "accentColor": accent_color,
            "typography": None,
            "logoStyle": None,
            "iconStyle": None,
            "brandSummary": json_data.get("brand_summary", ""),
            "taglineSuggestions": json_data.get("tagline_suggestions", []),
            "brandVoice": json_data.get("brand_voice", ""),
            "elevatorPitch": json_data.get("elevator_pitch", ""),
            "usp": json_data.get("usp", ""),
            "colorPalette": color_palette,
            "fontPairings": json_data.get("font_pairings", []),
            "iconSuggestions": json_data.get("icon_suggestions", []),
            "brandKeywords": json_data.get("brand_keywords", []),
            "brandGuidelines": json_data.get("brand_guidelines", ""),
            "currentVersion": 1,
            "isFavorite": False,
            "isArchived": False,
            "deletedAt": None,
            "createdAt": now,
            "updatedAt": now,
        }
        _brands[brand_id] = brand

        version_entry = {
            "id": str(uuid.uuid4()),
            "brandId": brand_id,
            "versionNumber": 1,
            "data": {k: v for k, v in brand.items() if k not in (
                "id", "workspaceId", "slug", "currentVersion",
                "isFavorite", "isArchived", "deletedAt", "createdAt", "updatedAt",
            )},
            "changeSummary": "AI brand generation",
            "createdAt": now,
        }
        _versions[brand_id] = [version_entry]

        return BrandGenerateResponse(
            brand_id=brand_id,
            name=data.name,
            tagline=brand["tagline"],
            brand_summary=brand["brandSummary"],
            tagline_suggestions=brand["taglineSuggestions"],
            mission=brand["mission"],
            vision=brand["vision"],
            values=brand["values"],
            brand_voice=brand["brandVoice"],
            elevator_pitch=brand["elevatorPitch"],
            usp=brand["usp"],
            color_palette=brand["colorPalette"],
            font_pairings=brand["fontPairings"],
            icon_suggestions=brand["iconSuggestions"],
            brand_keywords=brand["brandKeywords"],
            brand_guidelines=brand["brandGuidelines"],
            primary_color=primary_color,
            secondary_color=secondary_color,
            accent_color=accent_color,
            provider=response.provider or "none",
            latency_ms=response.latency_ms or 0,
        )
    except HTTPException:
        raise
    except Exception:
        brand_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        slug = slugify(data.name)
        brand = {
            "id": brand_id, "workspaceId": data.workspace_id, "name": data.name,
            "slug": slug, "tagline": "", "industry": data.industry,
            "description": data.description, "targetAudience": data.target_audience,
            "brandPersonality": data.brand_personality, "toneOfVoice": data.tone_of_voice,
            "mission": "", "vision": "", "values": [],
            "primaryColor": "#6366F1", "secondaryColor": "#4F46E5", "accentColor": "#818CF8",
            "typography": None, "logoStyle": None, "iconStyle": None,
            "brandSummary": "", "taglineSuggestions": [], "brandVoice": "",
            "elevatorPitch": "", "usp": "", "colorPalette": {},
            "fontPairings": [], "iconSuggestions": [], "brandKeywords": [],
            "brandGuidelines": "", "currentVersion": 1, "isFavorite": False,
            "isArchived": False, "deletedAt": None, "createdAt": now, "updatedAt": now,
        }
        _brands[brand_id] = brand
        return BrandGenerateResponse(
            brand_id=brand_id, name=data.name, tagline="", brand_summary="",
            tagline_suggestions=[], mission="", vision="", values=[],
            brand_voice="", elevator_pitch="", usp="", color_palette={},
            font_pairings=[], icon_suggestions=[], brand_keywords=[],
            brand_guidelines="", primary_color="#6366F1", secondary_color="#4F46E5",
            accent_color="#818CF8", provider="none", latency_ms=0,
        )


# ─── AI OPTIMIZE ────────────────────────────────────────────────────────────


@router.post("/ai/optimize", response_model=BrandAIOptimizeResponse)
async def ai_optimize_brand(data: BrandAIOptimizeRequest, user: str = Depends(get_current_user)):
    check_rate_limit(f"ai:{user}", AI_RATE_LIMIT_MAX)
    from app.engine import get_ai_engine

    if data.brand_id not in _brands:
        raise HTTPException(status_code=404, detail="Brand not found")

    brand = _brands[data.brand_id]

    field_map = {
        "tagline": "tagline",
        "brand_summary": "brandSummary",
        "mission": "mission",
        "vision": "vision",
        "brand_voice": "brandVoice",
        "elevator_pitch": "elevatorPitch",
        "usp": "usp",
        "brand_guidelines": "brandGuidelines",
        "description": "description",
    }

    if data.field not in field_map:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid field '{data.field}'. Must be one of: {', '.join(field_map.keys())}",
        )

    original_value = brand.get(field_map[data.field]) or ""

    engine = get_ai_engine()

    action_descriptions = {
        "regenerate": "Rewrite this completely with a fresh approach",
        "rewrite": "Rewrite this with different wording while keeping the meaning",
        "improve": "Improve the quality, clarity, and impact",
        "shorten": "Make this shorter and more concise",
        "expand": "Expand this with more detail and depth",
        "professional": "Rewrite in a professional, authoritative tone",
        "friendly": "Rewrite in a warm, friendly tone",
        "luxury": "Rewrite in a premium, luxury tone",
        "persuasive": "Rewrite in a compelling, persuasive tone",
        "simplify": "Simplify for easy understanding",
    }

    action_text = action_descriptions.get(data.action, data.action)

    try:
        prompt = (
            f"Brand: {brand['name']}\n"
            f"Industry: {brand.get('industry') or 'General'}\n"
            f"Brand Personality: {brand.get('brandPersonality') or 'Professional'}\n"
            f"Tone of Voice: {brand.get('toneOfVoice') or 'Professional'}\n\n"
            f"Action: {action_text}\n"
            f"Field: {data.field}\n"
            f"Current content:\n{original_value}\n\n"
        )
        if data.context:
            prompt += f"Additional context: {data.context}\n\n"
        prompt += "Return ONLY the optimized text without explanations or markdown formatting."

        response = await engine.generate(
            prompt=prompt,
            system_instruction="You are an expert brand strategist. Optimize brand content according to the specified action.",
            operation="brand_ai_optimize",
            user_id=user,
        )

        optimized = response.text.strip() if response.success and response.text else original_value

        brand[field_map[data.field]] = optimized
        brand["updatedAt"] = datetime.now(timezone.utc).isoformat()

        return BrandAIOptimizeResponse(
            field=data.field,
            original=original_value,
            optimized=optimized,
            action=data.action,
            provider=response.provider or "none",
            latency_ms=response.latency_ms or 0,
        )
    except HTTPException:
        raise
    except Exception:
        return BrandAIOptimizeResponse(
            field=data.field,
            original=original_value,
            optimized=original_value,
            action=data.action,
            provider="none",
            latency_ms=0,
        )


# ─── GET / UPDATE / DELETE ──────────────────────────────────────────────────


@router.get("/{brand_id}", response_model=BrandResponse)
async def get_brand(brand_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"read:{user}")
    if brand_id not in _brands:
        raise HTTPException(status_code=404, detail="Brand not found")
    brand = _brands[brand_id]
    if brand.get("deletedAt"):
        raise HTTPException(status_code=404, detail="Brand not found")
    return _to_response(brand)


@router.put("/{brand_id}", response_model=BrandResponse)
async def update_brand(brand_id: str, data: BrandUpdateRequest, user: str = Depends(get_current_user)):
    check_rate_limit(f"update:{user}")
    if brand_id not in _brands:
        raise HTTPException(status_code=404, detail="Brand not found")

    brand = _brands[brand_id]
    now = datetime.now(timezone.utc).isoformat()

    field_map = {
        "name": "name",
        "tagline": "tagline",
        "industry": "industry",
        "description": "description",
        "target_audience": "targetAudience",
        "brand_personality": "brandPersonality",
        "tone_of_voice": "toneOfVoice",
        "mission": "mission",
        "vision": "vision",
        "values": "values",
        "primary_color": "primaryColor",
        "secondary_color": "secondaryColor",
        "accent_color": "accentColor",
        "typography": "typography",
        "logo_style": "logoStyle",
        "icon_style": "iconStyle",
    }

    snapshot: dict = {}
    for request_field, store_field in field_map.items():
        value = getattr(data, request_field)
        if value is not None:
            brand[store_field] = value
            snapshot[store_field] = value

    if data.name is not None:
        brand["slug"] = slugify(data.name)

    brand["updatedAt"] = now

    new_version = brand.get("currentVersion", 1) + 1
    brand["currentVersion"] = new_version

    version_entry = {
        "id": str(uuid.uuid4()),
        "brandId": brand_id,
        "versionNumber": new_version,
        "data": snapshot,
        "changeSummary": data.change_summary or "Manual update",
        "createdAt": now,
    }
    _versions.setdefault(brand_id, []).append(version_entry)

    return _to_response(brand)


@router.delete("/{brand_id}")
async def delete_brand(brand_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"delete:{user}")
    if brand_id not in _brands:
        raise HTTPException(status_code=404, detail="Brand not found")
    _brands[brand_id]["deletedAt"] = datetime.now(timezone.utc).isoformat()
    return {"detail": "Brand deleted"}


# ─── RESTORE / DUPLICATE / TOGGLE ──────────────────────────────────────────


@router.post("/{brand_id}/restore", response_model=BrandResponse)
async def restore_brand(brand_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"restore:{user}")
    if brand_id not in _brands:
        raise HTTPException(status_code=404, detail="Brand not found")
    brand = _brands[brand_id]
    brand["deletedAt"] = None
    brand["isArchived"] = False
    brand["updatedAt"] = datetime.now(timezone.utc).isoformat()
    return _to_response(brand)


@router.post("/{brand_id}/duplicate", response_model=BrandResponse)
async def duplicate_brand(brand_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"duplicate:{user}")
    if brand_id not in _brands:
        raise HTTPException(status_code=404, detail="Brand not found")

    original = _brands[brand_id]
    new_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    brand = {
        **original,
        "id": new_id,
        "name": f"{original['name']} (Copy)",
        "slug": slugify(f"{original['name']} copy"),
        "currentVersion": 1,
        "isFavorite": False,
        "isArchived": False,
        "deletedAt": None,
        "createdAt": now,
        "updatedAt": now,
    }
    _brands[new_id] = brand

    version_entry = {
        "id": str(uuid.uuid4()),
        "brandId": new_id,
        "versionNumber": 1,
        "data": {
            "name": brand["name"],
            "tagline": brand.get("tagline"),
            "industry": brand.get("industry"),
            "description": brand.get("description"),
            "targetAudience": brand.get("targetAudience"),
            "brandPersonality": brand.get("brandPersonality"),
            "toneOfVoice": brand.get("toneOfVoice"),
            "mission": brand.get("mission"),
            "vision": brand.get("vision"),
            "values": brand.get("values"),
            "primaryColor": brand.get("primaryColor"),
            "secondaryColor": brand.get("secondaryColor"),
            "accentColor": brand.get("accentColor"),
            "typography": brand.get("typography"),
            "logoStyle": brand.get("logoStyle"),
            "iconStyle": brand.get("iconStyle"),
        },
        "changeSummary": f"Duplicated from {original['name']}",
        "createdAt": now,
    }
    _versions[new_id] = [version_entry]

    return _to_response(brand)


@router.post("/{brand_id}/favorite")
async def toggle_favorite(brand_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"favorite:{user}")
    if brand_id not in _brands:
        raise HTTPException(status_code=404, detail="Brand not found")
    brand = _brands[brand_id]
    brand["isFavorite"] = not brand.get("isFavorite", False)
    brand["updatedAt"] = datetime.now(timezone.utc).isoformat()
    return {"is_favorite": brand["isFavorite"]}


@router.post("/{brand_id}/archive")
async def toggle_archive(brand_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"archive:{user}")
    if brand_id not in _brands:
        raise HTTPException(status_code=404, detail="Brand not found")
    brand = _brands[brand_id]
    brand["isArchived"] = not brand.get("isArchived", False)
    brand["updatedAt"] = datetime.now(timezone.utc).isoformat()
    return {"is_archived": brand["isArchived"]}


# ─── VERSIONS ───────────────────────────────────────────────────────────────


@router.get("/{brand_id}/versions", response_model=list[BrandVersionResponse])
async def list_versions(brand_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"read:{user}")
    if brand_id not in _brands:
        raise HTTPException(status_code=404, detail="Brand not found")
    versions = _versions.get(brand_id, [])
    return [
        BrandVersionResponse(
            id=v["id"],
            brand_id=v["brandId"],
            version_number=v["versionNumber"],
            data=v["data"],
            change_summary=v.get("changeSummary"),
            created_at=v["createdAt"],
        )
        for v in sorted(versions, key=lambda x: x["versionNumber"], reverse=True)
    ]


@router.post("/{brand_id}/versions/{version_id}/restore", response_model=BrandResponse)
async def restore_version(brand_id: str, version_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"restore:{user}")
    if brand_id not in _brands:
        raise HTTPException(status_code=404, detail="Brand not found")

    versions = _versions.get(brand_id, [])
    target = None
    for v in versions:
        if v["id"] == version_id:
            target = v
            break

    if not target:
        raise HTTPException(status_code=404, detail="Version not found")

    brand = _brands[brand_id]
    now = datetime.now(timezone.utc).isoformat()
    data = target["data"]

    field_map = {
        "name": "name",
        "tagline": "tagline",
        "industry": "industry",
        "description": "description",
        "targetAudience": "targetAudience",
        "brandPersonality": "brandPersonality",
        "toneOfVoice": "toneOfVoice",
        "mission": "mission",
        "vision": "vision",
        "values": "values",
        "primaryColor": "primaryColor",
        "secondaryColor": "secondaryColor",
        "accentColor": "accentColor",
        "typography": "typography",
        "logoStyle": "logoStyle",
        "iconStyle": "iconStyle",
    }

    for store_field in field_map.values():
        if store_field in data:
            brand[store_field] = data[store_field]

    if "name" in data:
        brand["slug"] = slugify(data["name"])

    brand["updatedAt"] = now

    new_version = brand.get("currentVersion", 1) + 1
    brand["currentVersion"] = new_version

    restore_entry = {
        "id": str(uuid.uuid4()),
        "brandId": brand_id,
        "versionNumber": new_version,
        "data": data.copy(),
        "changeSummary": f"Restored from version {target['versionNumber']}",
        "createdAt": now,
    }
    _versions[brand_id].append(restore_entry)

    return _to_response(brand)


# ─── ASSETS ─────────────────────────────────────────────────────────────────


@router.get("/assets/{brand_id}", response_model=list[BrandAssetResponse])
async def list_brand_assets(brand_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"list:{user}")
    if brand_id not in _brands:
        raise HTTPException(status_code=404, detail="Brand not found")
    assets = _assets.get(brand_id, [])
    return [
        BrandAssetResponse(
            id=a["id"],
            brand_id=a["brandId"],
            asset_type=a["assetType"],
            name=a["name"],
            url=a.get("url"),
            data=a.get("data"),
            metadata=a.get("metadata"),
            created_at=a["createdAt"],
        )
        for a in sorted(assets, key=lambda x: x["createdAt"], reverse=True)
    ]


@router.post("/assets/{brand_id}", response_model=BrandAssetResponse)
async def create_brand_asset(
    brand_id: str,
    asset_type: str,
    name: str,
    url: str | None = None,
    data: dict | None = None,
    metadata: dict | None = None,
    user: str = Depends(get_current_user),
):
    check_rate_limit(f"create:{user}")
    if brand_id not in _brands:
        raise HTTPException(status_code=404, detail="Brand not found")

    asset_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    asset = {
        "id": asset_id,
        "brandId": brand_id,
        "assetType": asset_type,
        "name": name,
        "url": url,
        "data": data,
        "metadata": metadata,
        "createdAt": now,
    }
    _assets.setdefault(brand_id, []).append(asset)

    return BrandAssetResponse(
        id=asset_id,
        brand_id=brand_id,
        asset_type=asset_type,
        name=name,
        url=url,
        data=data,
        metadata=metadata,
        created_at=now,
    )
