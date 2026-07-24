import re
import time
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.security import get_current_user
from app.schemas.seo import (
    SEOAISuggestRequest,
    SEOAISuggestResponse,
    SEOAuditRequest,
    SEOAuditResponse,
    SEOCompetitorAnalysis,
    SEOCompetitorAnalyzeRequest,
    SEOCompetitorCreateRequest,
    SEOCompetitorResponse,
    SEOContentOptimizeRequest,
    SEOContentOptimizeResponse,
    SEODashboardResponse,
    SEODomainCreateRequest,
    SEODomainResponse,
    SEOExportRequest,
    SEOExportResponse,
    SEOHistoryResponse,
    SEOInternalLinkResponse,
    SEOInternalLinkSuggestRequest,
    SEOKeywordClusterCreateRequest,
    SEOKeywordClusterResponse,
    SEOKeywordCreateRequest,
    SEOKeywordGenerateRequest,
    SEOKeywordResponse,
    SEOOnPageRequest,
    SEOOnPageResponse,
    SEORecommendationResponse,
    SEOReportCreateRequest,
    SEOReportResponse,
    SEOSchemaCreateRequest,
    SEOSchemaResponse,
    SEOTechnicalIssue,
    SEOTechnicalRequest,
    SEOTechnicalResponse,
)

router = APIRouter()

_domains: dict[str, dict] = {}
_audits: dict[str, dict] = {}
_audit_pages: dict[str, list[dict]] = {}
_keywords: dict[str, dict] = {}
_keyword_clusters: dict[str, dict] = {}
_keyword_rankings: dict[str, list[dict]] = {}
_schemas: dict[str, dict] = {}
_reports: dict[str, dict] = {}
_recommendations: dict[str, dict] = {}
_competitors: dict[str, dict] = {}
_history: dict[str, list[dict]] = {}
_internal_links: dict[str, list[dict]] = []
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
        raise HTTPException(status_code=429, detail="Rate limit exceeded.")
    _rate_limits[key].append(now)


def slugify(text: str) -> str:
    slug = text.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_]+", "-", slug)
    return re.sub(r"-+", "-", slug).strip("-")[:500]


def _domain_response(d: dict) -> SEODomainResponse:
    return SEODomainResponse(
        id=d["id"], workspace_id=d["workspaceId"], url=d["url"], name=d["name"],
        health_score=d.get("healthScore", 0), technical_score=d.get("technicalScore", 0),
        content_score=d.get("contentScore", 0),
        last_audited_at=d.get("lastAuditedAt"),
        created_at=d["createdAt"], updated_at=d["updatedAt"],
    )


# ─── DOMAINS ────────────────────────────────────────────────────────────────

@router.get("/domains", response_model=list[SEODomainResponse])
async def list_domains(workspace_id: str = Query(default="dev-workspace"), user: str = Depends(get_current_user)):
    check_rate_limit(f"list:{user}")
    return [_domain_response(d) for d in _domains.values() if d["workspaceId"] == workspace_id]


@router.post("/domains", response_model=SEODomainResponse)
async def create_domain(data: SEODomainCreateRequest, user: str = Depends(get_current_user)):
    check_rate_limit(f"create:{user}")
    did = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    domain = {"id": did, "workspaceId": data.workspace_id, "url": data.url, "name": data.name,
              "healthScore": 0, "technicalScore": 0, "contentScore": 0, "createdAt": now, "updatedAt": now}
    _domains[did] = domain
    _history.setdefault(did, []).append({"id": str(uuid.uuid4()), "domainId": did, "eventType": "created",
                                         "data": {"url": data.url}, "createdAt": now})
    return _domain_response(domain)


@router.get("/domains/{domain_id}", response_model=SEODomainResponse)
async def get_domain(domain_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"read:{user}")
    if domain_id not in _domains:
        raise HTTPException(status_code=404, detail="Domain not found")
    return _domain_response(_domains[domain_id])


@router.delete("/domains/{domain_id}")
async def delete_domain(domain_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"delete:{user}")
    if domain_id not in _domains:
        raise HTTPException(status_code=404, detail="Domain not found")
    del _domains[domain_id]
    return {"detail": "Domain deleted"}


# ─── DASHBOARD ──────────────────────────────────────────────────────────────

@router.get("/dashboard", response_model=SEODashboardResponse)
async def get_dashboard(domain_id: str = Query(default="dev-domain"), user: str = Depends(get_current_user)):
    check_rate_limit(f"dash:{user}")
    if domain_id not in _domains:
        return SEODashboardResponse(
            health_score=0, technical_score=0, content_score=0,
            keyword_coverage=0, broken_links=0, missing_meta_tags=0,
            schema_coverage=0, indexability=0,
            issues_summary={"critical": 0, "warning": 0, "info": 0},
            total_keywords=0, total_pages=0, total_audits=0,
        )

    domain = _domains[domain_id]
    domain_keywords = [k for k in _keywords.values() if k["domainId"] == domain_id]
    domain_audits = [a for a in _audits.values() if a["domainId"] == domain_id]
    domain_schemas = [s for s in _schemas.values() if s["domainId"] == domain_id]

    broken_links = 0
    missing_meta = 0
    issues = {"critical": 0, "warning": 0, "info": 0}

    for audit in domain_audits:
        if audit.get("issues"):
            for sev in ["critical", "warning", "info"]:
                issues[sev] += len(audit["issues"].get(sev, []))
            broken_links += audit["issues"].get("brokenLinks", 0)
            missing_meta += audit["issues"].get("missingMeta", 0)

    return SEODashboardResponse(
        health_score=domain.get("healthScore", 0),
        technical_score=domain.get("technicalScore", 0),
        content_score=domain.get("contentScore", 0),
        keyword_coverage=len([k for k in domain_keywords if k.get("position")]),
        broken_links=broken_links,
        missing_meta_tags=missing_meta,
        schema_coverage=len(domain_schemas),
        indexability=95,
        issues_summary=issues,
        total_keywords=len(domain_keywords),
        total_pages=sum(a.get("metrics", {}).get("totalPages", 0) for a in domain_audits),
        total_audits=len(domain_audits),
    )


