import math
import re
import time
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.security import get_current_user
from app.schemas.content import (
    ContentAIOptimizeRequest,
    ContentAIOptimizeResponse,
    ContentBulkUpdateRequest,
    ContentCreateRequest,
    ContentExportRequest,
    ContentExportResponse,
    ContentFolderCreateRequest,
    ContentFolderResponse,
    ContentGenerateRequest,
    ContentGenerateResponse,
    ContentItemResponse,
    ContentListResponse,
    ContentSEOAnalysis,
    ContentSEOAnalyzeRequest,
    ContentStatsResponse,
    ContentTagCreateRequest,
    ContentTagResponse,
    ContentTemplateCreateRequest,
    ContentTemplateResponse,
    ContentUpdateRequest,
    ContentVersionResponse,
)

router = APIRouter()

_items: dict[str, dict] = {}
_versions: dict[str, list[dict]] = {}
_folders: dict[str, dict] = {}
_tags: dict[str, dict] = {}
_item_tags: dict[str, dict[str, set[str]]] = {}
_templates: dict[str, dict] = {}
_exports: list[dict] = []
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


def count_words(text: str) -> int:
    if not text:
        return 0
    return len(text.split())


def analyze_seo(title: str, body: str, meta_title: str | None, meta_description: str | None, keywords: list[str] | None) -> dict:
    issues = []
    suggestions = []
    score = 100
    plain = re.sub(r"<[^>]+>", " ", body)
    words = plain.lower().split()
    word_count = len(words)

    if not title:
        issues.append({"type": "error", "message": "Title is required"})
        score -= 20
    elif len(title) < 30:
        issues.append({"type": "warning", "message": "Title is too short (aim for 30-60 characters)"})
        score -= 5
    elif len(title) > 60:
        issues.append({"type": "warning", "message": "Title is too long (aim for 30-60 characters)"})
        score -= 5

    if not meta_title:
        issues.append({"type": "warning", "message": "Meta title is not set"})
        score -= 10
    elif len(meta_title) > 60:
        issues.append({"type": "warning", "message": "Meta title exceeds 60 characters"})
        score -= 5

    if not meta_description:
        issues.append({"type": "warning", "message": "Meta description is not set"})
        score -= 10
    elif len(meta_description) < 120:
        issues.append({"type": "info", "message": "Meta description could be longer (aim for 120-160 characters)"})
        score -= 3
    elif len(meta_description) > 160:
        issues.append({"type": "warning", "message": "Meta description exceeds 160 characters"})
        score -= 5

    keyword_density = {}
    if keywords:
        for kw in keywords:
            kw_lower = kw.lower()
            count = words.count(kw_lower)
            density = (count / max(word_count, 1)) * 100
            keyword_density[kw] = round(density, 2)
            if count == 0:
                issues.append({"type": "warning", "message": f"Keyword '{kw}' not found in content"})
                score -= 5
            elif density > 3:
                issues.append({"type": "warning", "message": f"Keyword '{kw}' density is too high ({density:.1f}%) - avoid keyword stuffing"})
                score -= 5
    else:
        suggestions.append("Add target keywords to optimize for SEO")

    if word_count < 300:
        suggestions.append("Content is quite short. Aim for 300+ words for better SEO")
    elif word_count < 600:
        suggestions.append("Consider expanding content to 600+ words for comprehensive coverage")

    headings = re.findall(r"<h([1-6])[^>]*>(.*?)</h\1>", body, re.IGNORECASE)
    heading_counts = {str(i): 0 for i in range(1, 7)}
    for level, _ in headings:
        heading_counts[level] = heading_counts.get(level, 0) + 1
    heading_analysis = {"total": len(headings), "by_level": heading_counts}
    if heading_counts.get("1", 0) == 0:
        issues.append({"type": "warning", "message": "No H1 heading found"})
        score -= 5
    if len(headings) < 2:
        suggestions.append("Add more headings to improve content structure")

    links = re.findall(r'<a\s+[^>]*href="([^"]*)"', body)
    internal = [link for link in links if not link.startswith("http")]
    external = [link for link in links if link.startswith("http")]
    if len(links) == 0:
        suggestions.append("Add internal and external links to improve SEO")

    readability_score = 60
    sentences = re.split(r"[.!?]+", plain)
    sentence_count = len([s for s in sentences if s.strip()])
    if sentence_count > 0:
        avg_sentence_length = word_count / sentence_count
        if avg_sentence_length < 15:
            readability_score = 80
        elif avg_sentence_length < 25:
            readability_score = 70
        else:
            readability_score = 50
    if word_count > 0:
        syllable_count = sum(max(1, len(re.findall(r"[aeiouy]+", w.lower()))) for w in words)
        flesch = 206.835 - 1.015 * (word_count / max(sentence_count, 1)) - 84.6 * (syllable_count / max(word_count, 1))
        readability_score = max(0, min(100, int(flesch)))

    if readability_score < 50:
        suggestions.append("Simplify your sentences for better readability")

    links_internal = len(internal)
    links_external = len(external)
    if links_internal == 0:
        suggestions.append("Add internal links to improve site navigation")
    if links_external == 0:
        suggestions.append("Add external links to authoritative sources")

    score = max(0, min(100, score))

    return {
        "score": score,
        "issues": issues,
        "keyword_density": keyword_density,
        "readability": {
            "score": readability_score,
            "word_count": word_count,
            "sentence_count": sentence_count,
            "avg_sentence_length": round(word_count / max(sentence_count, 1), 1),
        },
        "heading_analysis": heading_analysis,
        "links": {"internal": links_internal, "external": links_external, "total": links_internal + links_external},
        "suggestions": suggestions,
    }


