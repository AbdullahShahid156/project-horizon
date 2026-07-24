import time
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.security import get_current_user
from app.schemas.social import (
    SocialAIRequest,
    SocialAIResponse,
    SocialCalendarEntryRequest,
    SocialCalendarResponse,
    SocialCampaignCreateRequest,
    SocialCampaignResponse,
    SocialGenerateRequest,
    SocialGenerateResponse,
    SocialPostCreateRequest,
    SocialPostResponse,
    SocialPostUpdateRequest,
    SocialStatsResponse,
)

router = APIRouter()

_posts: dict[str, dict] = {}
_campaigns: dict[str, dict] = {}
_calendars: dict[str, dict] = {}
_hashtags: dict[str, dict] = {}
_history: dict[str, list] = {}
_rate_limits: dict[str, list[float]] = {}

RATE_LIMIT_WINDOW = 60.0
RATE_LIMIT_MAX_REQUESTS = 60
AI_RATE_LIMIT_MAX = 10


# ─── AUTH / RATE LIMITING ────────────────────────────────────────────────────


def check_rate_limit(key: str, max_requests: int = RATE_LIMIT_MAX_REQUESTS) -> None:
    now = time.time()
    if key not in _rate_limits:
        _rate_limits[key] = []
    _rate_limits[key] = [t for t in _rate_limits[key] if now - t < RATE_LIMIT_WINDOW]
    if len(_rate_limits[key]) >= max_requests:
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Try again later.")
    _rate_limits[key].append(now)


# ─── HELPERS ─────────────────────────────────────────────────────────────────


def _to_post_response(post: dict) -> SocialPostResponse:
    return SocialPostResponse(
        id=post["id"],
        workspace_id=post["workspaceId"],
        campaign_id=post.get("campaignId"),
        platform=post["platform"],
        post_type=post["postType"],
        content=post["content"],
        headline=post.get("headline"),
        caption=post.get("caption"),
        hashtags=post.get("hashtags"),
        cta=post.get("cta"),
        emojis=post.get("emojis"),
        image_suggestions=post.get("imageSuggestions"),
        image_ids=post.get("imageIds"),
        carousel_content=post.get("carouselContent"),
        story_content=post.get("storyContent"),
        reel_script=post.get("reelScript"),
        poll_ideas=post.get("pollIdeas"),
        business=post.get("business"),
        brand=post.get("brand"),
        target_audience=post.get("targetAudience"),
        goal=post.get("goal"),
        tone=post.get("tone"),
        keywords=post.get("keywords"),
        status=post["status"],
        scheduled_date=post.get("scheduledDate"),
        published_at=post.get("publishedAt"),
        performance_score=post.get("performanceScore"),
        ai_generated=post.get("aiGenerated", False),
        ai_provider=post.get("aiProvider"),
        ai_latency_ms=post.get("aiLatencyMs"),
        created_at=post["createdAt"],
        updated_at=post["updatedAt"],
    )


def _to_campaign_response(campaign: dict) -> SocialCampaignResponse:
    return SocialCampaignResponse(
        id=campaign["id"],
        workspace_id=campaign["workspaceId"],
        name=campaign["name"],
        description=campaign.get("description"),
        platforms=campaign.get("platforms"),
        start_date=campaign.get("startDate"),
        end_date=campaign.get("endDate"),
        status=campaign["status"],
        target_audience=campaign.get("targetAudience"),
        goals=campaign.get("goals"),
        post_count=campaign.get("postCount", 0),
        created_at=campaign["createdAt"],
        updated_at=campaign["updatedAt"],
    )


def _to_calendar_response(entry: dict) -> SocialCalendarResponse:
    return SocialCalendarResponse(
        id=entry["id"],
        workspace_id=entry["workspaceId"],
        post_id=entry.get("postId"),
        date=entry["date"],
        platform=entry["platform"],
        status=entry["status"],
        notes=entry.get("notes"),
        created_at=entry["createdAt"],
        updated_at=entry["updatedAt"],
    )


def _validate_platform(platform: str) -> None:
    valid = {
        "instagram", "facebook", "twitter", "linkedin",
        "tiktok", "youtube", "pinterest", "threads", "x",
    }
    if platform.lower() not in valid:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid platform '{platform}'. Must be one of: {', '.join(sorted(valid))}",
        )


def _validate_post_type(post_type: str) -> None:
    valid = {"single", "carousel", "story", "reel", "poll", "thread", "article"}
    if post_type.lower() not in valid:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid post_type '{post_type}'. Must be one of: {', '.join(sorted(valid))}",
        )