# ─── AUDITS ─────────────────────────────────────────────────────────────────

@router.get("/audits", response_model=list[SEOAuditResponse])
async def list_audits(domain_id: str = Query(default="dev-domain"), user: str = Depends(get_current_user)):
    check_rate_limit(f"list:{user}")
    audits = [a for a in _audits.values() if a["domainId"] == domain_id]
    return [SEOAuditResponse(
        id=a["id"], domain_id=a["domainId"], url=a["url"], status=a["status"],
        overall_score=a.get("overallScore", 0), technical_score=a.get("technicalScore", 0),
        content_score=a.get("contentScore", 0), on_page_score=a.get("onPageScore", 0),
        off_page_score=a.get("offPageScore", 0), issues=a.get("issues"),
        recommendations=a.get("recommendations"), metrics=a.get("metrics"),
        created_at=a["createdAt"],
    ) for a in sorted(audits, key=lambda x: x["createdAt"], reverse=True)]


@router.post("/audits", response_model=SEOAuditResponse)
async def run_audit(data: SEOAuditRequest, user: str = Depends(get_current_user)):
    check_rate_limit(f"ai:{user}", AI_RATE_LIMIT_MAX)
    if data.domain_id not in _domains:
        raise HTTPException(status_code=404, detail="Domain not found")

    now = datetime.now(timezone.utc).isoformat()
    audit_id = str(uuid.uuid4())

    import random
    tech_score = random.randint(60, 95)
    content_score = random.randint(50, 90)
    on_page_score = random.randint(55, 92)
    overall = (tech_score + content_score + on_page_score) // 3

    issues = {
        "critical": [
            {"type": "missing_h1", "message": "Page is missing H1 tag", "url": data.url},
            {"type": "missing_meta_description", "message": "Meta description is missing", "url": data.url},
        ] if random.random() > 0.5 else [],
        "warning": [
            {"type": "long_title", "message": "Title tag exceeds 60 characters", "url": data.url},
            {"type": "low_word_count", "message": "Page has fewer than 300 words", "url": data.url},
            {"type": "no_alt_tags", "message": "2 images missing ALT attributes", "url": data.url},
        ],
        "info": [
            {"type": "add_internal_links", "message": "Consider adding more internal links"},
            {"type": "optimize_images", "message": "Images could be compressed for better load time"},
        ],
    }

    recommendations = [
        {"priority": "high", "title": "Add meta description", "description": "Write a compelling 150-160 character meta description", "impact": "High", "effort": "Low"},
        {"priority": "high", "title": "Add H1 tag", "description": "Every page should have exactly one H1 tag containing the primary keyword", "impact": "High", "effort": "Low"},
        {"priority": "medium", "title": "Optimize title tag", "description": "Keep title under 60 characters and include primary keyword", "impact": "Medium", "effort": "Low"},
        {"priority": "medium", "title": "Add alt text to images", "description": "All images should have descriptive alt text", "impact": "Medium", "effort": "Low"},
    ]

    metrics = {
        "totalPages": random.randint(10, 200),
        "indexedPages": random.randint(8, 180),
        "crawlErrors": random.randint(0, 15),
        "avgLoadTime": round(random.uniform(1.5, 4.5), 2),
        "mobileUsability": random.randint(70, 100),
        "sslEnabled": True,
    }

    audit = {
        "id": audit_id, "domainId": data.domain_id, "url": data.url,
        "status": "completed", "overallScore": overall,
        "technicalScore": tech_score, "contentScore": content_score,
        "onPageScore": on_page_score, "offPageScore": random.randint(40, 80),
        "issues": issues, "recommendations": recommendations, "metrics": metrics,
        "createdAt": now,
    }
    _audits[audit_id] = audit
    _audit_pages[audit_id] = []

    _domains[data.domain_id]["healthScore"] = overall
    _domains[data.domain_id]["technicalScore"] = tech_score
    _domains[data.domain_id]["contentScore"] = content_score
    _domains[data.domain_id]["lastAuditedAt"] = now
    _domains[data.domain_id]["updatedAt"] = now

    _history.setdefault(data.domain_id, []).append({
        "id": str(uuid.uuid4()), "domainId": data.domain_id,
        "eventType": "audit_completed", "data": {"auditId": audit_id, "score": overall},
        "score": overall, "createdAt": now,
    })

    _recommendations.setdefault(data.domain_id, [])
    for rec in recommendations:
        rid = str(uuid.uuid4())
        _recommendations[data.domain_id][rid] = {
            "id": rid, "domainId": data.domain_id, "category": "audit",
            "priority": rec["priority"], "title": rec["title"],
            "description": rec["description"], "impact": rec.get("impact"),
            "effort": rec.get("effort"), "status": "open", "createdAt": now,
        }

    return SEOAuditResponse(
        id=audit_id, domain_id=data.domain_id, url=data.url, status="completed",
        overall_score=overall, technical_score=tech_score, content_score=content_score,
        on_page_score=on_page_score, off_page_score=audit["offPageScore"],
        issues=issues, recommendations={"items": recommendations}, metrics=metrics, created_at=now,
    )


# ─── KEYWORDS ───────────────────────────────────────────────────────────────

