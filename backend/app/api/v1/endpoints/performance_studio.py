import random
import re
import time
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.security import get_current_user
from app.schemas.performance import (
    AssetAuditResponse,
    CoreWebVitalsResponse,
    ImageAuditResponse,
    OptimizationHistoryResponse,
    PerformanceAIRecommendRequest,
    PerformanceAIRecommendResponse,
    PerformanceAuditRequest,
    PerformanceAuditResponse,
    PerformanceDashboardResponse,
    PerformanceExportRequest,
    PerformanceExportResponse,
    PerformanceRecommendationResponse,
    PerformanceReportCreateRequest,
    PerformanceReportResponse,
)

router = APIRouter()

_audits: dict[str, dict] = {}
_vitals: dict[str, dict] = {}
_recommendations: dict[str, list[dict]] = {}
_history: dict[str, list[dict]] = {}
_reports: dict[str, dict] = {}
_image_audits: dict[str, list[dict]] = {}
_asset_audits: dict[str, list[dict]] = {}
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


def _score_status(score: int, good: int, medium: int) -> str:
    if score <= good:
        return "good"
    if score <= medium:
        return "needs-improvement"
    return "poor"


def _generate_vitals(url: str) -> dict:
    lcp = round(random.uniform(1.2, 6.0), 2)
    inp = round(random.uniform(50, 800), 0)
    cls = round(random.uniform(0.0, 0.6), 3)
    fcp = round(random.uniform(0.5, 4.5), 2)
    ttfb = round(random.uniform(100, 1800), 0)
    speed_index = round(random.uniform(1.5, 8.0), 2)
    tbt = round(random.uniform(20, 1500), 0)

    return {
        "lcp": lcp,
        "lcp_status": _score_status(lcp, 2.5, 4.0),
        "inp": inp,
        "inp_status": _score_status(inp, 200, 500),
        "cls": cls,
        "cls_status": _score_status(cls, 0.1, 0.25),
        "fcp": fcp,
        "fcp_status": _score_status(fcp, 1.8, 3.0),
        "ttfb": ttfb,
        "ttfb_status": _score_status(ttfb, 800, 1800),
        "speed_index": speed_index,
        "speed_index_status": _score_status(speed_index, 3.4, 5.8),
        "tbt": tbt,
        "tbt_status": _score_status(tbt, 200, 600),
    }