# ─── POST STATS ──────────────────────────────────────────────────────────────


@router.get("/posts/stats", response_model=SocialStatsResponse)
async def get_post_stats(workspace_id: str = Query(default="dev-workspace"), user: str = Depends(get_current_user)):
    check_rate_limit(f"stats:{user}")
    posts = [p for p in _posts.values() if p["workspaceId"] == workspace_id]

    by_platform: dict[str, int] = {}
    by_status: dict[str, int] = {}
    by_type: dict[str, int] = {}
    ai_count = 0
    perf_scores: list[float] = []

    for p in posts:
        plat = p["platform"]
        by_platform[plat] = by_platform.get(plat, 0) + 1

        st = p["status"]
        by_status[st] = by_status.get(st, 0) + 1

        pt = p["postType"]
        by_type[pt] = by_type.get(pt, 0) + 1

        if p.get("aiGenerated"):
            ai_count += 1

        if p.get("performanceScore") is not None:
            perf_scores.append(p["performanceScore"])

    avg_perf = round(sum(perf_scores) / len(perf_scores), 2) if perf_scores else 0.0
    campaigns = [c for c in _campaigns.values() if c["workspaceId"] == workspace_id]

    return SocialStatsResponse(
        total_posts=len(posts),
        by_platform=by_platform,
        by_status=by_status,
        by_type=by_type,
        ai_generated_count=ai_count,
        avg_performance_score=avg_perf,
        total_campaigns=len(campaigns),
    )


# ─── POSTS LIST / CREATE ─────────────────────────────────────────────────────


@router.get("/posts", response_model=list[SocialPostResponse])
async def list_posts(
    workspace_id: str = Query(default="dev-workspace"),
    search: str | None = None,
    platform: str | None = None,
    post_type: str | None = None,
    status: str | None = None,
    campaign_id: str | None = None,
    is_deleted: bool = False,
    sort_by: str = "updated_at",
    sort_order: str = "desc",
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user: str = Depends(get_current_user),
):
    check_rate_limit(f"list:{user}")
    posts = [p for p in _posts.values() if p["workspaceId"] == workspace_id]

    if is_deleted:
        posts = [p for p in posts if p.get("deletedAt")]
    else:
        posts = [p for p in posts if not p.get("deletedAt")]

    if platform:
        posts = [p for p in posts if p["platform"].lower() == platform.lower()]
    if post_type:
        posts = [p for p in posts if p["postType"].lower() == post_type.lower()]
    if status:
        posts = [p for p in posts if p["status"].lower() == status.lower()]
    if campaign_id:
        posts = [p for p in posts if p.get("campaignId") == campaign_id]
    if search:
        search_lower = search.lower()
        posts = [
            p for p in posts
            if search_lower in (p.get("content") or "").lower()
            or search_lower in (p.get("headline") or "").lower()
            or search_lower in (p.get("caption") or "").lower()
            or search_lower in " ".join(p.get("hashtags") or []).lower()
        ]

    reverse = sort_order == "desc"
    sort_key_map = {
        "updated_at": lambda x: x["updatedAt"],
        "created_at": lambda x: x["createdAt"],
        "platform": lambda x: x["platform"].lower(),
        "status": lambda x: x["status"].lower(),
        "performance_score": lambda x: x.get("performanceScore") or 0.0,
    }
    key_fn = sort_key_map.get(sort_by, sort_key_map["updated_at"])
    posts.sort(key=key_fn, reverse=reverse)

    start = (page - 1) * page_size
    end = start + page_size
    total = len(posts)
    total_pages = (total + page_size - 1) // page_size
    return {
        "items": [_to_post_response(p) for p in posts[start:end]],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@router.post("/posts", response_model=SocialPostResponse)
async def create_post(data: SocialPostCreateRequest, user: str = Depends(get_current_user)):
    check_rate_limit(f"create:{user}")
    _validate_platform(data.platform)
    _validate_post_type(data.post_type)

    post_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    post = {
        "id": post_id,
        "workspaceId": data.workspace_id,
        "campaignId": data.campaign_id,
        "platform": data.platform.lower(),
        "postType": data.post_type.lower(),
        "content": data.content,
        "headline": data.headline,
        "caption": data.caption,
        "hashtags": data.hashtags or [],
        "cta": data.cta,
        "emojis": data.emojis or [],
        "imageSuggestions": None,
        "imageIds": data.image_ids or [],
        "carouselContent": data.carousel_content,
        "storyContent": data.story_content,
        "reelScript": data.reel_script,
        "pollIdeas": data.poll_ideas,
        "business": data.business,
        "brand": data.brand,
        "targetAudience": data.target_audience,
        "goal": data.goal,
        "tone": data.tone,
        "keywords": data.keywords or [],
        "status": "draft",
        "scheduledDate": data.scheduled_date,
        "publishedAt": None,
        "performanceScore": None,
        "aiGenerated": False,
        "aiProvider": None,
        "aiLatencyMs": None,
        "deletedAt": None,
        "createdAt": now,
        "updatedAt": now,
    }
    _posts[post_id] = post

    if data.campaign_id and data.campaign_id in _campaigns:
        _campaigns[data.campaign_id]["postCount"] = _campaigns[data.campaign_id].get("postCount", 0) + 1
        _campaigns[data.campaign_id]["updatedAt"] = now

    return _to_post_response(post)


# ─── POST GET / UPDATE / DELETE ──────────────────────────────────────────────


@router.get("/posts/{post_id}", response_model=SocialPostResponse)
async def get_post(post_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"read:{user}")
    if post_id not in _posts:
        raise HTTPException(status_code=404, detail="Post not found")
    post = _posts[post_id]
    if post.get("deletedAt"):
        raise HTTPException(status_code=404, detail="Post not found")
    return _to_post_response(post)


@router.put("/posts/{post_id}", response_model=SocialPostResponse)
async def update_post(
    post_id: str,
    data: SocialPostUpdateRequest,
    user: str = Depends(get_current_user),
):
    check_rate_limit(f"update:{user}")
    if post_id not in _posts:
        raise HTTPException(status_code=404, detail="Post not found")
    post = _posts[post_id]
    if post.get("deletedAt"):
        raise HTTPException(status_code=404, detail="Post not found")

    now = datetime.now(timezone.utc).isoformat()

    if data.content is not None:
        post["content"] = data.content
    if data.headline is not None:
        post["headline"] = data.headline
    if data.caption is not None:
        post["caption"] = data.caption
    if data.hashtags is not None:
        post["hashtags"] = data.hashtags
    if data.cta is not None:
        post["cta"] = data.cta
    if data.emojis is not None:
        post["emojis"] = data.emojis
    if data.image_ids is not None:
        post["imageIds"] = data.image_ids
    if data.status is not None:
        valid_statuses = {"draft", "scheduled", "published", "archived"}
        if data.status.lower() not in valid_statuses:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status '{data.status}'. Must be one of: {', '.join(sorted(valid_statuses))}",
            )
        post["status"] = data.status.lower()
    if data.scheduled_date is not None:
        post["scheduledDate"] = data.scheduled_date

    post["updatedAt"] = now
    return _to_post_response(post)