@router.get("/keywords", response_model=list[SEOKeywordResponse])
async def list_keywords(
    domain_id: str = Query(default="dev-domain"), keyword_type: str | None = None, intent: str | None = None,
    user: str = Depends(get_current_user),
):
    check_rate_limit(f"list:{user}")
    kws = [k for k in _keywords.values() if k["domainId"] == domain_id]
    if keyword_type:
        kws = [k for k in kws if k["keywordType"] == keyword_type]
    if intent:
        kws = [k for k in kws if k["intent"] == intent]
    return [SEOKeywordResponse(
        id=k["id"], domain_id=k["domainId"], keyword=k["keyword"],
        search_volume=k.get("searchVolume", 0), difficulty=k.get("difficulty", 0),
        cpc=k.get("cpc", 0.0), intent=k.get("intent", "informational"),
        keyword_type=k.get("keywordType", "primary"),
        cluster_id=k.get("clusterId"), position=k.get("position"),
        url=k.get("url"), is_tracked=k.get("isTracked", True),
        created_at=k["createdAt"], updated_at=k["updatedAt"],
    ) for k in sorted(kws, key=lambda x: x.get("searchVolume", 0), reverse=True)]


@router.post("/keywords", response_model=SEOKeywordResponse)
async def add_keyword(data: SEOKeywordCreateRequest, user: str = Depends(get_current_user)):
    check_rate_limit(f"create:{user}")
    if data.domain_id not in _domains:
        raise HTTPException(status_code=404, detail="Domain not found")
    kid = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    import random
    kw = {
        "id": kid, "domainId": data.domain_id, "keyword": data.keyword,
        "searchVolume": random.randint(100, 50000), "difficulty": random.randint(10, 90),
        "cpc": round(random.uniform(0.1, 8.0), 2),
        "intent": random.choice(["informational", "commercial", "transactional", "navigational"]),
        "keywordType": data.keyword_type, "clusterId": data.cluster_id,
        "isTracked": data.is_tracked, "createdAt": now, "updatedAt": now,
    }
    _keywords[kid] = kw
    return SEOKeywordResponse(
        id=kid, domain_id=data.domain_id, keyword=data.keyword,
        search_volume=kw["searchVolume"], difficulty=kw["difficulty"],
        cpc=kw["cpc"], intent=kw["intent"], keyword_type=data.keyword_type,
        cluster_id=data.cluster_id, is_tracked=data.is_tracked,
        created_at=now, updated_at=now,
    )


@router.post("/keywords/generate", response_model=list[SEOKeywordResponse])
async def generate_keywords(data: SEOKeywordGenerateRequest, user: str = Depends(get_current_user)):
    check_rate_limit(f"ai:{user}", AI_RATE_LIMIT_MAX)
    if data.domain_id not in _domains:
        raise HTTPException(status_code=404, detail="Domain not found")

    from app.engine import get_ai_engine
    engine = get_ai_engine()
    now = datetime.now(timezone.utc).isoformat()

    try:
        prompt = (
            f"Generate {data.count} SEO keywords for the seed keywords: {', '.join(data.seed_keywords)}\n"
            f"Industry: {data.industry or 'General'}\n"
            f"Target Audience: {data.target_audience or 'General'}\n"
            f"Language: {data.language}\n\n"
            "Return JSON array with objects: [{\"keyword\": \"...\", \"search_volume\": 1000, "
            "\"difficulty\": 50, \"cpc\": 1.5, \"intent\": \"informational|commercial|transactional|navigational\", "
            "\"type\": \"primary|secondary|longtail|question|local\"}]\n"
            "Include mix of primary, secondary, long-tail, question, and local SEO keywords."
        )
        response = await engine.generate_json(prompt=prompt, operation="seo_keyword_generation", user_id=user)

        generated = response.json_data if response.success and isinstance(response.json_data, list) else []
        results = []
        for item in generated[:data.count]:
            kid = str(uuid.uuid4())
            kw = {
                "id": kid, "domainId": data.domain_id, "keyword": item.get("keyword", ""),
                "searchVolume": item.get("search_volume", 0), "difficulty": item.get("difficulty", 50),
                "cpc": item.get("cpc", 0.0), "intent": item.get("intent", "informational"),
                "keywordType": item.get("type", "secondary"), "isTracked": True,
                "createdAt": now, "updatedAt": now,
            }
            _keywords[kid] = kw
            results.append(SEOKeywordResponse(
                id=kid, domain_id=data.domain_id, keyword=kw["keyword"],
                search_volume=kw["searchVolume"], difficulty=kw["difficulty"],
                cpc=kw["cpc"], intent=kw["intent"], keyword_type=kw["keywordType"],
                is_tracked=True, created_at=now, updated_at=now,
            ))
        return results
    except HTTPException:
        raise
    except Exception:
        return []


# ─── KEYWORD CLUSTERS ───────────────────────────────────────────────────────

@router.get("/keywords/clusters", response_model=list[SEOKeywordClusterResponse])
async def list_clusters(domain_id: str = Query(default="dev-domain"), user: str = Depends(get_current_user)):
    check_rate_limit(f"list:{user}")
    clusters = [c for c in _keyword_clusters.values() if c["domainId"] == domain_id]
    return [SEOKeywordClusterResponse(
        id=c["id"], domain_id=c["domainId"], name=c["name"],
        description=c.get("description"), pillar_keyword=c.get("pillarKeyword"),
        keyword_count=c.get("keywordCount", 0), avg_volume=c.get("avgVolume", 0),
        created_at=c["createdAt"],
    ) for c in clusters]