def _generate_audit_data(url: str) -> dict:
    performance = random.randint(40, 98)
    accessibility = random.randint(50, 100)
    best_practices = random.randint(55, 100)
    seo = random.randint(60, 100)
    overall = (performance + accessibility + best_practices + seo) // 4

    critical_issues = []
    warning_issues = []
    info_issues = []

    if performance < 70:
        critical_issues.append({
            "type": "slow_server_response",
            "message": "Server response time is above 1.5 seconds",
            "url": url,
        })
    if performance < 80:
        warning_issues.append({
            "type": "large_paint",
            "message": "Largest Contentful Element has excessive load time",
            "url": url,
        })
    warning_issues.append({
        "type": "render_blocking",
        "message": "Resources are blocking first paint",
        "url": url,
    })
    warning_issues.append({
        "type": "unused_css",
        "message": "Reduce unused CSS rules",
        "url": url,
    })
    info_issues.append({
        "type": "modern_format",
        "message": "Serve images in next-gen formats (WebP, AVIF)",
    })
    info_issues.append({
        "type": "preconnect",
        "message": "Add preconnect hints for critical third-party origins",
    })

    total_bytes = random.randint(200_000, 5_000_000)
    total_requests = random.randint(15, 120)
    dom_size = random.randint(500, 5000)
    js_size = random.randint(100_000, 2_000_000)
    css_size = random.randint(20_000, 500_000)
    html_size = random.randint(5_000, 150_000)
    image_size = random.randint(100_000, 2_500_000)
    font_size = random.randint(20_000, 400_000)

    metrics = {
        "total_bytes": total_bytes,
        "total_requests": total_requests,
        "dom_size": dom_size,
        "js_size": js_size,
        "css_size": css_size,
        "html_size": html_size,
        "image_size": image_size,
        "font_size": font_size,
        "js_requests": random.randint(5, 40),
        "css_requests": random.randint(2, 15),
        "html_requests": random.randint(1, 5),
        "image_requests": random.randint(2, 30),
        "font_requests": random.randint(1, 8),
        "third_party_size": random.randint(0, total_bytes // 3),
        "dom_elements": dom_size,
        "max_chain_length": random.randint(2, 12),
    }

    resources = {
        "html": {"count": random.randint(1, 5), "bytes": html_size},
        "css": {"count": random.randint(2, 15), "bytes": css_size},
        "js": {"count": random.randint(5, 40), "bytes": js_size},
        "images": {"count": random.randint(2, 30), "bytes": image_size},
        "fonts": {"count": random.randint(1, 8), "bytes": font_size},
        "other": {"count": random.randint(0, 10), "bytes": random.randint(5_000, 100_000)},
    }

    return {
        "performance_score": performance,
        "accessibility_score": accessibility,
        "best_practices_score": best_practices,
        "seo_score": seo,
        "overall_score": overall,
        "issues": {
            "critical": critical_issues,
            "warning": warning_issues,
            "info": info_issues,
        },
        "metrics": metrics,
        "resources": resources,
    }


def _generate_recommendations(audit_id: str, scores: dict) -> list[dict]:
    now = datetime.now(timezone.utc).isoformat()
    pool = [
        {
            "category": "performance",
            "priority": "critical",
            "title": "Reduce server response times",
            "problem": "Server response time exceeds 1.5s which delays all subsequent resource loading.",
            "impact": "Reducing server response time can improve LCP by 20-40%.",
            "estimated_improvement": "10-30% faster page load",
            "implementation_guide": "Optimize server-side code, use a CDN, enable caching, and consider upgrading hosting.",
        },
        {
            "category": "performance",
            "priority": "high",
            "title": "Eliminate render-blocking resources",
            "problem": "CSS and JavaScript files are blocking the first paint of the page.",
            "impact": "Moving non-critical resources can significantly improve FCP and LCP.",
            "estimated_improvement": "5-20% faster FCP",
            "implementation_guide": "Use async/defer for scripts, inline critical CSS, and split CSS bundles.",
        },
        {
            "category": "performance",
            "priority": "high",
            "title": "Enable text compression",
            "problem": "Large text resources are served without compression.",
            "impact": "Compression can reduce transfer size by 60-80%.",
            "estimated_improvement": "15-30% reduction in page weight",
            "implementation_guide": "Enable gzip or Brotli compression on your server or CDN.",
        },
        {
            "category": "performance",
            "priority": "medium",
            "title": "Serve images in modern formats",
            "problem": "Images are served in legacy formats like PNG and JPEG instead of WebP or AVIF.",
            "impact": "Modern formats provide 25-50% better compression at equivalent quality.",
            "estimated_improvement": "10-25% reduction in image payload",
            "implementation_guide": "Use an image CDN or build pipeline that generates WebP/AVIF variants.",
        },
        {
            "category": "performance",
            "priority": "medium",
            "title": "Implement lazy loading for images",
            "problem": "Below-the-fold images load eagerly, delaying initial render.",
            "impact": "Lazy loading can defer off-screen images, reducing initial page weight.",
            "estimated_improvement": "5-15% faster initial load",
            "implementation_guide": "Add loading='lazy' attribute to below-the-fold images.",
        },
        {
            "category": "accessibility",
            "priority": "high",
            "title": "Add alt text to all images",
            "problem": "Images are missing descriptive alt attributes needed for screen readers.",
            "impact": "Proper alt text ensures visually impaired users can understand content.",
            "estimated_improvement": "Improved accessibility compliance",
            "implementation_guide": "Add descriptive alt text to every img element. Use alt='' for decorative images.",
        },
        {
            "category": "accessibility",
            "priority": "medium",
            "title": "Ensure proper heading hierarchy",
            "problem": "Heading levels are skipped or not used in a logical order.",
            "impact": "Proper heading structure helps screen reader users navigate content.",
            "estimated_improvement": "Improved semantic structure",
            "implementation_guide": "Use a single H1 per page and follow H1 > H2 > H3 order without skipping levels.",
        },
        {
            "category": "best_practices",
            "priority": "medium",
            "title": "Avoid deprecated APIs",
            "problem": "The page uses deprecated browser APIs that may be removed.",
            "impact": "Future-proofing code prevents unexpected breakage.",
            "estimated_improvement": "Improved browser compatibility",
            "implementation_guide": "Replace deprecated APIs with modern alternatives documented on MDN.",
        },
        {
            "category": "seo",
            "priority": "high",
            "title": "Add meta description",
            "problem": "Page is missing a meta description which affects search snippet quality.",
            "impact": "Meta descriptions improve click-through rates from search results.",
            "estimated_improvement": "5-15% better CTR from search",
            "implementation_guide": "Add a unique 150-160 character meta description summarizing each page's content.",
        },
        {
            "category": "seo",
            "priority": "medium",
            "title": "Use descriptive link text",
            "problem": "Links contain generic text like 'click here' or 'read more'.",
            "impact": "Descriptive links improve SEO and accessibility.",
            "estimated_improvement": "Improved search ranking signals",
            "implementation_guide": "Replace generic link text with descriptive text that indicates the destination.",
        },
    ]

    selected = random.sample(pool, k=min(len(pool), random.randint(4, 8)))
    results = []
    for rec in selected:
        rid = str(uuid.uuid4())
        results.append({
            "id": rid,
            "audit_id": audit_id,
            "category": rec["category"],
            "priority": rec["priority"],
            "title": rec["title"],
            "problem": rec["problem"],
            "impact": rec["impact"],
            "estimated_improvement": rec["estimated_improvement"],
            "implementation_guide": rec["implementation_guide"],
            "status": "open",
            "created_at": now,
        })
    return results


def _generate_image_audits(audit_id: str) -> list[dict]:
    now = datetime.now(timezone.utc).isoformat()
    formats = ["png", "jpeg", "webp", "svg", "gif"]
    results = []
    count = random.randint(3, 8)
    for _ in range(count):
        original_size = random.randint(10_000, 2_000_000)
        fmt = random.choice(formats)
        has_lazy = random.random() > 0.4
        has_alt = random.random() > 0.3
        optimized = int(original_size * random.uniform(0.3, 0.85))
        savings = original_size - optimized
        rec_fmt = random.choice(["webp", "avif"]) if fmt in ("png", "jpeg") else None

        issues = []
        if not has_lazy:
            issues.append("Missing lazy loading attribute")
        if not has_alt:
            issues.append("Missing alt text for screen readers")
        if rec_fmt:
            issues.append(f"Could be converted to {rec_fmt} for ~30% savings")
        if original_size > 500_000:
            issues.append("Image is oversized and should be resized or compressed")

        results.append({
            "id": str(uuid.uuid4()),
            "audit_id": audit_id,
            "url": f"https://example.com/images/{uuid.uuid4().hex[:8]}.{fmt}",
            "original_size": original_size,
            "optimized_size": optimized,
            "format": fmt,
            "recommended_format": rec_fmt,
            "width": random.choice([320, 640, 768, 1024, 1280, 1920]),
            "height": random.choice([240, 480, 576, 768, 1024, 1080]),
            "has_lazy_loading": has_lazy,
            "has_alt_text": has_alt,
            "issues": issues if issues else None,
            "savings_bytes": savings,
            "created_at": now,
        })
    return results


def _generate_asset_audits(audit_id: str) -> list[dict]:
    now = datetime.now(timezone.utc).isoformat()
    results = []
    count = random.randint(5, 12)
    for _ in range(count):
        asset_type = random.choice(["javascript", "css", "font", "html"])
        size = random.randint(1_000, 800_000)
        gzipped = int(size * random.uniform(0.2, 0.6))
        is_minified = random.random() > 0.3
        is_render_blocking = asset_type in ("javascript", "css") and random.random() > 0.5
        is_unused = random.random() > 0.6
        cache_control = random.choice(["public, max-age=31536000", "no-cache", "public, max-age=86400", None])

        issues = []
        if not is_minified:
            issues.append("Asset is not minified")
        if is_render_blocking:
            issues.append("Asset is render-blocking")
        if is_unused:
            issues.append("Unused code detected - consider removing or lazy loading")
        if not cache_control or cache_control == "no-cache":
            issues.append("Missing or weak cache headers")

        results.append({
            "id": str(uuid.uuid4()),
            "audit_id": audit_id,
            "url": f"https://example.com/assets/{uuid.uuid4().hex[:8]}.{'js' if asset_type == 'javascript' else 'css' if asset_type == 'css' else 'woff2' if asset_type == 'font' else 'html'}",
            "asset_type": asset_type,
            "size": size,
            "gzipped_size": gzipped,
            "is_minified": is_minified,
            "is_render_blocking": is_render_blocking,
            "is_unused": is_unused,
            "cache_control": cache_control,
            "etag": uuid.uuid4().hex[:16] if cache_control and "no-cache" not in cache_control else None,
            "issues": issues if issues else None,
            "created_at": now,
        })
    return results


# ─── DASHBOARD ──────────────────────────────────────────────────────────────


@router.get("/dashboard", response_model=PerformanceDashboardResponse)
async def get_dashboard(project_id: str = Query(default="dev-project"), user: str = Depends(get_current_user)):
    check_rate_limit(f"dash:{user}")
    project_audits = [a for a in _audits.values() if a["project_id"] == project_id]
    project_recs = [r for rid_list in _recommendations.values() for r in rid_list if any(a["id"] == r["audit_id"] for a in project_audits)]

    if not project_audits:
        return PerformanceDashboardResponse(
            overall_score=0, performance_score=0, accessibility_score=0,
            best_practices_score=0, seo_score=0, total_audits=0,
            total_issues=0, total_recommendations=0, resolved_recommendations=0,
            avg_lcp=0.0, avg_cls=0.0, avg_inp=0.0, trend=[],
        )

    total_issues = sum(
        len(a.get("issues", {}).get("critical", []))
        + len(a.get("issues", {}).get("warning", []))
        + len(a.get("issues", {}).get("info", []))
        for a in project_audits
    )

    vitals_list = []
    for a in project_audits:
        if a["id"] in _vitals:
            vitals_list.append(_vitals[a["id"]])

    avg_lcp = round(sum(v["lcp"] for v in vitals_list) / max(len(vitals_list), 1), 2)
    avg_cls = round(sum(v["cls"] for v in vitals_list) / max(len(vitals_list), 1), 3)
    avg_inp = round(sum(v["inp"] for v in vitals_list) / max(len(vitals_list), 1), 0)

    trend = []
    for a in sorted(project_audits, key=lambda x: x["created_at"]):
        trend.append({
            "date": a["created_at"],
            "score": a["overall_score"],
            "performance": a["performance_score"],
        })

    return PerformanceDashboardResponse(
        overall_score=sum(a["overall_score"] for a in project_audits) // len(project_audits),
        performance_score=sum(a["performance_score"] for a in project_audits) // len(project_audits),
        accessibility_score=sum(a["accessibility_score"] for a in project_audits) // len(project_audits),
        best_practices_score=sum(a["best_practices_score"] for a in project_audits) // len(project_audits),
        seo_score=sum(a["seo_score"] for a in project_audits) // len(project_audits),
        total_audits=len(project_audits),
        total_issues=total_issues,
        total_recommendations=len(project_recs),
        resolved_recommendations=sum(1 for r in project_recs if r.get("status") == "resolved"),
        avg_lcp=avg_lcp,
        avg_cls=avg_cls,
        avg_inp=avg_inp,
        trend=trend,
    )


# ─── AUDITS ─────────────────────────────────────────────────────────────────


@router.get("/audits", response_model=list[PerformanceAuditResponse])
async def list_audits(project_id: str = Query(default="dev-project"), user: str = Depends(get_current_user)):
    check_rate_limit(f"list:{user}")
    audits = [a for a in _audits.values() if a["project_id"] == project_id]
    return [
        PerformanceAuditResponse(
            id=a["id"], project_id=a["project_id"], url=a["url"],
            status=a["status"], overall_score=a["overall_score"],
            performance_score=a["performance_score"],
            accessibility_score=a["accessibility_score"],
            best_practices_score=a["best_practices_score"],
            seo_score=a["seo_score"],
            metrics=a.get("metrics"), issues=a.get("issues"),
            recommendations=a.get("recommendations"), resources=a.get("resources"),
            created_at=a["created_at"], completed_at=a.get("completed_at"),
        )
        for a in sorted(audits, key=lambda x: x["created_at"], reverse=True)
    ]


@router.post("/audits", response_model=PerformanceAuditResponse)
async def run_audit(data: PerformanceAuditRequest, user: str = Depends(get_current_user)):
    check_rate_limit(f"create:{user}")

    now = datetime.now(timezone.utc).isoformat()
    audit_id = str(uuid.uuid4())

    audit_data = _generate_audit_data(data.url)
    vitals_data = _generate_vitals(data.url)
    recs = _generate_recommendations(audit_id, audit_data)
    img_audits = _generate_image_audits(audit_id)
    asset_audits = _generate_asset_audits(audit_id)

    vitals_entry = {
        "id": str(uuid.uuid4()),
        "audit_id": audit_id,
        "url": data.url,
        **vitals_data,
        "created_at": now,
    }

    audit = {
        "id": audit_id,
        "project_id": data.project_id,
        "url": data.url,
        "status": "completed",
        "overall_score": audit_data["overall_score"],
        "performance_score": audit_data["performance_score"],
        "accessibility_score": audit_data["accessibility_score"],
        "best_practices_score": audit_data["best_practices_score"],
        "seo_score": audit_data["seo_score"],
        "metrics": audit_data["metrics"],
        "issues": audit_data["issues"],
        "recommendations": {"count": len(recs)},
        "resources": audit_data["resources"],
        "created_at": now,
        "completed_at": now,
    }

    _audits[audit_id] = audit
    _vitals[audit_id] = vitals_entry
    _recommendations[audit_id] = recs
    _image_audits[audit_id] = img_audits
    _asset_audits[audit_id] = asset_audits

    _history.setdefault(data.project_id, []).append({
        "id": str(uuid.uuid4()),
        "project_id": data.project_id,
        "event_type": "audit_completed",
        "data": {"audit_id": audit_id, "url": data.url, "overall_score": audit_data["overall_score"]},
        "score_before": None,
        "score_after": audit_data["overall_score"],
        "created_at": now,
    })

    return PerformanceAuditResponse(
        id=audit_id, project_id=data.project_id, url=data.url,
        status="completed", overall_score=audit_data["overall_score"],
        performance_score=audit_data["performance_score"],
        accessibility_score=audit_data["accessibility_score"],
        best_practices_score=audit_data["best_practices_score"],
        seo_score=audit_data["seo_score"],
        metrics=audit_data["metrics"], issues=audit_data["issues"],
        recommendations={"count": len(recs)}, resources=audit_data["resources"],
        created_at=now, completed_at=now,
    )


@router.get("/audits/{audit_id}", response_model=PerformanceAuditResponse)
async def get_audit(audit_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"read:{user}")
    if audit_id not in _audits:
        raise HTTPException(status_code=404, detail="Audit not found")
    a = _audits[audit_id]
    return PerformanceAuditResponse(
        id=a["id"], project_id=a["project_id"], url=a["url"],
        status=a["status"], overall_score=a["overall_score"],
        performance_score=a["performance_score"],
        accessibility_score=a["accessibility_score"],
        best_practices_score=a["best_practices_score"],
        seo_score=a["seo_score"],
        metrics=a.get("metrics"), issues=a.get("issues"),
        recommendations=a.get("recommendations"), resources=a.get("resources"),
        created_at=a["created_at"], completed_at=a.get("completed_at"),
    )


# ─── VITALS ─────────────────────────────────────────────────────────────────


@router.get("/audits/{audit_id}/vitals", response_model=CoreWebVitalsResponse)
async def get_audit_vitals(audit_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"read:{user}")
    if audit_id not in _vitals:
        raise HTTPException(status_code=404, detail="Vitals not found for this audit")
    v = _vitals[audit_id]
    return CoreWebVitalsResponse(
        id=v["id"], audit_id=v["audit_id"], url=v["url"],
        lcp=v["lcp"], lcp_status=v["lcp_status"],
        inp=v["inp"], inp_status=v["inp_status"],
        cls=v["cls"], cls_status=v["cls_status"],
        fcp=v["fcp"], fcp_status=v["fcp_status"],
        ttfb=v["ttfb"], ttfb_status=v["ttfb_status"],
        speed_index=v["speed_index"], speed_index_status=v["speed_index_status"],
        tbt=v["tbt"], tbt_status=v["tbt_status"],
        created_at=v["created_at"],
    )


# ─── IMAGE AUDITS ───────────────────────────────────────────────────────────


@router.get("/audits/{audit_id}/images", response_model=list[ImageAuditResponse])
async def get_audit_images(audit_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"read:{user}")
    if audit_id not in _image_audits:
        raise HTTPException(status_code=404, detail="Image audits not found for this audit")
    return [
        ImageAuditResponse(
            id=img["id"], audit_id=img["audit_id"], url=img["url"],
            original_size=img["original_size"], optimized_size=img.get("optimized_size"),
            format=img["format"], recommended_format=img.get("recommended_format"),
            width=img.get("width"), height=img.get("height"),
            has_lazy_loading=img["has_lazy_loading"], has_alt_text=img["has_alt_text"],
            issues=img.get("issues"), savings_bytes=img["savings_bytes"],
            created_at=img["created_at"],
        )
        for img in _image_audits[audit_id]
    ]


# ─── ASSET AUDITS ───────────────────────────────────────────────────────────


@router.get("/audits/{audit_id}/assets", response_model=list[AssetAuditResponse])
async def get_audit_assets(audit_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"read:{user}")
    if audit_id not in _asset_audits:
        raise HTTPException(status_code=404, detail="Asset audits not found for this audit")
    return [
        AssetAuditResponse(
            id=asset["id"], audit_id=asset["audit_id"], url=asset["url"],
            asset_type=asset["asset_type"], size=asset["size"],
            gzipped_size=asset.get("gzipped_size"),
            is_minified=asset["is_minified"],
            is_render_blocking=asset["is_render_blocking"],
            is_unused=asset["is_unused"],
            cache_control=asset.get("cache_control"),
            etag=asset.get("etag"),
            issues=asset.get("issues"),
            created_at=asset["created_at"],
        )
        for asset in _asset_audits[audit_id]
    ]


# ─── RECOMMENDATIONS ───────────────────────────────────────────────────────


@router.get("/audits/{audit_id}/recommendations", response_model=list[PerformanceRecommendationResponse])
async def get_audit_recommendations(audit_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"read:{user}")
    if audit_id not in _recommendations:
        raise HTTPException(status_code=404, detail="Recommendations not found for this audit")
    return [
        PerformanceRecommendationResponse(
            id=r["id"], audit_id=r["audit_id"], category=r["category"],
            priority=r["priority"], title=r["title"], problem=r.get("problem"),
            impact=r.get("impact"), estimated_improvement=r.get("estimated_improvement"),
            implementation_guide=r.get("implementation_guide"),
            status=r.get("status", "open"), created_at=r["created_at"],
        )
        for r in sorted(_recommendations[audit_id], key=lambda x: {"critical": 0, "high": 1, "medium": 2, "low": 3}.get(x.get("priority", "medium"), 2))
    ]


@router.post("/recommendations/{rec_id}/resolve")
async def resolve_recommendation(rec_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"update:{user}")
    for rec_list in _recommendations.values():
        for rec in rec_list:
            if rec["id"] == rec_id:
                rec["status"] = "resolved"
                return {"detail": "Recommendation resolved"}
    raise HTTPException(status_code=404, detail="Recommendation not found")


# ─── HISTORY ────────────────────────────────────────────────────────────────


@router.get("/history", response_model=list[OptimizationHistoryResponse])
async def list_history(project_id: str = Query(default="dev-project"), event_type: str | None = None, user: str = Depends(get_current_user)):
    check_rate_limit(f"list:{user}")
    history = _history.get(project_id, [])
    if event_type:
        history = [h for h in history if h["event_type"] == event_type]
    return [
        OptimizationHistoryResponse(
            id=h["id"], project_id=h["project_id"], event_type=h["event_type"],
            data=h.get("data"), score_before=h.get("score_before"),
            score_after=h.get("score_after"), created_at=h["created_at"],
        )
        for h in sorted(history, key=lambda x: x["created_at"], reverse=True)
    ]


# ─── REPORTS ────────────────────────────────────────────────────────────────


@router.get("/reports", response_model=list[PerformanceReportResponse])
async def list_reports(project_id: str = Query(default="dev-project"), user: str = Depends(get_current_user)):
    check_rate_limit(f"list:{user}")
    reports = [r for r in _reports.values() if r["project_id"] == project_id]
    return [
        PerformanceReportResponse(
            id=r["id"], project_id=r["project_id"], title=r["title"],
            status=r["status"], summary=r.get("summary"),
            score=r.get("score", 0), file_url=r.get("file_url"),
            created_at=r["created_at"], completed_at=r.get("completed_at"),
        )
        for r in sorted(reports, key=lambda x: x["created_at"], reverse=True)
    ]


@router.post("/reports", response_model=PerformanceReportResponse)
async def create_report(data: PerformanceReportCreateRequest, user: str = Depends(get_current_user)):
    check_rate_limit(f"create:{user}")

    now = datetime.now(timezone.utc).isoformat()
    rid = str(uuid.uuid4())

    project_audits = [a for a in _audits.values() if a["project_id"] == data.project_id]
    project_recs = [r for rid_list in _recommendations.values() for r in rid_list if any(a["id"] == r["audit_id"] for a in project_audits)]

    avg_performance = sum(a["performance_score"] for a in project_audits) // max(len(project_audits), 1)
    avg_accessibility = sum(a["accessibility_score"] for a in project_audits) // max(len(project_audits), 1)
    avg_seo = sum(a["seo_score"] for a in project_audits) // max(len(project_audits), 1)
    avg_overall = sum(a["overall_score"] for a in project_audits) // max(len(project_audits), 1)

    summary = {
        "total_audits": len(project_audits),
        "avg_performance_score": avg_performance,
        "avg_accessibility_score": avg_accessibility,
        "avg_seo_score": avg_seo,
        "total_recommendations": len(project_recs),
        "resolved_recommendations": sum(1 for r in project_recs if r.get("status") == "resolved"),
        "open_recommendations": sum(1 for r in project_recs if r.get("status") == "open"),
        "total_issues": sum(
            len(a.get("issues", {}).get("critical", []))
            + len(a.get("issues", {}).get("warning", []))
            + len(a.get("issues", {}).get("info", []))
            for a in project_audits
        ),
    }

    report = {
        "id": rid,
        "project_id": data.project_id,
        "title": data.title,
        "status": "completed",
        "summary": summary,
        "score": avg_overall,
        "file_url": None,
        "created_at": now,
        "completed_at": now,
    }
    _reports[rid] = report

    _history.setdefault(data.project_id, []).append({
        "id": str(uuid.uuid4()),
        "project_id": data.project_id,
        "event_type": "report_created",
        "data": {"report_id": rid, "title": data.title},
        "score_before": None,
        "score_after": avg_overall,
        "created_at": now,
    })

    return PerformanceReportResponse(
        id=rid, project_id=data.project_id, title=data.title,
        status="completed", summary=summary, score=avg_overall,
        created_at=now, completed_at=now,
    )


@router.get("/reports/{report_id}", response_model=PerformanceReportResponse)
async def get_report(report_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"read:{user}")
    if report_id not in _reports:
        raise HTTPException(status_code=404, detail="Report not found")
    r = _reports[report_id]
    return PerformanceReportResponse(
        id=r["id"], project_id=r["project_id"], title=r["title"],
        status=r["status"], summary=r.get("summary"),
        score=r.get("score", 0), file_url=r.get("file_url"),
        created_at=r["created_at"], completed_at=r.get("completed_at"),
    )


# ─── AI RECOMMENDATIONS ────────────────────────────────────────────────────


@router.post("/ai/recommend", response_model=PerformanceAIRecommendResponse)
async def ai_recommend(data: PerformanceAIRecommendRequest, user: str = Depends(get_current_user)):
    check_rate_limit(f"ai:{user}", AI_RATE_LIMIT_MAX)

    from app.engine import get_ai_engine
    engine = get_ai_engine()

    issues_text = ""
    if data.issues:
        critical = data.issues.get("critical", [])
        warning = data.issues.get("warning", [])
        info = data.issues.get("info", [])
        issues_text = (
            f"\nCritical issues: {len(critical)}\n"
            f"Warning issues: {len(warning)}\n"
            f"Info issues: {len(info)}\n"
        )
        if critical:
            issues_text += "Critical: " + "; ".join(i.get("message", "") for i in critical[:5]) + "\n"

    try:
        prompt = (
            f"Analyze website performance for: {data.url}\n\n"
            f"Scores:\n"
            f"- Performance: {data.scores.get('performance', 0)}/100\n"
            f"- Accessibility: {data.scores.get('accessibility', 0)}/100\n"
            f"- Best Practices: {data.scores.get('best_practices', 0)}/100\n"
            f"- SEO: {data.scores.get('seo', 0)}/100\n\n"
            f"Metrics:\n"
            + "\n".join(f"- {k}: {v}" for k, v in data.metrics.items())
            + f"\n{issues_text}\n"
            "Return a JSON object with:\n"
            "- recommendations: array of {category, priority, title, problem, impact, estimated_improvement, implementation_guide}\n"
            "Provide 5-8 actionable performance optimization recommendations."
        )

        response = await engine.generate_json(prompt=prompt, operation="performance_ai_recommend", user_id=user)

        result = response.json_data or {} if response.success else {}
        recs = result.get("recommendations", [])
        if not isinstance(recs, list):
            recs = []

        return PerformanceAIRecommendResponse(
            recommendations=recs,
            provider=response.provider or "none",
            latency_ms=response.latency_ms or 0,
        )
    except HTTPException:
        raise
    except Exception:
        return PerformanceAIRecommendResponse(
            recommendations=[], provider="none", latency_ms=0,
        )


# ─── EXPORT ─────────────────────────────────────────────────────────────────


@router.post("/export", response_model=PerformanceExportResponse)
async def export_performance(data: PerformanceExportRequest, user: str = Depends(get_current_user)):
    check_rate_limit(f"export:{user}")
    if data.format not in ("json", "csv", "html", "markdown"):
        raise HTTPException(status_code=400, detail="Unsupported format. Use json, csv, html, or markdown.")
    return PerformanceExportResponse(content="", format=data.format, filename=f"performance-report.{data.format}")


@router.get("/projects/{project_id}/export", response_model=PerformanceExportResponse)
async def export_project_performance(project_id: str, format: str = "json", user: str = Depends(get_current_user)):
    check_rate_limit(f"export:{user}")

    project_audits = [a for a in _audits.values() if a["project_id"] == project_id]
    project_recs = [r for rid_list in _recommendations.values() for r in rid_list if any(a["id"] == r["audit_id"] for a in project_audits)]

    report_data = {
        "project_id": project_id,
        "audits": project_audits,
        "recommendations": project_recs,
        "summary": {
            "total_audits": len(project_audits),
            "total_recommendations": len(project_recs),
            "resolved": sum(1 for r in project_recs if r.get("status") == "resolved"),
            "avg_performance_score": sum(a["performance_score"] for a in project_audits) // max(len(project_audits), 1),
            "avg_overall_score": sum(a["overall_score"] for a in project_audits) // max(len(project_audits), 1),
        },
    }

    if format == "json":
        import json
        content = json.dumps(report_data, indent=2, default=str)
        filename = f"performance-export-{project_id[:8]}.json"
    elif format == "markdown":
        lines = [
            f"# Performance Report: {project_id[:8]}\n",
            f"**Audits:** {len(project_audits)}\n",
            f"**Recommendations:** {len(project_recs)}\n\n",
            "## Audits\n",
        ]
        for a in project_audits:
            lines.append(f"- [{a['created_at']}] Overall: {a['overall_score']} | Perf: {a['performance_score']} | A11y: {a['accessibility_score']} | SEO: {a['seo_score']}")
        lines.append("\n## Recommendations\n")
        for rec in project_recs[:20]:
            lines.append(f"- [{rec['priority'].upper()}] {rec['title']} ({rec['status']})")
        content = "\n".join(lines)
        filename = f"performance-export-{project_id[:8]}.md"
    elif format == "html":
        content = (
            f"<html><head><title>Performance Report</title></head><body>"
            f"<h1>Performance Report: {project_id[:8]}</h1>"
            f"<p>Total Audits: {len(project_audits)}</p>"
            f"<p>Total Recommendations: {len(project_recs)}</p>"
            f"<h2>Audits</h2><ul>"
        )
        for a in project_audits:
            content += f"<li>Score: {a['overall_score']} - Performance: {a['performance_score']} - SEO: {a['seo_score']}</li>"
        content += "</ul><h2>Recommendations</h2><ul>"
        for rec in project_recs[:20]:
            content += f"<li>[{rec['priority'].upper()}] {rec['title']} - {rec['status']}</li>"
        content += "</ul></body></html>"
        filename = f"performance-export-{project_id[:8]}.html"
    elif format == "csv":
        lines = ["audit_id,url,overall_score,performance_score,accessibility_score,best_practices_score,seo_score,created_at"]
        for a in project_audits:
            lines.append(
                f"{a['id']},{a['url']},{a['overall_score']},{a['performance_score']},"
                f"{a['accessibility_score']},{a['best_practices_score']},{a['seo_score']},{a['created_at']}"
            )
        content = "\n".join(lines)
        filename = f"performance-audits-{project_id[:8]}.csv"
    else:
        content = str(report_data)
        filename = f"performance-export-{project_id[:8]}.txt"

    return PerformanceExportResponse(content=content, format=format, filename=filename)