@router.delete("/posts/{post_id}")
async def delete_post(post_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"delete:{user}")
    if post_id not in _posts:
        raise HTTPException(status_code=404, detail="Post not found")
    post = _posts[post_id]
    if post.get("deletedAt"):
        raise HTTPException(status_code=404, detail="Post not found")
    post["deletedAt"] = datetime.now(timezone.utc).isoformat()
    post["status"] = "archived"
    return {"detail": "Post deleted"}


# ─── POST ACTIONS ────────────────────────────────────────────────────────────


@router.post("/posts/{post_id}/restore", response_model=SocialPostResponse)
async def restore_post(post_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"restore:{user}")
    if post_id not in _posts:
        raise HTTPException(status_code=404, detail="Post not found")
    post = _posts[post_id]
    if not post.get("deletedAt"):
        raise HTTPException(status_code=400, detail="Post is not deleted")
    now = datetime.now(timezone.utc).isoformat()
    post["deletedAt"] = None
    post["status"] = "draft"
    post["updatedAt"] = now
    return _to_post_response(post)


@router.post("/posts/{post_id}/duplicate", response_model=SocialPostResponse)
async def duplicate_post(post_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"duplicate:{user}")
    if post_id not in _posts:
        raise HTTPException(status_code=404, detail="Post not found")

    original = _posts[post_id]
    new_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    post = {
        **original,
        "id": new_id,
        "content": f"{original['content']} (Copy)",
        "status": "draft",
        "publishedAt": None,
        "performanceScore": None,
        "aiGenerated": original.get("aiGenerated", False),
        "aiProvider": original.get("aiProvider"),
        "aiLatencyMs": original.get("aiLatencyMs"),
        "deletedAt": None,
        "createdAt": now,
        "updatedAt": now,
    }
    _posts[new_id] = post
    return _to_post_response(post)