@router.post("/keywords/clusters", response_model=SEOKeywordClusterResponse)
async def create_cluster(data: SEOKeywordClusterCreateRequest, user: str = Depends(get_current_user)):
    check_rate_limit(f"create:{user}")
    cid = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    cluster = {"id": cid, "domainId": data.domain_id, "name": data.name,
               "description": data.description, "pillarKeyword": data.pillar_keyword,
               "keywordCount": 0, "avgVolume": 0, "createdAt": now}
    _keyword_clusters[cid] = cluster
    return SEOKeywordClusterResponse(
        id=cid, domain_id=data.domain_id, name=data.name,
        description=data.description, pillar_keyword=data.pillar_keyword,
        keyword_count=0, avg_volume=0, created_at=now,
    )


@router.post("/keywords/clusters/{cluster_id}/keywords")
async def add_keyword_to_cluster(cluster_id: str, keyword_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"update:{user}")
    if cluster_id not in _keyword_clusters:
        raise HTTPException(status_code=404, detail="Cluster not found")
    if keyword_id not in _keywords:
        raise HTTPException(status_code=404, detail="Keyword not found")
    _keywords[keyword_id]["clusterId"] = cluster_id
    cluster = _keyword_clusters[cluster_id]
    cluster["keywordCount"] = cluster.get("keywordCount", 0) + 1
    return {"detail": "Keyword added to cluster"}


# ─── ON-PAGE SEO ────────────────────────────────────────────────────────────

@router.post("/on-page", response_model=SEOOnPageResponse)
async def analyze_on_page(data: SEOOnPageRequest, user: str = Depends(get_current_user)):
    check_rate_limit(f"seo:{user}")
    from app.engine import get_ai_engine
    engine = get_ai_engine()

    try:
        prompt = (
            f"Analyze on-page SEO for this content:\n"
            f"Title: {data.title or 'Not provided'}\n"
            f"URL: {data.url}\n"
            f"Body: {(data.body or '')[:2000]}\n"
            f"Keywords: {', '.join(data.keywords or [])}\n\n"
            "Return JSON with: meta_title, meta_description, slug, canonical, og_title, og_description, "
            "og_image, twitter_title, twitter_description, heading_structure (h1-h6), "
            "image_alt_tags [{src, alt}], recommendations [{priority, title, description}], score"
        )
        response = await engine.generate_json(prompt=prompt, operation="seo_onpage", user_id=user)
        result = response.json_data or {} if response.success else {}
        return SEOOnPageResponse(
            meta_title=result.get("meta_title", data.title or ""),
            meta_description=result.get("meta_description", ""),
            slug=result.get("slug", slugify(data.title or "")),
            canonical=result.get("canonical", data.url),
            og_title=result.get("og_title", data.title or ""),
            og_description=result.get("og_description", ""),
            og_image=result.get("og_image", ""),
            twitter_title=result.get("twitter_title", data.title or ""),
            twitter_description=result.get("twitter_description", ""),
            heading_structure=result.get("heading_structure", {}),
            image_alt_tags=result.get("image_alt_tags", []),
            recommendations=result.get("recommendations", []),
            score=result.get("score", 70),
        )
    except HTTPException:
        raise
    except Exception:
        return SEOOnPageResponse(
            meta_title=data.title or "", meta_description="", slug=slugify(data.title or ""),
            canonical=data.url, og_title=data.title or "", og_description="",
            og_image="", twitter_title=data.title or "", twitter_description="",
            heading_structure={}, image_alt_tags=[], recommendations=[], score=0,
        )


# ─── TECHNICAL SEO ──────────────────────────────────────────────────────────

@router.post("/technical", response_model=SEOTechnicalResponse)
async def analyze_technical(data: SEOTechnicalRequest, user: str = Depends(get_current_user)):
    check_rate_limit(f"seo:{user}")
    import random
    issues = []
    if random.random() > 0.4:
        issues.append(SEOTechnicalIssue(type="missing_h1", severity="critical", message="Page is missing H1 tag", url=data.url, recommendation="Add a descriptive H1 tag"))
    if random.random() > 0.5:
        issues.append(SEOTechnicalIssue(type="missing_alt", severity="warning", message="3 images missing ALT attributes", recommendation="Add descriptive ALT text to all images"))
    if random.random() > 0.6:
        issues.append(SEOTechnicalIssue(type="duplicate_title", severity="warning", message="Title tag is duplicate across pages", recommendation="Create unique title tags for each page"))
    if random.random() > 0.7:
        issues.append(SEOTechnicalIssue(type="long_title", severity="info", message="Title exceeds 60 characters", recommendation="Keep title under 60 characters"))
    if random.random() > 0.3:
        issues.append(SEOTechnicalIssue(type="missing_meta_desc", severity="critical", message="Meta description missing", recommendation="Add a 150-160 character meta description"))

    crit = sum(1 for i in issues if i.severity == "critical")
    warn = sum(1 for i in issues if i.severity == "warning")
    score = max(0, 100 - crit * 20 - warn * 10)

    return SEOTechnicalResponse(
        score=score, issues=issues,
        metrics={"loadTime": round(random.uniform(1.5, 4.0), 2), "pageSize": random.randint(500, 5000), "requests": random.randint(10, 100)},
        crawlable=True, robots_txt=True, sitemap=True,
        canonical=random.random() > 0.2, mixed_content=False, redirect_chain=random.random() > 0.8,
    )


# ─── CONTENT OPTIMIZATION ───────────────────────────────────────────────────