def _to_response(item: dict) -> ContentItemResponse:
    return ContentItemResponse(
        id=item["id"],
        workspace_id=item["workspaceId"],
        folder_id=item.get("folderId"),
        title=item["title"],
        slug=item["slug"],
        content_type=item["contentType"],
        status=item["status"],
        body=item.get("body"),
        html_body=item.get("htmlBody"),
        plain_body=item.get("plainBody"),
        metadata=item.get("metadata"),
        seo_data=item.get("seoData"),
        prompt_data=item.get("promptData"),
        generation_settings=item.get("generationSettings"),
        current_version=item.get("currentVersion", 1),
        word_count=item.get("wordCount", 0),
        is_favorite=item.get("isFavorite", False),
        is_archived=item.get("isArchived", False),
        tags=item.get("tags", []),
        created_at=item["createdAt"],
        updated_at=item["updatedAt"],
    )


@router.get("/stats", response_model=ContentStatsResponse)
async def get_content_stats(workspace_id: str = Query(default="dev-workspace"), user: str = Depends(get_current_user)):
    check_rate_limit(f"stats:{user}")
    items = [i for i in _items.values() if i["workspaceId"] == workspace_id]
    by_type = {}
    by_status = {}
    for item in items:
        ct = item["contentType"]
        by_type[ct] = by_type.get(ct, 0) + 1
        st = item["status"]
        by_status[st] = by_status.get(st, 0) + 1
    return ContentStatsResponse(
        total=len(items),
        drafts=by_status.get("draft", 0),
        published=by_status.get("published", 0),
        archived=sum(1 for i in items if i.get("isArchived")),
        favorites=sum(1 for i in items if i.get("isFavorite")),
        by_type=by_type,
        by_status=by_status,
    )