@router.post("/posts/{post_id}/publish", response_model=SocialPostResponse)
async def publish_post(post_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"publish:{user}")
    if post_id not in _posts:
        raise HTTPException(status_code=404, detail="Post not found")
    post = _posts[post_id]
    if post.get("deletedAt"):
        raise HTTPException(status_code=404, detail="Post not found")
    if post["status"] == "published":
        raise HTTPException(status_code=400, detail="Post is already published")

    now = datetime.now(timezone.utc).isoformat()
    post["status"] = "published"
    post["publishedAt"] = now
    post["updatedAt"] = now
    return _to_post_response(post)


@router.post("/posts/{post_id}/archive", response_model=SocialPostResponse)
async def archive_post(post_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"archive:{user}")
    if post_id not in _posts:
        raise HTTPException(status_code=404, detail="Post not found")
    post = _posts[post_id]
    if post.get("deletedAt"):
        raise HTTPException(status_code=404, detail="Post not found")

    now = datetime.now(timezone.utc).isoformat()
    post["status"] = "archived"
    post["updatedAt"] = now
    return _to_post_response(post)


@router.get("/posts/{post_id}/history")
async def get_post_history(post_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"read:{user}")
    if post_id not in _posts:
        raise HTTPException(status_code=404, detail="Post not found")
    history = _history.get(post_id, [])
    return history


# ─── AI GENERATE ─────────────────────────────────────────────────────────────


@router.post("/generate", response_model=SocialGenerateResponse)
async def generate_social_posts(data: SocialGenerateRequest, user: str = Depends(get_current_user)):
    check_rate_limit(f"ai:{user}", AI_RATE_LIMIT_MAX)
    from app.engine import get_ai_engine

    _validate_platform(data.platform)
    _validate_post_type(data.post_type)

    engine = get_ai_engine()

    prompt_parts = [
        f"Generate {data.num_variations} social media post(s) for the following:",
        f"Platform: {data.platform}",
        f"Post type: {data.post_type}",
    ]
    if data.business:
        prompt_parts.append(f"Business: {data.business}")
    if data.brand:
        prompt_parts.append(f"Brand: {data.brand}")
    if data.target_audience:
        prompt_parts.append(f"Target Audience: {data.target_audience}")
    if data.goal:
        prompt_parts.append(f"Goal: {data.goal}")
    if data.tone:
        prompt_parts.append(f"Tone: {data.tone}")
    if data.keywords:
        prompt_parts.append(f"Keywords: {', '.join(data.keywords)}")
    if data.cta:
        prompt_parts.append(f"Call to Action: {data.cta}")
    if data.topic:
        prompt_parts.append(f"Topic: {data.topic}")

    platform_tips = {
        "instagram": "Instagram posts work well with engaging visuals, hashtags, and a conversational tone. Keep captions under 2200 characters. Use 5-15 relevant hashtags.",
        "facebook": "Facebook posts should be engaging and shareable. Use a mix of text, links, and media. Keep it conversational.",
        "twitter": "Twitter/X posts must be concise (under 280 characters). Use hashtags strategically. Be punchy and direct.",
        "linkedin": "LinkedIn posts should be professional and value-driven. Use line breaks for readability. Share insights and thought leadership.",
        "tiktok": "TikTok content should be entertaining, trend-aware, and authentic. Hook viewers in the first 1-2 seconds.",
        "youtube": "YouTube content should be informative and engaging. Include timestamps, descriptions, and calls to subscribe.",
        "pinterest": "Pinterest pins should be visually appealing with clear descriptions. Use tall images and keyword-rich descriptions.",
        "threads": "Threads posts should be conversational and engaging. Use line breaks and emojis for readability.",
        "x": "X (Twitter) posts should be concise and impactful. Use threads for longer content.",
    }
    tip = platform_tips.get(data.platform.lower(), "Create engaging, platform-appropriate content.")
    prompt_parts.append(f"Platform best practices: {tip}")

    num = max(1, min(data.num_variations, 5))
    prompt_parts.append(f"\nGenerate exactly {num} post variation(s).")

    prompt_parts.append(
        "\nReturn a JSON object with a 'posts' array. Each post should have:\n"
        '- "content": the main post text\n'
        '- "headline": a catchy headline or hook\n'
        '- "caption": a caption with context\n'
        '- "hashtags": array of relevant hashtags (without #)\n'
        '- "cta": a call to action\n'
        '- "emojis": array of emojis to use\n'
        '- "image_suggestions": array of image ideas for the post\n'
    )

    full_prompt = "\n".join(prompt_parts)

    try:
        response = await engine.generate_json(
            prompt=full_prompt,
            system_instruction=(
                f"You are an expert social media content creator specializing in {data.platform} content. "
                "Create engaging, high-converting social media posts. "
                "Return only valid JSON without any markdown formatting."
            ),
            operation="social_generate",
            user_id=user,
        )

        json_data = response.json_data or {} if response.success else {}
        raw_posts = json_data.get("posts", [])

        if not raw_posts:
            raw_posts = [json_data]

        now = datetime.now(timezone.utc).isoformat()
        created_posts: list[dict] = []

        for raw in raw_posts[:num]:
            post_id = str(uuid.uuid4())
            post = {
                "id": post_id,
                "workspaceId": data.workspace_id,
                "campaignId": data.campaign_id,
                "platform": data.platform.lower(),
                "postType": data.post_type.lower(),
                "content": raw.get("content", ""),
                "headline": raw.get("headline"),
                "caption": raw.get("caption"),
                "hashtags": raw.get("hashtags", []),
                "cta": raw.get("cta"),
                "emojis": raw.get("emojis", []),
                "imageSuggestions": raw.get("image_suggestions", []),
                "imageIds": [],
                "carouselContent": None,
                "storyContent": None,
                "reelScript": None,
                "pollIdeas": None,
                "business": data.business,
                "brand": data.brand,
                "targetAudience": data.target_audience,
                "goal": data.goal,
                "tone": data.tone,
                "keywords": data.keywords or [],
                "status": "draft",
                "scheduledDate": None,
                "publishedAt": None,
                "performanceScore": None,
                "aiGenerated": True,
                "aiProvider": response.provider or "none",
                "aiLatencyMs": round(response.latency_ms or 0, 2),
                "deletedAt": None,
                "createdAt": now,
                "updatedAt": now,
            }
            _posts[post_id] = post
            created_posts.append(raw)

        return SocialGenerateResponse(
            posts=created_posts,
            provider=response.provider or "none",
            latency_ms=round(response.latency_ms or 0, 2),
        )
    except HTTPException:
        raise
    except Exception:
        return SocialGenerateResponse(
            posts=[], provider="none", latency_ms=0,
        )