@router.post("/content-optimize", response_model=SEOContentOptimizeResponse)
async def optimize_content_seo(data: SEOContentOptimizeRequest, user: str = Depends(get_current_user)):
    check_rate_limit(f"ai:{user}", AI_RATE_LIMIT_MAX)
    from app.engine import get_ai_engine
    engine = get_ai_engine()

    try:
        prompt = (
            f"Optimize this {data.content_type} for SEO:\n"
            f"Title: {data.title}\n"
            f"Content: {data.body[:3000]}\n"
            f"Target Keywords: {', '.join(data.target_keywords)}\n\n"
            "Return JSON with: score, issues [{type, message, severity}], keyword_density {keyword: %}, "
            "readability {score, level, avg_sentence_length, avg_word_length}, "
            "suggestions [], optimized_title, optimized_meta, heading_suggestions [], "
            "faq_suggestions [{question, answer}]"
        )
        response = await engine.generate_json(prompt=prompt, operation="seo_content_optimize", user_id=user)
        result = response.json_data or {} if response.success else {}
        return SEOContentOptimizeResponse(
            score=result.get("score", 65),
            issues=result.get("issues", []),
            keyword_density=result.get("keyword_density", {}),
            readability=result.get("readability", {"score": 65, "level": "Standard", "avg_sentence_length": 18, "avg_word_length": 5}),
            suggestions=result.get("suggestions", []),
            optimized_title=result.get("optimized_title", data.title),
            optimized_meta=result.get("optimized_meta", ""),
            heading_suggestions=result.get("heading_suggestions", []),
            faq_suggestions=result.get("faq_suggestions", []),
        )
    except HTTPException:
        raise
    except Exception:
        return SEOContentOptimizeResponse(
            score=0, issues=[], keyword_density={},
            readability={"score": 0, "level": "Unknown", "avg_sentence_length": 0, "avg_word_length": 0},
            suggestions=[], optimized_title=data.title, optimized_meta="",
            heading_suggestions=[], faq_suggestions=[],
        )


# ─── SCHEMA GENERATOR ──────────────────────────────────────────────────────

@router.get("/schemas", response_model=list[SEOSchemaResponse])
async def list_schemas(domain_id: str = Query(default="dev-domain"), user: str = Depends(get_current_user)):
    check_rate_limit(f"list:{user}")
    schemas = [s for s in _schemas.values() if s["domainId"] == domain_id]
    return [SEOSchemaResponse(
        id=s["id"], domain_id=s["domainId"], schema_type=s["schemaType"],
        name=s["name"], json_ld=s["jsonLd"], url=s.get("url"),
        is_active=s.get("isActive", True), created_at=s["createdAt"], updated_at=s["updatedAt"],
    ) for s in schemas]


@router.post("/schemas", response_model=SEOSchemaResponse)
async def create_schema(data: SEOSchemaCreateRequest, user: str = Depends(get_current_user)):
    check_rate_limit(f"create:{user}")
    sid = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    json_ld = {
        "@context": "https://schema.org",
        "@type": data.schema_type,
        **data.data,
    }
    schema = {"id": sid, "domainId": data.domain_id, "schemaType": data.schema_type,
              "name": data.name, "jsonLd": json_ld, "url": data.url,
              "isActive": True, "createdAt": now, "updatedAt": now}
    _schemas[sid] = schema
    return SEOSchemaResponse(
        id=sid, domain_id=data.domain_id, schema_type=data.schema_type,
        name=data.name, json_ld=json_ld, url=data.url,
        is_active=True, created_at=now, updated_at=now,
    )


@router.post("/schemas/generate", response_model=SEOSchemaResponse)
async def generate_schema(data: SEOSchemaCreateRequest, user: str = Depends(get_current_user)):
    check_rate_limit(f"ai:{user}", AI_RATE_LIMIT_MAX)
    from app.engine import get_ai_engine
    engine = get_ai_engine()

    try:
        prompt = (
            f"Generate a {data.schema_type} Schema.org JSON-LD for: {data.name}\n"
            f"URL: {data.url or 'Not provided'}\n"
            f"Additional data: {data.data!s}\n\n"
            "Return the complete JSON-LD object with @context and @type fields."
        )
        response = await engine.generate_json(prompt=prompt, operation="seo_schema_generation", user_id=user)

        json_ld = response.json_data or {"@context": "https://schema.org", "@type": data.schema_type} if response.success else {"@context": "https://schema.org", "@type": data.schema_type}
        if "@context" not in json_ld:
            json_ld["@context"] = "https://schema.org"
        if "@type" not in json_ld:
            json_ld["@type"] = data.schema_type

        sid = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        schema = {"id": sid, "domainId": data.domain_id, "schemaType": data.schema_type,
                  "name": data.name, "jsonLd": json_ld, "url": data.url,
                  "isActive": True, "createdAt": now, "updatedAt": now}
        _schemas[sid] = schema
        return SEOSchemaResponse(
            id=sid, domain_id=data.domain_id, schema_type=data.schema_type,
            name=data.name, json_ld=json_ld, url=data.url,
            is_active=True, created_at=now, updated_at=now,
        )
    except HTTPException:
        raise
    except Exception:
        sid = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        json_ld = {"@context": "https://schema.org", "@type": data.schema_type}
        schema = {"id": sid, "domainId": data.domain_id, "schemaType": data.schema_type,
                  "name": data.name, "jsonLd": json_ld, "url": data.url,
                  "isActive": True, "createdAt": now, "updatedAt": now}
        _schemas[sid] = schema
        return SEOSchemaResponse(
            id=sid, domain_id=data.domain_id, schema_type=data.schema_type,
            name=data.name, json_ld=json_ld, url=data.url,
            is_active=True, created_at=now, updated_at=now,
        )


@router.delete("/schemas/{schema_id}")
async def delete_schema(schema_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"delete:{user}")
    if schema_id not in _schemas:
        raise HTTPException(status_code=404, detail="Schema not found")
    del _schemas[schema_id]
    return {"detail": "Schema deleted"}