@router.get("/", response_model=ContentListResponse)
async def list_content(
    workspace_id: str = Query(default="dev-workspace"),
    content_type: str | None = None,
    folder_id: str | None = None,
    status: str | None = None,
    is_archived: bool = False,
    is_favorite: bool | None = None,
    tag: str | None = None,
    search: str | None = None,
    sort_by: str = "updated_at",
    sort_order: str = "desc",
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user: str = Depends(get_current_user),
):
    check_rate_limit(f"list:{user}")
    items = [
        i for i in _items.values()
        if i["workspaceId"] == workspace_id and not i.get("deletedAt")
    ]

    if content_type:
        items = [i for i in items if i["contentType"] == content_type]
    if folder_id:
        items = [i for i in items if i.get("folderId") == folder_id]
    if status:
        items = [i for i in items if i["status"] == status]
    if is_archived is not None:
        items = [i for i in items if i.get("isArchived", False) == is_archived]
    if is_favorite is not None:
        items = [i for i in items if i.get("isFavorite", False) == is_favorite]
    if tag:
        items = [i for i in items if tag in (i.get("tags") or [])]
    if search:
        search_lower = search.lower()
        items = [i for i in items if search_lower in i["title"].lower()]

    reverse = sort_order == "desc"
    if sort_by == "updated_at":
        items.sort(key=lambda x: x["updatedAt"], reverse=reverse)
    elif sort_by == "created_at":
        items.sort(key=lambda x: x["createdAt"], reverse=reverse)
    elif sort_by == "title":
        items.sort(key=lambda x: x["title"].lower(), reverse=reverse)
    elif sort_by == "word_count":
        items.sort(key=lambda x: x.get("wordCount", 0), reverse=reverse)

    total = len(items)
    total_pages = math.ceil(total / page_size)
    start = (page - 1) * page_size
    end = start + page_size
    page_items = items[start:end]

    return ContentListResponse(
        items=[_to_response(i) for i in page_items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.post("/", response_model=ContentItemResponse)
async def create_content(data: ContentCreateRequest, user: str = Depends(get_current_user)):
    check_rate_limit(f"create:{user}")
    item_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    slug = slugify(data.title)
    plain = data.plain_body or ""
    if data.html_body and not plain:
        plain = re.sub(r"<[^>]+>", " ", data.html_body)

    item = {
        "id": item_id,
        "workspaceId": data.workspace_id,
        "folderId": data.folder_id,
        "title": data.title,
        "slug": slug,
        "contentType": data.content_type,
        "status": "draft",
        "body": data.body,
        "htmlBody": data.html_body,
        "plainBody": plain,
        "metadata": data.metadata,
        "seoData": data.seo_data,
        "promptData": data.prompt_data,
        "generationSettings": data.generation_settings,
        "currentVersion": 1,
        "wordCount": count_words(plain),
        "isFavorite": False,
        "isArchived": False,
        "tags": data.tags or [],
        "createdAt": now,
        "updatedAt": now,
    }
    _items[item_id] = item

    version_entry = {
        "id": str(uuid.uuid4()),
        "contentId": item_id,
        "versionNumber": 1,
        "title": data.title,
        "body": data.body,
        "htmlBody": data.html_body,
        "plainBody": plain,
        "metadata": data.metadata,
        "changeSummary": "Initial creation",
        "isAutoSave": False,
        "createdAt": now,
    }
    _versions[item_id] = [version_entry]

    return _to_response(item)


@router.post("/generate", response_model=ContentGenerateResponse)
async def generate_content(data: ContentGenerateRequest, user: str = Depends(get_current_user)):
    check_rate_limit(f"ai:{user}", AI_RATE_LIMIT_MAX)
    from app.engine import get_ai_engine

    engine = get_ai_engine()

    prompt_parts = []
    prompt_parts.append(f"Generate a {data.content_type} for {data.business_name or 'a business'}")
    if data.product:
        prompt_parts.append(f"Product/Service: {data.product}")
    if data.industry:
        prompt_parts.append(f"Industry: {data.industry}")
    if data.target_audience:
        prompt_parts.append(f"Target Audience: {data.target_audience}")
    if data.keywords:
        prompt_parts.append(f"Keywords: {', '.join(data.keywords)}")
    if data.competitors:
        prompt_parts.append(f"Competitors: {', '.join(data.competitors)}")
    if data.call_to_action:
        prompt_parts.append(f"Call to Action: {data.call_to_action}")
    if data.additional_instructions:
        prompt_parts.append(f"Additional: {data.additional_instructions}")

    tone_map = {
        "professional": "professional and authoritative",
        "friendly": "warm and friendly",
        "luxury": "premium and sophisticated",
        "startup": "energetic and innovative",
        "technical": "precise and technical",
        "persuasive": "compelling and persuasive",
        "casual": "casual and conversational",
        "formal": "formal and business-like",
        "enthusiastic": "enthusiastic and excited",
    }
    tone_desc = tone_map.get(data.tone, data.tone)
    prompt_parts.append(f"Tone: {tone_desc}")

    length_map = {"short": "150-300 words", "medium": "400-800 words", "long": "1000-2000 words", "very_long": "2000-4000 words"}
    length_desc = length_map.get(data.length, "400-800 words")
    prompt_parts.append(f"Target length: {length_desc}")

    if data.language:
        prompt_parts.append(f"Language: {data.language}")
    if data.country:
        prompt_parts.append(f"Country/Region: {data.country}")

    full_prompt = "\n".join(prompt_parts)
    full_prompt += "\n\nReturn your response as a JSON object with this structure: {\"title\": \"...\", \"content\": \"the content text\", \"html\": \"the formatted HTML content\", \"seo\": {\"meta_title\": \"...\", \"meta_description\": \"...\", \"keywords\": [\"...\"]}}"

    try:
        response = await engine.generate_json(
            prompt=full_prompt,
            system_instruction=data.system_prompt or "You are an expert content writer. Create high-quality, engaging content optimized for the specified audience.",
            operation=f"content_generate_{data.content_type}",
            user_id=user,
        )

        json_data = response.json_data or {} if response.success else {}
        title = json_data.get("title", data.title or f"Generated {data.content_type}")
        content_text = json_data.get("content", "")
        html_content = json_data.get("html", f"<p>{content_text}</p>")
        seo = json_data.get("seo", {})

        item_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        slug = slugify(title)

        item = {
            "id": item_id,
            "workspaceId": data.workspace_id,
            "folderId": None,
            "title": title,
            "slug": slug,
            "contentType": data.content_type,
            "status": "draft",
            "body": {"text": content_text},
            "htmlBody": html_content,
            "plainBody": content_text,
            "metadata": {"generated_by": "ai", "provider": response.provider, "model": response.model},
            "seoData": seo,
            "promptData": {
                "business_name": data.business_name,
                "product": data.product,
                "industry": data.industry,
                "target_audience": data.target_audience,
                "tone": data.tone,
                "content_goal": data.content_goal,
                "keywords": data.keywords,
            },
            "generationSettings": {"provider": response.provider, "model": response.model},
            "currentVersion": 1,
            "wordCount": count_words(content_text),
            "isFavorite": False,
            "isArchived": False,
            "tags": [],
            "createdAt": now,
            "updatedAt": now,
        }
        _items[item_id] = item

        version_entry = {
            "id": str(uuid.uuid4()),
            "contentId": item_id,
            "versionNumber": 1,
            "title": title,
            "body": item["body"],
            "htmlBody": html_content,
            "plainBody": content_text,
            "metadata": item["metadata"],
            "changeSummary": "AI generation",
            "isAutoSave": False,
            "createdAt": now,
        }
        _versions[item_id] = [version_entry]

        return ContentGenerateResponse(
            content_id=item_id,
            title=title,
            body=item["body"],
            html_body=html_content,
            plain_body=content_text,
            word_count=item["wordCount"],
            seo_data=seo,
            provider=response.provider or "none",
            model=response.model or "unknown",
            latency_ms=response.latency_ms or 0,
            tokens={
                "prompt_tokens": response.tokens.prompt_tokens if response.tokens else 0,
                "completion_tokens": response.tokens.completion_tokens if response.tokens else 0,
                "total_tokens": response.tokens.total_tokens if response.tokens else 0,
                "estimated_cost": response.tokens.estimated_cost if response.tokens else 0,
            },
        )
    except HTTPException:
        raise
    except Exception:
        fallback_title = data.title or f"Generated {data.content_type}"
        fallback_content = ""
        fallback_html = f"<p>{fallback_content}</p>"
        item_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        item = {
            "id": item_id, "workspaceId": data.workspace_id, "folderId": None,
            "title": fallback_title, "slug": slugify(fallback_title),
            "contentType": data.content_type, "status": "draft",
            "body": {"text": fallback_content}, "htmlBody": fallback_html,
            "plainBody": fallback_content, "metadata": {"generated_by": "fallback"},
            "seoData": {}, "promptData": {}, "generationSettings": {},
            "currentVersion": 1, "wordCount": 0, "isFavorite": False,
            "isArchived": False, "tags": [], "createdAt": now, "updatedAt": now,
        }
        _items[item_id] = item
        return ContentGenerateResponse(
            content_id=item_id, title=fallback_title, body=item["body"],
            html_body=fallback_html, plain_body=fallback_content,
            word_count=0, seo_data={}, provider="none", model="unknown",
            latency_ms=0, tokens={"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0, "estimated_cost": 0},
        )


@router.post("/ai/optimize", response_model=ContentAIOptimizeResponse)
async def ai_optimize_content(data: ContentAIOptimizeRequest, user: str = Depends(get_current_user)):
    check_rate_limit(f"ai:{user}", AI_RATE_LIMIT_MAX)
    from app.engine import get_ai_engine

    engine = get_ai_engine()

    action_map = {
        "regenerate": "Rewrite this completely with a fresh approach",
        "rewrite": "Rewrite this with different wording while keeping the meaning",
        "improve": "Improve the quality, clarity, and impact",
        "shorten": "Make this shorter and more concise while keeping the meaning",
        "expand": "Expand this with more detail and depth",
        "professional": "Rewrite in a professional, authoritative tone",
        "friendly": "Rewrite in a warm, friendly, approachable tone",
        "luxury": "Rewrite in a premium, luxury, sophisticated tone",
        "startup": "Rewrite in an energetic, startup-friendly tone",
        "technical": "Rewrite in a precise, technical, data-driven tone",
        "persuasive": "Rewrite in a compelling, persuasive tone",
        "simplify": "Simplify this for easy understanding",
        "grammar_fix": "Fix all grammar and spelling errors",
        "seo_optimize": "Optimize for search engines while keeping it natural",
    }

    action_text = action_map.get(data.action, data.action)

    extra = ""
    if data.tone:
        extra += f"\nUse a {data.tone} tone."
    if data.context:
        extra += f"\nContext: {data.context}"
    if data.keywords:
        extra += f"\nInclude these keywords naturally: {', '.join(data.keywords)}"
    if data.content_type:
        extra += f"\nThis is {data.content_type} content."

    try:
        prompt = (
            f"Action: {action_text}\n\n"
            f"Text to optimize:\n{data.text}\n\n"
            f"{extra}\n\n"
            "Return ONLY the optimized text without explanations or markdown formatting."
        )

        response = await engine.generate(
            prompt=prompt,
            system_instruction="You are an expert content editor. Optimize the given text according to the specified action.",
            operation="content_optimize",
            user_id=user,
        )

        optimized = response.text.strip() if response.success and response.text else data.text

        return ContentAIOptimizeResponse(
            original=data.text,
            optimized=optimized,
            action=data.action,
            provider=response.provider or "none",
            latency_ms=response.latency_ms or 0,
        )
    except HTTPException:
        raise
    except Exception:
        return ContentAIOptimizeResponse(
            original=data.text,
            optimized=data.text,
            action=data.action,
            provider="none",
            latency_ms=0,
        )


@router.post("/ai/seo", response_model=ContentSEOAnalysis)
async def analyze_seo_content(data: ContentSEOAnalyzeRequest, user: str = Depends(get_current_user)):
    check_rate_limit(f"seo:{user}")
    result = analyze_seo(
        title=data.title,
        body=data.body,
        meta_title=data.meta_title,
        meta_description=data.meta_description,
        keywords=data.keywords,
    )
    return ContentSEOAnalysis(**result)


@router.post("/export", response_model=ContentExportResponse)
async def export_content(data: ContentExportRequest, user: str = Depends(get_current_user)):
    check_rate_limit(f"export:{user}")
    if data.format not in ("txt", "markdown", "html", "json"):
        raise HTTPException(status_code=400, detail="Unsupported format. Use txt, markdown, html, or json.")
    return {"content": data.content or "", "format": data.format, "filename": f"export.{data.format}"}


@router.get("/folders", response_model=list[ContentFolderResponse])
async def list_folders(workspace_id: str = Query(default="dev-workspace"), user: str = Depends(get_current_user)):
    check_rate_limit(f"list:{user}")
    folders = [f for f in _folders.values() if f["workspaceId"] == workspace_id]
    result = []
    for f in folders:
        item_count = sum(1 for i in _items.values() if i.get("folderId") == f["id"])
        result.append(ContentFolderResponse(
            id=f["id"],
            workspace_id=f["workspaceId"],
            name=f["name"],
            parent_id=f.get("parentId"),
            item_count=item_count,
            created_at=f["createdAt"],
            updated_at=f["updatedAt"],
        ))
    return result


@router.post("/folders", response_model=ContentFolderResponse)
async def create_folder(data: ContentFolderCreateRequest, user: str = Depends(get_current_user)):
    check_rate_limit(f"create:{user}")
    folder_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    folder = {
        "id": folder_id,
        "workspaceId": data.workspace_id,
        "name": data.name,
        "parentId": data.parent_id,
        "createdAt": now,
        "updatedAt": now,
    }
    _folders[folder_id] = folder
    return ContentFolderResponse(
        id=folder_id,
        workspace_id=data.workspace_id,
        name=data.name,
        parent_id=data.parent_id,
        item_count=0,
        created_at=now,
        updated_at=now,
    )


@router.get("/tags", response_model=list[ContentTagResponse])
async def list_tags(workspace_id: str = Query(default="dev-workspace"), user: str = Depends(get_current_user)):
    check_rate_limit(f"list:{user}")
    tags = [t for t in _tags.values() if t["workspaceId"] == workspace_id]
    result = []
    for t in tags:
        item_count = sum(1 for i in _items.values() if t["name"] in (i.get("tags") or []))
        result.append(ContentTagResponse(
            id=t["id"],
            workspace_id=t["workspaceId"],
            name=t["name"],
            color=t["color"],
            item_count=item_count,
            created_at=t["createdAt"],
        ))
    return result


@router.post("/tags", response_model=ContentTagResponse)
async def create_tag(data: ContentTagCreateRequest, user: str = Depends(get_current_user)):
    check_rate_limit(f"create:{user}")
    tag_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    tag = {
        "id": tag_id,
        "workspaceId": data.workspace_id,
        "name": data.name,
        "color": data.color,
        "createdAt": now,
    }
    _tags[tag_id] = tag
    return ContentTagResponse(
        id=tag_id,
        workspace_id=data.workspace_id,
        name=data.name,
        color=data.color,
        item_count=0,
        created_at=now,
    )


@router.get("/templates", response_model=list[ContentTemplateResponse])
async def list_templates(
    workspace_id: str = Query(default="dev-workspace"),
    content_type: str | None = None,
    user: str = Depends(get_current_user),
):
    check_rate_limit(f"list:{user}")
    templates = [t for t in _templates.values() if t["workspaceId"] == workspace_id]
    if content_type:
        templates = [t for t in templates if t["contentType"] == content_type]
    return [
        ContentTemplateResponse(
            id=t["id"],
            workspace_id=t["workspaceId"],
            name=t["name"],
            slug=t["slug"],
            description=t.get("description"),
            content_type=t["contentType"],
            category=t["category"],
            body=t["body"],
            system_prompt=t.get("systemPrompt"),
            generation_settings=t.get("generationSettings"),
            is_shared=t.get("isShared", False),
            is_favorite=t.get("isFavorite", False),
            use_count=t.get("useCount", 0),
            created_at=t["createdAt"],
            updated_at=t["updatedAt"],
        )
        for t in templates
    ]


@router.post("/templates", response_model=ContentTemplateResponse)
async def create_template(data: ContentTemplateCreateRequest, user: str = Depends(get_current_user)):
    check_rate_limit(f"create:{user}")
    template_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    slug = slugify(data.name)
    template = {
        "id": template_id,
        "workspaceId": data.workspace_id,
        "name": data.name,
        "slug": slug,
        "description": data.description,
        "contentType": data.content_type,
        "category": data.category,
        "body": data.body,
        "systemPrompt": data.system_prompt,
        "generationSettings": data.generation_settings,
        "isShared": False,
        "isFavorite": False,
        "useCount": 0,
        "createdAt": now,
        "updatedAt": now,
    }
    _templates[template_id] = template
    return ContentTemplateResponse(
        id=template_id,
        workspace_id=data.workspace_id,
        name=data.name,
        slug=slug,
        description=data.description,
        content_type=data.content_type,
        category=data.category,
        body=data.body,
        system_prompt=data.system_prompt,
        generation_settings=data.generation_settings,
        is_shared=False,
        is_favorite=False,
        use_count=0,
        created_at=now,
        updated_at=now,
    )


@router.post("/bulk-update")
async def bulk_update_content(data: ContentBulkUpdateRequest, user: str = Depends(get_current_user)):
    check_rate_limit(f"bulk:{user}")
    updated = 0
    for item_id in data.ids:
        if item_id in _items:
            item = _items[item_id]
            if data.folder_id is not None:
                item["folderId"] = data.folder_id
            if data.status is not None:
                item["status"] = data.status
            if data.is_archived is not None:
                item["isArchived"] = data.is_archived
            item["updatedAt"] = datetime.now(timezone.utc).isoformat()
            updated += 1
    return {"updated": updated}


@router.post("/bulk-delete")
async def bulk_delete_content(ids: list[str], user: str = Depends(get_current_user)):
    check_rate_limit(f"bulk:{user}")
    deleted = 0
    for item_id in ids:
        if item_id in _items:
            _items[item_id]["deletedAt"] = datetime.now(timezone.utc).isoformat()
            deleted += 1
    return {"deleted": deleted}


@router.get("/{item_id}", response_model=ContentItemResponse)
async def get_content(item_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"read:{user}")
    if item_id not in _items:
        raise HTTPException(status_code=404, detail="Content not found")
    item = _items[item_id]
    if item.get("deletedAt"):
        raise HTTPException(status_code=404, detail="Content not found")
    return _to_response(item)


@router.put("/{item_id}", response_model=ContentItemResponse)
async def update_content(item_id: str, data: ContentUpdateRequest, user: str = Depends(get_current_user)):
    check_rate_limit(f"update:{user}")
    if item_id not in _items:
        raise HTTPException(status_code=404, detail="Content not found")

    item = _items[item_id]
    now = datetime.now(timezone.utc).isoformat()

    if data.title is not None:
        item["title"] = data.title
        item["slug"] = slugify(data.title)
    if data.folder_id is not None:
        item["folderId"] = data.folder_id
    if data.body is not None:
        item["body"] = data.body
    if data.html_body is not None:
        item["htmlBody"] = data.html_body
    if data.plain_body is not None:
        item["plainBody"] = data.plain_body
        item["wordCount"] = count_words(data.plain_body)
    if data.metadata is not None:
        item["metadata"] = data.metadata
    if data.seo_data is not None:
        item["seoData"] = data.seo_data
    if data.status is not None:
        item["status"] = data.status
    if data.tags is not None:
        item["tags"] = data.tags
    item["updatedAt"] = now

    new_version = item.get("currentVersion", 1) + 1
    item["currentVersion"] = new_version

    version_entry = {
        "id": str(uuid.uuid4()),
        "contentId": item_id,
        "versionNumber": new_version,
        "title": item["title"],
        "body": item.get("body"),
        "htmlBody": item.get("htmlBody"),
        "plainBody": item.get("plainBody"),
        "metadata": item.get("metadata"),
        "changeSummary": data.change_summary or "Manual update",
        "isAutoSave": False,
        "createdAt": now,
    }
    _versions.setdefault(item_id, []).append(version_entry)

    return _to_response(item)


@router.post("/{item_id}/auto-save")
async def auto_save_content(item_id: str, data: ContentUpdateRequest, user: str = Depends(get_current_user)):
    check_rate_limit(f"autosave:{user}")
    if item_id not in _items:
        raise HTTPException(status_code=404, detail="Content not found")

    item = _items[item_id]
    now = datetime.now(timezone.utc).isoformat()

    if data.body is not None:
        item["body"] = data.body
    if data.html_body is not None:
        item["htmlBody"] = data.html_body
    if data.plain_body is not None:
        item["plainBody"] = data.plain_body
        item["wordCount"] = count_words(data.plain_body)
    if data.seo_data is not None:
        item["seoData"] = data.seo_data
    item["updatedAt"] = now

    version_entry = {
        "id": str(uuid.uuid4()),
        "contentId": item_id,
        "versionNumber": item.get("currentVersion", 1),
        "title": item["title"],
        "body": item.get("body"),
        "htmlBody": item.get("htmlBody"),
        "plainBody": item.get("plainBody"),
        "metadata": item.get("metadata"),
        "changeSummary": "Auto-save",
        "isAutoSave": True,
        "createdAt": now,
    }
    _versions.setdefault(item_id, []).append(version_entry)

    return {"status": "saved"}


@router.delete("/{item_id}")
async def delete_content(item_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"delete:{user}")
    if item_id not in _items:
        raise HTTPException(status_code=404, detail="Content not found")
    _items[item_id]["deletedAt"] = datetime.now(timezone.utc).isoformat()
    return {"detail": "Content deleted"}


@router.post("/{item_id}/restore")
async def restore_content(item_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"restore:{user}")
    if item_id not in _items:
        raise HTTPException(status_code=404, detail="Content not found")
    item = _items[item_id]
    item["deletedAt"] = None
    item["isArchived"] = False
    item["updatedAt"] = datetime.now(timezone.utc).isoformat()
    return _to_response(item)


@router.post("/{item_id}/duplicate", response_model=ContentItemResponse)
async def duplicate_content(item_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"duplicate:{user}")
    if item_id not in _items:
        raise HTTPException(status_code=404, detail="Content not found")

    original = _items[item_id]
    new_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    item = {
        **original,
        "id": new_id,
        "title": f"{original['title']} (Copy)",
        "slug": slugify(f"{original['title']} copy"),
        "status": "draft",
        "currentVersion": 1,
        "isFavorite": False,
        "isArchived": False,
        "createdAt": now,
        "updatedAt": now,
        "deletedAt": None,
    }
    _items[new_id] = item

    version_entry = {
        "id": str(uuid.uuid4()),
        "contentId": new_id,
        "versionNumber": 1,
        "title": item["title"],
        "body": item.get("body"),
        "htmlBody": item.get("htmlBody"),
        "plainBody": item.get("plainBody"),
        "metadata": item.get("metadata"),
        "changeSummary": f"Duplicated from {original['title']}",
        "isAutoSave": False,
        "createdAt": now,
    }
    _versions[new_id] = [version_entry]

    return _to_response(item)


@router.post("/{item_id}/favorite")
async def toggle_favorite(item_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"favorite:{user}")
    if item_id not in _items:
        raise HTTPException(status_code=404, detail="Content not found")
    item = _items[item_id]
    item["isFavorite"] = not item.get("isFavorite", False)
    item["updatedAt"] = datetime.now(timezone.utc).isoformat()
    return {"is_favorite": item["isFavorite"]}


@router.post("/{item_id}/archive")
async def toggle_archive(item_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"archive:{user}")
    if item_id not in _items:
        raise HTTPException(status_code=404, detail="Content not found")
    item = _items[item_id]
    item["isArchived"] = not item.get("isArchived", False)
    item["updatedAt"] = datetime.now(timezone.utc).isoformat()
    return {"is_archived": item["isArchived"]}


@router.get("/{item_id}/versions", response_model=list[ContentVersionResponse])
async def list_versions(item_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"read:{user}")
    if item_id not in _items:
        raise HTTPException(status_code=404, detail="Content not found")
    versions = _versions.get(item_id, [])
    return [
        ContentVersionResponse(
            id=v["id"],
            version_number=v["versionNumber"],
            title=v["title"],
            body=v.get("body"),
            html_body=v.get("htmlBody"),
            plain_body=v.get("plainBody"),
            metadata=v.get("metadata"),
            change_summary=v.get("changeSummary"),
            is_auto_save=v.get("isAutoSave", False),
            created_at=v["createdAt"],
        )
        for v in sorted(versions, key=lambda x: x["versionNumber"], reverse=True)
    ]


@router.post("/{item_id}/versions/{version_id}/restore", response_model=ContentItemResponse)
async def restore_version(item_id: str, version_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"restore:{user}")
    if item_id not in _items:
        raise HTTPException(status_code=404, detail="Content not found")

    versions = _versions.get(item_id, [])
    target = None
    for v in versions:
        if v["id"] == version_id:
            target = v
            break

    if not target:
        raise HTTPException(status_code=404, detail="Version not found")

    item = _items[item_id]
    now = datetime.now(timezone.utc).isoformat()

    item["title"] = target["title"]
    item["body"] = target.get("body")
    item["htmlBody"] = target.get("htmlBody")
    item["plainBody"] = target.get("plainBody")
    item["metadata"] = target.get("metadata")
    item["updatedAt"] = now

    new_version = item.get("currentVersion", 1) + 1
    item["currentVersion"] = new_version

    restore_entry = {
        "id": str(uuid.uuid4()),
        "contentId": item_id,
        "versionNumber": new_version,
        "title": target["title"],
        "body": target.get("body"),
        "htmlBody": target.get("htmlBody"),
        "plainBody": target.get("plainBody"),
        "metadata": target.get("metadata"),
        "changeSummary": f"Restored from version {target['versionNumber']}",
        "isAutoSave": False,
        "createdAt": now,
    }
    _versions[item_id].append(restore_entry)

    return _to_response(item)


@router.get("/content/{item_id}/export", response_model=ContentExportResponse)
async def export_content_item(item_id: str, format: str = "html", user: str = Depends(get_current_user)):
    check_rate_limit(f"export:{user}")
    if item_id not in _items:
        raise HTTPException(status_code=404, detail="Content not found")

    item = _items[item_id]
    title = item["title"]
    html = item.get("htmlBody", "")
    plain = item.get("plainBody", "")

    if format == "html":
        content = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
</head>
<body>
<h1>{title}</h1>
{html}
</body>
</html>"""
        filename = f"{slugify(title)}.html"
    elif format == "markdown":
        content = f"# {title}\n\n{plain}"
        filename = f"{slugify(title)}.md"
    elif format == "txt":
        content = f"{title}\n\n{plain}"
        filename = f"{slugify(title)}.txt"
    elif format == "json":
        import json
        content = json.dumps(item, indent=2, default=str)
        filename = f"{slugify(title)}.json"
    else:
        raise HTTPException(status_code=400, detail="Unsupported format")

    export_entry = {
        "id": str(uuid.uuid4()),
        "contentId": item_id,
        "format": format,
        "fileSize": len(content.encode()),
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }
    _exports.append(export_entry)

    return ContentExportResponse(content=content, format=format, filename=filename)


@router.delete("/folders/{folder_id}")
async def delete_folder(folder_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"delete:{user}")
    if folder_id not in _folders:
        raise HTTPException(status_code=404, detail="Folder not found")
    for item in _items.values():
        if item.get("folderId") == folder_id:
            item["folderId"] = None
    del _folders[folder_id]
    return {"detail": "Folder deleted"}


@router.delete("/tags/{tag_id}")
async def delete_tag(tag_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"delete:{user}")
    if tag_id not in _tags:
        raise HTTPException(status_code=404, detail="Tag not found")
    tag_name = _tags[tag_id]["name"]
    for item in _items.values():
        tags = item.get("tags") or []
        if tag_name in tags:
            item["tags"] = [t for t in tags if t != tag_name]
    del _tags[tag_id]
    return {"detail": "Tag deleted"}


@router.delete("/templates/{template_id}")
async def delete_template(template_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"delete:{user}")
    if template_id not in _templates:
        raise HTTPException(status_code=404, detail="Template not found")
    del _templates[template_id]
    return {"detail": "Template deleted"}


@router.post("/templates/{template_id}/duplicate", response_model=ContentTemplateResponse)
async def duplicate_template(template_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"duplicate:{user}")
    if template_id not in _templates:
        raise HTTPException(status_code=404, detail="Template not found")

    original = _templates[template_id]
    new_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    template = {
        **original,
        "id": new_id,
        "name": f"{original['name']} (Copy)",
        "slug": slugify(f"{original['name']} copy"),
        "isFavorite": False,
        "useCount": 0,
        "createdAt": now,
        "updatedAt": now,
    }
    _templates[new_id] = template
    return ContentTemplateResponse(
        id=new_id,
        workspace_id=template["workspaceId"],
        name=template["name"],
        slug=template["slug"],
        description=template.get("description"),
        content_type=template["contentType"],
        category=template["category"],
        body=template["body"],
        system_prompt=template.get("systemPrompt"),
        generation_settings=template.get("generationSettings"),
        is_shared=False,
        is_favorite=False,
        use_count=0,
        created_at=now,
        updated_at=now,
    )