# ─── AI ACTION ───────────────────────────────────────────────────────────────


@router.post("/ai/action", response_model=SocialAIResponse)
async def ai_action_on_post(data: SocialAIRequest, user: str = Depends(get_current_user)):
    check_rate_limit(f"ai:{user}", AI_RATE_LIMIT_MAX)

    if data.post_id not in _posts:
        raise HTTPException(status_code=404, detail="Post not found")

    post = _posts[data.post_id]
    if post.get("deletedAt"):
        raise HTTPException(status_code=404, detail="Post not found")

    from app.engine import get_ai_engine
    engine = get_ai_engine()

    valid_actions = {
        "rewrite", "expand", "shorten", "change-tone",
        "translate", "improve-engagement", "add-hashtags",
        "make-viral", "professional", "casual",
    }
    if data.action.lower() not in valid_actions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid action '{data.action}'. Must be one of: {', '.join(sorted(valid_actions))}",
        )

    action_descriptions = {
        "rewrite": "Rewrite this post with different wording while keeping the same meaning",
        "expand": "Expand this post with more detail and depth",
        "shorten": "Shorten this post to be more concise while keeping the key message",
        "change-tone": "Change the tone of this post to be more engaging",
        "translate": "Translate this post into a different language",
        "improve-engagement": "Rewrite this post to maximize engagement (likes, comments, shares)",
        "add-hashtags": "Suggest and add relevant hashtags to this post",
        "make-viral": "Rewrite this post to be more viral and shareable",
        "professional": "Rewrite this post in a professional, authoritative tone",
        "casual": "Rewrite this post in a casual, friendly tone",
    }

    action_text = action_descriptions.get(data.action.lower(), data.action)

    content_text = post["content"]
    if post.get("headline"):
        content_text = f"{post['headline']}\n\n{content_text}"
    if post.get("caption"):
        content_text = f"{content_text}\n\nCaption: {post['caption']}"

    try:
        prompt = (
            f"Platform: {post['platform']}\n"
            f"Post type: {post['postType']}\n"
            f"Action: {action_text}\n\n"
            f"Original post:\n{content_text}\n\n"
        )
        if post.get("hashtags"):
            prompt += f"Current hashtags: {', '.join(post['hashtags'])}\n"
        if data.context:
            prompt += f"Additional context: {data.context}\n\n"
        prompt += (
            "Return a JSON object with:\n"
            '- "content": the modified main post text\n'
            '- "headline": a catchy headline or hook\n'
            '- "caption": a caption with context\n'
            '- "hashtags": array of relevant hashtags (without #)\n'
        )

        response = await engine.generate_json(
            prompt=prompt,
            system_instruction=(
                f"You are an expert social media content creator for {post['platform']}. "
                "Modify the post according to the requested action while keeping it platform-appropriate. "
                "Return only valid JSON without any markdown formatting."
            ),
            operation=f"social_ai_{data.action}",
            user_id=user,
        )

        json_data = response.json_data or {} if response.success else {}
        new_content = json_data.get("content", post["content"])

        original_content = post["content"]
        now = datetime.now(timezone.utc).isoformat()

        if json_data.get("content"):
            post["content"] = json_data["content"]
        if json_data.get("headline"):
            post["headline"] = json_data["headline"]
        if json_data.get("caption"):
            post["caption"] = json_data["caption"]
        if json_data.get("hashtags"):
            post["hashtags"] = json_data["hashtags"]
        post["updatedAt"] = now

        history_entry = {
            "id": str(uuid.uuid4()),
            "postId": data.post_id,
            "action": data.action,
            "originalContent": original_content,
            "newContent": new_content,
            "provider": response.provider or "none",
            "latencyMs": round(response.latency_ms or 0, 2),
            "createdAt": now,
        }
        _history.setdefault(data.post_id, []).append(history_entry)

        return SocialAIResponse(
            post_id=data.post_id,
            content=new_content,
            action=data.action,
            provider=response.provider or "none",
            latency_ms=round(response.latency_ms or 0, 2),
        )
    except HTTPException:
        raise
    except Exception:
        original_content = post["content"]
        return SocialAIResponse(
            post_id=data.post_id,
            content=original_content,
            action=data.action,
            provider="none",
            latency_ms=0,
        )