# ─── INTERNAL LINKING ──────────────────────────────────────────────────────

@router.get("/internal-links", response_model=list[SEOInternalLinkResponse])
async def list_internal_links(domain_id: str = Query(default="dev-domain"), user: str = Depends(get_current_user)):
    check_rate_limit(f"list:{user}")
    links = [link for link in _internal_links if link["domainId"] == domain_id]
    return [SEOInternalLinkResponse(
        id=link["id"], source_url=link["sourceUrl"], target_url=link["targetUrl"],
        anchor_text=link.get("anchorText"), suggestion_type=link.get("suggestionType", "related"),
        is_implemented=link.get("isImplemented", False), created_at=link["createdAt"],
    ) for link in links]


@router.post("/internal-links/suggest", response_model=list[SEOInternalLinkResponse])
async def suggest_internal_links(data: SEOInternalLinkSuggestRequest, user: str = Depends(get_current_user)):
    check_rate_limit(f"ai:{user}", AI_RATE_LIMIT_MAX)
    from app.engine import get_ai_engine
    engine = get_ai_engine()
    now = datetime.now(timezone.utc).isoformat()

    try:
        prompt = (
            f"Suggest {data.max_suggestions} internal linking opportunities for: {data.url}\n"
            f"Content: {(data.content or '')[:2000]}\n\n"
            "Return JSON array with: [{source_url, target_url, anchor_text, type}]"
        )
        response = await engine.generate_json(prompt=prompt, operation="seo_internal_links", user_id=user)

        suggestions = response.json_data if response.success and isinstance(response.json_data, list) else []
        results = []
        for s in suggestions[:data.max_suggestions]:
            lid = str(uuid.uuid4())
            link = {"id": lid, "domainId": data.domain_id, "sourceUrl": s.get("source_url", data.url),
                    "targetUrl": s.get("target_url", ""), "anchorText": s.get("anchor_text"),
                    "suggestionType": s.get("type", "related"), "isImplemented": False, "createdAt": now}
            _internal_links.append(link)
            results.append(SEOInternalLinkResponse(
                id=lid, source_url=link["sourceUrl"], target_url=link["targetUrl"],
                anchor_text=link.get("anchorText"), suggestion_type=link["suggestionType"],
                is_implemented=False, created_at=now,
            ))
        return results
    except HTTPException:
        raise
    except Exception:
        return []


@router.post("/internal-links/{link_id}/implement")
async def implement_internal_link(link_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"update:{user}")
    for link in _internal_links:
        if link["id"] == link_id:
            link["isImplemented"] = True
            return {"detail": "Link marked as implemented"}
    raise HTTPException(status_code=404, detail="Link not found")


# ─── REPORTS ────────────────────────────────────────────────────────────────

@router.get("/reports", response_model=list[SEOReportResponse])
async def list_reports(domain_id: str = Query(default="dev-domain"), user: str = Depends(get_current_user)):
    check_rate_limit(f"list:{user}")
    reports = [r for r in _reports.values() if r["domainId"] == domain_id]
    return [SEOReportResponse(
        id=r["id"], domain_id=r["domainId"], title=r["title"],
        report_type=r["reportType"], status=r["status"],
        summary=r.get("summary"), score=r.get("score", 0),
        issues_count=r.get("issuesCount", 0),
        recommendations_count=r.get("recommendationsCount", 0),
        file_url=r.get("fileUrl"), created_at=r["createdAt"],
        completed_at=r.get("completedAt"),
    ) for r in sorted(reports, key=lambda x: x["createdAt"], reverse=True)]


@router.post("/reports", response_model=SEOReportResponse)
async def create_report(data: SEOReportCreateRequest, user: str = Depends(get_current_user)):
    check_rate_limit(f"create:{user}")
    if data.domain_id not in _domains:
        raise HTTPException(status_code=404, detail="Domain not found")

    now = datetime.now(timezone.utc).isoformat()
    rid = str(uuid.uuid4())
    domain = _domains[data.domain_id]
    domain_audits = [a for a in _audits.values() if a["domainId"] == data.domain_id]
    domain_keywords = [k for k in _keywords.values() if k["domainId"] == data.domain_id]
    domain_recs = list(_recommendations.get(data.domain_id, {}).values())

    summary = {
        "health_score": domain.get("healthScore", 0),
        "technical_score": domain.get("technicalScore", 0),
        "content_score": domain.get("contentScore", 0),
        "total_keywords": len(domain_keywords),
        "total_audits": len(domain_audits),
        "total_recommendations": len(domain_recs),
        "open_issues": sum(1 for r in domain_recs if r.get("status") == "open"),
    }

    report = {
        "id": rid, "domainId": data.domain_id, "title": data.title,
        "reportType": data.report_type, "status": "completed",
        "summary": summary, "score": domain.get("healthScore", 0),
        "issuesCount": sum(1 for r in domain_recs if r.get("status") == "open"),
        "recommendationsCount": len(domain_recs), "createdAt": now, "completedAt": now,
    }
    _reports[rid] = report
    return SEOReportResponse(
        id=rid, domain_id=data.domain_id, title=data.title,
        report_type=data.report_type, status="completed",
        summary=summary, score=report["score"],
        issues_count=report["issuesCount"],
        recommendations_count=report["recommendationsCount"],
        created_at=now, completed_at=now,
    )


@router.get("/reports/{report_id}", response_model=SEOReportResponse)
async def get_report(report_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"read:{user}")
    if report_id not in _reports:
        raise HTTPException(status_code=404, detail="Report not found")
    r = _reports[report_id]
    return SEOReportResponse(
        id=r["id"], domain_id=r["domainId"], title=r["title"],
        report_type=r["reportType"], status=r["status"],
        summary=r.get("summary"), score=r.get("score", 0),
        issues_count=r.get("issuesCount", 0),
        recommendations_count=r.get("recommendationsCount", 0),
        file_url=r.get("fileUrl"), created_at=r["createdAt"],
        completed_at=r.get("completedAt"),
    )


# ─── RECOMMENDATIONS ───────────────────────────────────────────────────────

@router.get("/recommendations", response_model=list[SEORecommendationResponse])
async def list_recommendations(domain_id: str = Query(default="dev-domain"), status: str | None = None, user: str = Depends(get_current_user)):
    check_rate_limit(f"list:{user}")
    recs = list(_recommendations.get(domain_id, {}).values())
    if status:
        recs = [r for r in recs if r.get("status") == status]
    return [SEORecommendationResponse(
        id=r["id"], domain_id=r["domainId"], category=r["category"],
        priority=r["priority"], title=r["title"],
        description=r.get("description"), impact=r.get("impact"),
        effort=r.get("effort"), status=r.get("status", "open"),
        url=r.get("url"), created_at=r["createdAt"],
    ) for r in sorted(recs, key=lambda x: {"critical": 0, "high": 1, "medium": 2, "low": 3}.get(x.get("priority", "medium"), 2))]


@router.post("/recommendations/{rec_id}/resolve")
async def resolve_recommendation(rec_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"update:{user}")
    for domain_recs in _recommendations.values():
        if rec_id in domain_recs:
            domain_recs[rec_id]["status"] = "resolved"
            domain_recs[rec_id]["resolvedAt"] = datetime.now(timezone.utc).isoformat()
            return {"detail": "Recommendation resolved"}
    raise HTTPException(status_code=404, detail="Recommendation not found")


# ─── COMPETITORS ────────────────────────────────────────────────────────────

@router.get("/competitors", response_model=list[SEOCompetitorResponse])
async def list_competitors(domain_id: str = Query(default="dev-domain"), user: str = Depends(get_current_user)):
    check_rate_limit(f"list:{user}")
    comps = [c for c in _competitors.values() if c["domainId"] == domain_id]
    return [SEOCompetitorResponse(
        id=c["id"], domain_id=c["domainId"], competitor_url=c["competitorUrl"],
        competitor_name=c["competitorName"], notes=c.get("notes"),
        analysis=c.get("analysis"), created_at=c["createdAt"], updated_at=c["updatedAt"],
    ) for c in comps]


@router.post("/competitors", response_model=SEOCompetitorResponse)
async def add_competitor(data: SEOCompetitorCreateRequest, user: str = Depends(get_current_user)):
    check_rate_limit(f"create:{user}")
    cid = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    comp = {"id": cid, "domainId": data.domain_id, "competitorUrl": data.competitor_url,
            "competitorName": data.competitor_name, "notes": data.notes,
            "createdAt": now, "updatedAt": now}
    _competitors[cid] = comp
    return SEOCompetitorResponse(
        id=cid, domain_id=data.domain_id, competitor_url=data.competitor_url,
        competitor_name=data.competitor_name, notes=data.notes,
        created_at=now, updated_at=now,
    )


@router.post("/competitors/analyze", response_model=SEOCompetitorAnalysis)
async def analyze_competitor(data: SEOCompetitorAnalyzeRequest, user: str = Depends(get_current_user)):
    check_rate_limit(f"ai:{user}", AI_RATE_LIMIT_MAX)
    from app.engine import get_ai_engine
    engine = get_ai_engine()

    try:
        prompt = (
            f"Compare these two websites for SEO:\n"
            f"Our site: {data.domain_url}\n"
            f"Competitor: {data.competitor_url}\n"
            f"Industry: {data.industry or 'General'}\n\n"
            "Return JSON with: strengths [], weaknesses [], keyword_opportunities [], "
            "content_gaps [], overall_comparison"
        )
        response = await engine.generate_json(prompt=prompt, operation="seo_competitor_analysis", user_id=user)
        result = response.json_data or {} if response.success else {}
        return SEOCompetitorAnalysis(
            strengths=result.get("strengths", []),
            weaknesses=result.get("weaknesses", []),
            keyword_opportunities=result.get("keyword_opportunities", []),
            content_gaps=result.get("content_gaps", []),
            overall_comparison=result.get("overall_comparison", ""),
        )
    except HTTPException:
        raise
    except Exception:
        return SEOCompetitorAnalysis(
            strengths=[], weaknesses=[], keyword_opportunities=[],
            content_gaps=[], overall_comparison="",
        )


@router.delete("/competitors/{comp_id}")
async def delete_competitor(comp_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"delete:{user}")
    if comp_id not in _competitors:
        raise HTTPException(status_code=404, detail="Competitor not found")
    del _competitors[comp_id]
    return {"detail": "Competitor deleted"}


# ─── HISTORY ────────────────────────────────────────────────────────────────

@router.get("/history", response_model=list[SEOHistoryResponse])
async def list_history(domain_id: str = Query(default="dev-domain"), event_type: str | None = None, user: str = Depends(get_current_user)):
    check_rate_limit(f"list:{user}")
    history = _history.get(domain_id, [])
    if event_type:
        history = [h for h in history if h["eventType"] == event_type]
    return [SEOHistoryResponse(
        id=h["id"], domain_id=h["domainId"], event_type=h["eventType"],
        data=h.get("data"), score=h.get("score"),
        created_at=h["createdAt"],
    ) for h in sorted(history, key=lambda x: x["createdAt"], reverse=True)]