# ─── CAMPAIGNS LIST / CREATE ─────────────────────────────────────────────────


@router.get("/campaigns", response_model=list[SocialCampaignResponse])
async def list_campaigns(
    workspace_id: str = Query(default="dev-workspace"),
    search: str | None = None,
    status: str | None = None,
    user: str = Depends(get_current_user),
):
    check_rate_limit(f"list:{user}")
    campaigns = [
        c for c in _campaigns.values()
        if c["workspaceId"] == workspace_id and not c.get("deletedAt")
    ]

    if status:
        campaigns = [c for c in campaigns if c["status"].lower() == status.lower()]
    if search:
        search_lower = search.lower()
        campaigns = [
            c for c in campaigns
            if search_lower in c["name"].lower()
            or search_lower in (c.get("description") or "").lower()
        ]

    campaigns.sort(key=lambda x: x["updatedAt"], reverse=True)

    for c in campaigns:
        c["postCount"] = sum(
            1 for p in _posts.values()
            if p.get("campaignId") == c["id"] and not p.get("deletedAt")
        )

    total = len(campaigns)
    return {
        "items": [_to_campaign_response(c) for c in campaigns],
        "total": total,
    }


@router.post("/campaigns", response_model=SocialCampaignResponse)
async def create_campaign(data: SocialCampaignCreateRequest, user: str = Depends(get_current_user)):
    check_rate_limit(f"create:{user}")
    campaign_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    if data.platforms:
        for plat in data.platforms:
            _validate_platform(plat)

    campaign = {
        "id": campaign_id,
        "workspaceId": data.workspace_id,
        "name": data.name,
        "description": data.description,
        "platforms": [p.lower() for p in (data.platforms or [])],
        "startDate": data.start_date,
        "endDate": data.end_date,
        "status": "active",
        "targetAudience": data.target_audience,
        "goals": data.goals or [],
        "postCount": 0,
        "deletedAt": None,
        "createdAt": now,
        "updatedAt": now,
    }
    _campaigns[campaign_id] = campaign
    return _to_campaign_response(campaign)


# ─── CAMPAIGNS GET / UPDATE / DELETE ─────────────────────────────────────────


@router.get("/campaigns/{campaign_id}", response_model=SocialCampaignResponse)
async def get_campaign(campaign_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"read:{user}")
    if campaign_id not in _campaigns:
        raise HTTPException(status_code=404, detail="Campaign not found")
    campaign = _campaigns[campaign_id]
    if campaign.get("deletedAt"):
        raise HTTPException(status_code=404, detail="Campaign not found")

    campaign["postCount"] = sum(
        1 for p in _posts.values()
        if p.get("campaignId") == campaign_id and not p.get("deletedAt")
    )
    return _to_campaign_response(campaign)


@router.put("/campaigns/{campaign_id}", response_model=SocialCampaignResponse)
async def update_campaign(
    campaign_id: str,
    data: SocialCampaignCreateRequest,
    user: str = Depends(get_current_user),
):
    check_rate_limit(f"update:{user}")
    if campaign_id not in _campaigns:
        raise HTTPException(status_code=404, detail="Campaign not found")
    campaign = _campaigns[campaign_id]
    if campaign.get("deletedAt"):
        raise HTTPException(status_code=404, detail="Campaign not found")

    now = datetime.now(timezone.utc).isoformat()

    if data.platforms:
        for plat in data.platforms:
            _validate_platform(plat)
        campaign["platforms"] = [p.lower() for p in data.platforms]

    if data.name is not None:
        campaign["name"] = data.name
    if data.description is not None:
        campaign["description"] = data.description
    if data.start_date is not None:
        campaign["startDate"] = data.start_date
    if data.end_date is not None:
        campaign["endDate"] = data.end_date
    if data.target_audience is not None:
        campaign["targetAudience"] = data.target_audience
    if data.goals is not None:
        campaign["goals"] = data.goals
    campaign["updatedAt"] = now

    campaign["postCount"] = sum(
        1 for p in _posts.values()
        if p.get("campaignId") == campaign_id and not p.get("deletedAt")
    )
    return _to_campaign_response(campaign)


@router.delete("/campaigns/{campaign_id}")
async def delete_campaign(campaign_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"delete:{user}")
    if campaign_id not in _campaigns:
        raise HTTPException(status_code=404, detail="Campaign not found")
    campaign = _campaigns[campaign_id]
    if campaign.get("deletedAt"):
        raise HTTPException(status_code=404, detail="Campaign not found")

    now = datetime.now(timezone.utc).isoformat()
    campaign["deletedAt"] = now
    campaign["status"] = "completed"
    campaign["updatedAt"] = now

    for p in _posts.values():
        if p.get("campaignId") == campaign_id and not p.get("deletedAt"):
            p["campaignId"] = None
            p["updatedAt"] = now

    return {"detail": "Campaign deleted"}


# ─── CALENDAR LIST / CREATE / UPDATE / DELETE ─────────────────────────────────


@router.get("/calendar", response_model=list[SocialCalendarResponse])
async def list_calendar(
    workspace_id: str = Query(default="dev-workspace"),
    month: int | None = None,
    year: int | None = None,
    platform: str | None = None,
    user: str = Depends(get_current_user),
):
    check_rate_limit(f"list:{user}")
    entries = [
        e for e in _calendars.values()
        if e["workspaceId"] == workspace_id
    ]

    if platform:
        entries = [e for e in entries if e["platform"].lower() == platform.lower()]

    if month and year:
        filtered = []
        for e in entries:
            try:
                entry_date = datetime.fromisoformat(e["date"].replace("Z", "+00:00"))
                if entry_date.month == month and entry_date.year == year:
                    filtered.append(e)
            except (ValueError, AttributeError):
                continue
        entries = filtered
    elif year:
        filtered = []
        for e in entries:
            try:
                entry_date = datetime.fromisoformat(e["date"].replace("Z", "+00:00"))
                if entry_date.year == year:
                    filtered.append(e)
            except (ValueError, AttributeError):
                continue
        entries = filtered

    entries.sort(key=lambda x: x["date"])
    return [_to_calendar_response(e) for e in entries]


@router.post("/calendar", response_model=SocialCalendarResponse)
async def create_calendar_entry(data: SocialCalendarEntryRequest, user: str = Depends(get_current_user)):
    check_rate_limit(f"create:{user}")
    _validate_platform(data.platform)

    if data.post_id and data.post_id not in _posts:
        raise HTTPException(status_code=404, detail="Post not found")

    entry_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    valid_statuses = {"draft", "scheduled", "published", "cancelled"}
    status = data.status.lower() if data.status.lower() in valid_statuses else "draft"

    entry = {
        "id": entry_id,
        "workspaceId": data.workspace_id,
        "postId": data.post_id,
        "date": data.date,
        "platform": data.platform.lower(),
        "status": status,
        "notes": data.notes,
        "createdAt": now,
        "updatedAt": now,
    }
    _calendars[entry_id] = entry
    return _to_calendar_response(entry)