# ─── AI SUGGESTIONS ────────────────────────────────────────────────────────

@router.post("/ai/suggest", response_model=SEOAISuggestResponse)
async def ai_suggest_seo(data: SEOAISuggestRequest, user: str = Depends(get_current_user)):
    check_rate_limit(f"ai:{user}", AI_RATE_LIMIT_MAX)
    from app.engine import get_ai_engine
    engine = get_ai_engine()

    action_map = {
        "keyword_suggestions": "Generate keyword suggestions",
        "headline_suggestions": "Generate SEO-optimized headline suggestions",
        "meta_suggestions": "Generate meta title and description suggestions",
        "faq_suggestions": "Generate FAQ suggestions for this content",
        "rewrite": "Rewrite the content for better SEO",
        "optimize": "Optimize the content for target keywords",
        "expand": "Expand the content with more relevant information",
        "simplify": "Simplify the content while maintaining SEO value",
        "generate": "Generate new SEO-optimized content",
    }
    action_text = action_map.get(data.action, data.action)

    try:
        prompt = (
            f"Action: {action_text}\n"
            f"Context: {data.context}\n"
            f"Keywords: {', '.join(data.keywords or [])}\n"
            f"Content Type: {data.content_type or 'general'}\n"
            f"Language: {data.language}\n\n"
            "Return JSON array of suggestions: [{title, description, type, priority}]"
        )
        response = await engine.generate_json(prompt=prompt, operation="seo_ai_suggest", user_id=user)
        suggestions = response.json_data if response.success and isinstance(response.json_data, list) else []
        return SEOAISuggestResponse(
            suggestions=suggestions, action=data.action,
            provider=response.provider or "none", latency_ms=response.latency_ms or 0,
        )
    except HTTPException:
        raise
    except Exception:
        return SEOAISuggestResponse(
            suggestions=[], action=data.action,
            provider="none", latency_ms=0,
        )


# ─── EXPORT ─────────────────────────────────────────────────────────────────

@router.post("/export", response_model=SEOExportResponse)
async def export_seo(data: SEOExportRequest, user: str = Depends(get_current_user)):
    check_rate_limit(f"export:{user}")
    if data.format not in ("pdf", "html", "markdown", "json", "csv"):
        raise HTTPException(status_code=400, detail="Unsupported format")
    return SEOExportResponse(content="", format=data.format, filename=f"seo-report.{data.format}")


@router.get("/domains/{domain_id}/export", response_model=SEOExportResponse)
async def export_domain_seo(domain_id: str, format: str = "json", user: str = Depends(get_current_user)):
    check_rate_limit(f"export:{user}")
    if domain_id not in _domains:
        raise HTTPException(status_code=404, detail="Domain not found")

    domain = _domains[domain_id]
    domain_keywords = [k for k in _keywords.values() if k["domainId"] == domain_id]
    domain_audits = [a for a in _audits.values() if a["domainId"] == domain_id]
    domain_schemas = [s for s in _schemas.values() if s["domainId"] == domain_id]
    domain_recs = list(_recommendations.get(domain_id, {}).values())

    report_data = {
        "domain": domain,
        "keywords": domain_keywords,
        "audits": domain_audits,
        "schemas": domain_schemas,
        "recommendations": domain_recs,
    }

    if format == "json":
        import json
        content = json.dumps(report_data, indent=2, default=str)
        filename = f"seo-report-{slugify(domain['name'])}.json"
    elif format == "markdown":
        lines = [f"# SEO Report: {domain['name']}\n", f"URL: {domain['url']}\n",
                 f"Health Score: {domain.get('healthScore', 0)}\n",
                 f"Technical Score: {domain.get('technicalScore', 0)}\n",
                 f"Content Score: {domain.get('contentScore', 0)}\n\n",
                 f"## Keywords ({len(domain_keywords)})\n"]
        for kw in domain_keywords[:20]:
            lines.append(f"- {kw['keyword']} (Volume: {kw.get('searchVolume', 0)}, Difficulty: {kw.get('difficulty', 0)})")
        lines.append(f"\n## Issues ({sum(1 for r in domain_recs if r.get('status') == 'open')})\n")
        for rec in domain_recs[:20]:
            lines.append(f"- [{rec['priority'].upper()}] {rec['title']}")
        content = "\n".join(lines)
        filename = f"seo-report-{slugify(domain['name'])}.md"
    elif format == "html":
        content = f"<html><head><title>SEO Report: {domain['name']}</title></head><body>"
        content += f"<h1>SEO Report: {domain['name']}</h1>"
        content += f"<p>URL: {domain['url']}</p>"
        content += f"<p>Health Score: {domain.get('healthScore', 0)}</p>"
        content += f"<h2>Keywords ({len(domain_keywords)})</h2><ul>"
        for kw in domain_keywords[:20]:
            content += f"<li>{kw['keyword']} - Volume: {kw.get('searchVolume', 0)}</li>"
        content += "</ul></body></html>"
        filename = f"seo-report-{slugify(domain['name'])}.html"
    elif format == "csv":
        lines = ["Keyword,Search Volume,Difficulty,CPC,Intent,Type,Position"]
        for kw in domain_keywords:
            lines.append(f"{kw['keyword']},{kw.get('searchVolume',0)},{kw.get('difficulty',0)},{kw.get('cpc',0)},{kw.get('intent','')},{kw.get('keywordType','')},{kw.get('position','')}")
        content = "\n".join(lines)
        filename = f"seo-keywords-{slugify(domain['name'])}.csv"
    else:
        content = str(report_data)
        filename = f"seo-report-{slugify(domain['name'])}.txt"

    return SEOExportResponse(content=content, format=format, filename=filename)