@router.put("/calendar/{entry_id}", response_model=SocialCalendarResponse)
async def update_calendar_entry(
    entry_id: str,
    data: SocialCalendarEntryRequest,
    user: str = Depends(get_current_user),
):
    check_rate_limit(f"update:{user}")
    if entry_id not in _calendars:
        raise HTTPException(status_code=404, detail="Calendar entry not found")

    entry = _calendars[entry_id]
    now = datetime.now(timezone.utc).isoformat()

    _validate_platform(data.platform)

    if data.post_id and data.post_id not in _posts:
        raise HTTPException(status_code=404, detail="Post not found")

    valid_statuses = {"draft", "scheduled", "published", "cancelled"}

    if data.date is not None:
        entry["date"] = data.date
    if data.platform is not None:
        entry["platform"] = data.platform.lower()
    if data.status is not None:
        entry["status"] = data.status.lower() if data.status.lower() in valid_statuses else entry["status"]
    if data.post_id is not None:
        entry["postId"] = data.post_id
    if data.notes is not None:
        entry["notes"] = data.notes
    entry["updatedAt"] = now

    return _to_calendar_response(entry)


@router.delete("/calendar/{entry_id}")
async def delete_calendar_entry(entry_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"delete:{user}")
    if entry_id not in _calendars:
        raise HTTPException(status_code=404, detail="Calendar entry not found")
    del _calendars[entry_id]
    return {"detail": "Calendar entry deleted"}


# ─── HASHTAGS LIST / CREATE / DELETE ─────────────────────────────────────────


@router.get("/hashtags")
async def list_hashtags(
    workspace_id: str = Query(default="dev-workspace"),
    search: str | None = None,
    category: str | None = None,
    user: str = Depends(get_current_user),
):
    check_rate_limit(f"list:{user}")
    tags = [
        t for t in _hashtags.values()
        if t["workspaceId"] == workspace_id
    ]

    if category:
        tags = [t for t in tags if t.get("category", "").lower() == category.lower()]
    if search:
        search_lower = search.lower()
        tags = [
            t for t in tags
            if search_lower in t["tag"].lower()
            or search_lower in (t.get("description") or "").lower()
        ]

    tags.sort(key=lambda x: x["createdAt"], reverse=True)

    for t in tags:
        t["usageCount"] = sum(
            1 for p in _posts.values()
            if t["tag"] in (p.get("hashtags") or [])
        )

    return [
        {
            "id": t["id"],
            "workspace_id": t["workspaceId"],
            "tag": t["tag"],
            "category": t.get("category"),
            "description": t.get("description"),
            "usage_count": t.get("usageCount", 0),
            "created_at": t["createdAt"],
        }
        for t in tags
    ]


@router.post("/hashtags")
async def create_hashtag(
    data: dict,
    user: str = Depends(get_current_user),
):
    check_rate_limit(f"create:{user}")

    tag = data.get("tag", "")
    workspace_id = data.get("workspace_id", "dev-workspace")
    category = data.get("category")
    description = data.get("description")

    tag_clean = tag.strip().lstrip("#").lower()
    if not tag_clean:
        raise HTTPException(status_code=400, detail="Hashtag cannot be empty")

    existing = [
        t for t in _hashtags.values()
        if t["workspaceId"] == workspace_id and t["tag"].lower() == tag_clean
    ]
    if existing:
        raise HTTPException(status_code=409, detail=f"Hashtag #{tag_clean} already exists")

    hashtag_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    hashtag = {
        "id": hashtag_id,
        "workspaceId": workspace_id,
        "tag": tag_clean,
        "category": category,
        "description": description,
        "usageCount": 0,
        "createdAt": now,
    }
    _hashtags[hashtag_id] = hashtag

    return {
        "id": hashtag_id,
        "workspace_id": workspace_id,
        "tag": tag_clean,
        "category": category,
        "description": description,
        "usage_count": 0,
        "created_at": now,
    }


@router.delete("/hashtags/{hashtag_id}")
async def delete_hashtag(hashtag_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"delete:{user}")
    if hashtag_id not in _hashtags:
        raise HTTPException(status_code=404, detail="Hashtag not found")
    del _hashtags[hashtag_id]
    return {"detail": "Hashtag deleted"}
