import random
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query

from app.core.security import get_current_user

router = APIRouter()

# ─── IN-MEMORY STORE ─────────────────────────────────────────────────────────

_analytics_store: dict[str, dict] = {}


def _generate_demo_data(workspace_id: str) -> dict:
    """Generate realistic demo analytics data."""
    now = datetime.now(timezone.utc)
    
    if workspace_id in _analytics_store:
        return _analytics_store[workspace_id]
    
    # Generate 90 days of timeseries data
    timeseries = []
    for i in range(90, -1, -1):
        date = now - timedelta(days=i)
        day_of_week = date.weekday()
        
        # Weekends have less traffic
        base_visitors = random.randint(120, 350) if day_of_week < 5 else random.randint(60, 180)
        # Add some growth trend
        growth_factor = 1 + (90 - i) * 0.003
        visitors = int(base_visitors * growth_factor)
        pageviews = int(visitors * random.uniform(2.1, 3.8))
        bounce_rate = round(random.uniform(28, 62), 1)
        avg_session = round(random.uniform(1.5, 6.2), 1)
        
        timeseries.append({
            "date": date.strftime("%Y-%m-%d"),
            "visitors": visitors,
            "pageviews": pageviews,
            "bounce_rate": bounce_rate,
            "avg_session_duration": avg_session,
        })
    
    # Top pages
    pages = [
        {"path": "/", "title": "Homepage", "pageviews": random.randint(8000, 15000), "unique_visitors": random.randint(5000, 10000), "bounce_rate": round(random.uniform(20, 40), 1), "avg_time": round(random.uniform(1.5, 4.0), 1)},
        {"path": "/pricing", "title": "Pricing", "pageviews": random.randint(3000, 7000), "unique_visitors": random.randint(2000, 5000), "bounce_rate": round(random.uniform(15, 35), 1), "avg_time": round(random.uniform(2.0, 5.0), 1)},
        {"path": "/features", "title": "Features", "pageviews": random.randint(2500, 6000), "unique_visitors": random.randint(1800, 4000), "bounce_rate": round(random.uniform(25, 50), 1), "avg_time": round(random.uniform(1.8, 4.5), 1)},
        {"path": "/blog/ai-website-builder", "title": "AI Website Builder Guide", "pageviews": random.randint(1500, 4000), "unique_visitors": random.randint(1200, 3000), "bounce_rate": round(random.uniform(30, 55), 1), "avg_time": round(random.uniform(2.5, 6.0), 1)},
        {"path": "/blog/seo-optimization", "title": "SEO Optimization Tips", "pageviews": random.randint(1200, 3500), "unique_visitors": random.randint(900, 2800), "bounce_rate": round(random.uniform(28, 48), 1), "avg_time": round(random.uniform(3.0, 7.0), 1)},
        {"path": "/docs/getting-started", "title": "Getting Started", "pageviews": random.randint(1000, 3000), "unique_visitors": random.randint(800, 2500), "bounce_rate": round(random.uniform(20, 40), 1), "avg_time": round(random.uniform(4.0, 8.0), 1)},
        {"path": "/blog/email-marketing", "title": "Email Marketing Strategies", "pageviews": random.randint(800, 2500), "unique_visitors": random.randint(600, 2000), "bounce_rate": round(random.uniform(32, 52), 1), "avg_time": round(random.uniform(2.0, 5.5), 1)},
        {"path": "/about", "title": "About Us", "pageviews": random.randint(600, 2000), "unique_visitors": random.randint(500, 1800), "bounce_rate": round(random.uniform(35, 60), 1), "avg_time": round(random.uniform(1.0, 3.0), 1)},
        {"path": "/contact", "title": "Contact", "pageviews": random.randint(400, 1500), "unique_visitors": random.randint(350, 1300), "bounce_rate": round(random.uniform(40, 65), 1), "avg_time": round(random.uniform(0.8, 2.5), 1)},
        {"path": "/blog/social-media-tips", "title": "Social Media Tips", "pageviews": random.randint(500, 1800), "unique_visitors": random.randint(400, 1500), "bounce_rate": round(random.uniform(30, 50), 1), "avg_time": round(random.uniform(2.2, 5.0), 1)},
    ]
    
    # Traffic sources
    sources = [
        {"name": "Organic Search", "sessions": random.randint(8000, 18000), "percentage": 0, "color": "#6366f1"},
        {"name": "Direct", "sessions": random.randint(4000, 9000), "percentage": 0, "color": "#8b5cf6"},
        {"name": "Social Media", "sessions": random.randint(3000, 7000), "percentage": 0, "color": "#a78bfa"},
        {"name": "Referral", "sessions": random.randint(2000, 5000), "percentage": 0, "color": "#c4b5fd"},
        {"name": "Email", "sessions": random.randint(1500, 4000), "percentage": 0, "color": "#ddd6fe"},
        {"name": "Paid Ads", "sessions": random.randint(1000, 3000), "percentage": 0, "color": "#ede9fe"},
    ]
    total_source_sessions = sum(s["sessions"] for s in sources)
    for s in sources:
        s["percentage"] = round(s["sessions"] / total_source_sessions * 100, 1)
    
    # Devices
    devices = [
        {"name": "Desktop", "sessions": random.randint(8000, 16000), "percentage": 0},
        {"name": "Mobile", "sessions": random.randint(5000, 12000), "percentage": 0},
        {"name": "Tablet", "sessions": random.randint(1000, 3000), "percentage": 0},
    ]
    total_device_sessions = sum(d["sessions"] for d in devices)
    for d in devices:
        d["percentage"] = round(d["sessions"] / total_device_sessions * 100, 1)
    
    # Browsers
    browsers = [
        {"name": "Chrome", "sessions": random.randint(10000, 20000), "percentage": 0},
        {"name": "Safari", "sessions": random.randint(3000, 8000), "percentage": 0},
        {"name": "Firefox", "sessions": random.randint(1500, 4000), "percentage": 0},
        {"name": "Edge", "sessions": random.randint(1000, 3000), "percentage": 0},
        {"name": "Other", "sessions": random.randint(200, 800), "percentage": 0},
    ]
    total_browser_sessions = sum(b["sessions"] for b in browsers)
    for b in browsers:
        b["percentage"] = round(b["sessions"] / total_browser_sessions * 100, 1)
    
    # Countries
    countries = [
        {"name": "United States", "code": "US", "sessions": random.randint(5000, 12000), "percentage": 0},
        {"name": "United Kingdom", "code": "GB", "sessions": random.randint(2000, 5000), "percentage": 0},
        {"name": "Germany", "code": "DE", "sessions": random.randint(1500, 4000), "percentage": 0},
        {"name": "Canada", "code": "CA", "sessions": random.randint(1200, 3000), "percentage": 0},
        {"name": "France", "code": "FR", "sessions": random.randint(800, 2500), "percentage": 0},
        {"name": "Australia", "code": "AU", "sessions": random.randint(700, 2000), "percentage": 0},
        {"name": "India", "code": "IN", "sessions": random.randint(600, 1800), "percentage": 0},
        {"name": "Other", "code": "XX", "sessions": random.randint(1500, 4000), "percentage": 0},
    ]
    total_country_sessions = sum(c["sessions"] for c in countries)
    for c in countries:
        c["percentage"] = round(c["sessions"] / total_country_sessions * 100, 1)
    
    # Aggregate stats from timeseries
    last_30 = timeseries[-30:]
    prev_30 = timeseries[-60:-30]
    
    current_visitors = sum(d["visitors"] for d in last_30)
    prev_visitors = sum(d["visitors"] for d in prev_30)
    current_pageviews = sum(d["pageviews"] for d in last_30)
    prev_pageviews = sum(d["pageviews"] for d in prev_30)
    current_bounce = sum(d["bounce_rate"] for d in last_30) / 30
    prev_bounce = sum(d["bounce_rate"] for d in prev_30) / 30
    current_session = sum(d["avg_session_duration"] for d in last_30) / 30
    prev_session = sum(d["avg_session_duration"] for d in prev_30) / 30
    
    def calc_change(current, previous):
        if previous == 0:
            return 0
        return round((current - previous) / previous * 100, 1)
    
    data = {
        "overview": {
            "total_visitors": current_visitors,
            "visitors_change": calc_change(current_visitors, prev_visitors),
            "total_pageviews": current_pageviews,
            "pageviews_change": calc_change(current_pageviews, prev_pageviews),
            "bounce_rate": round(current_bounce, 1),
            "bounce_rate_change": calc_change(current_bounce, prev_bounce),
            "avg_session_duration": round(current_session, 1),
            "session_change": calc_change(current_session, prev_session),
            "total_sessions": current_visitors + random.randint(500, 2000),
            "sessions_change": round(random.uniform(-5, 15), 1),
            "new_users": int(current_visitors * random.uniform(0.55, 0.72)),
            "returning_users": int(current_visitors * random.uniform(0.28, 0.45)),
        },
        "timeseries": timeseries,
        "pages": pages,
        "sources": sources,
        "devices": devices,
        "browsers": browsers,
        "countries": countries,
        "realtime": {
            "active_users": random.randint(15, 85),
            "pages_per_session": round(random.uniform(2.1, 3.8), 1),
            "top_page": pages[0]["title"],
        },
    }
    
    _analytics_store[workspace_id] = data
    return data


# ─── ENDPOINTS ───────────────────────────────────────────────────────────────


@router.get("/dashboard")
async def get_analytics_dashboard(
    workspace_id: str = Query(default="ws-default"),
    period: str = Query(default="30d", regex="^(7d|30d|90d|all)$"),
    user: str = Depends(get_current_user),
):
    data = _generate_demo_data(workspace_id)
    
    # Slice timeseries based on period
    timeseries = data["timeseries"]
    if period == "7d":
        timeseries = timeseries[-7:]
    elif period == "30d":
        timeseries = timeseries[-30:]
    elif period == "90d":
        timeseries = timeseries[-90:]
    
    # Recalculate overview for the selected period
    if timeseries:
        visitors = sum(d["visitors"] for d in timeseries)
        pageviews = sum(d["pageviews"] for d in timeseries)
        bounce = sum(d["bounce_rate"] for d in timeseries) / len(timeseries)
        session = sum(d["avg_session_duration"] for d in timeseries) / len(timeseries)
    else:
        visitors = pageviews = 0
        bounce = session = 0
    
    return {
        "overview": {
            "total_visitors": visitors,
            "visitors_change": data["overview"]["visitors_change"],
            "total_pageviews": pageviews,
            "pageviews_change": data["overview"]["pageviews_change"],
            "bounce_rate": round(bounce, 1),
            "bounce_rate_change": data["overview"]["bounce_rate_change"],
            "avg_session_duration": round(session, 1),
            "session_change": data["overview"]["session_change"],
            "total_sessions": visitors + random.randint(100, 500),
            "sessions_change": data["overview"]["sessions_change"],
            "new_users": int(visitors * 0.63),
            "returning_users": int(visitors * 0.37),
        },
        "timeseries": timeseries,
        "realtime": data["realtime"],
    }


@router.get("/pages")
async def get_analytics_pages(
    workspace_id: str = Query(default="ws-default"),
    sort_by: str = Query(default="pageviews", regex="^(pageviews|unique_visitors|bounce_rate|avg_time)$"),
    sort_order: str = Query(default="desc", regex="^(asc|desc)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    user: str = Depends(get_current_user),
):
    data = _generate_demo_data(workspace_id)
    pages = data["pages"]
    
    reverse = sort_order == "desc"
    pages.sort(key=lambda x: x[sort_by], reverse=reverse)
    
    total = len(pages)
    start = (page - 1) * page_size
    
    return {
        "items": pages[start:start + page_size],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/sources")
async def get_analytics_sources(
    workspace_id: str = Query(default="ws-default"),
    user: str = Depends(get_current_user),
):
    data = _generate_demo_data(workspace_id)
    return {"sources": data["sources"]}


@router.get("/devices")
async def get_analytics_devices(
    workspace_id: str = Query(default="ws-default"),
    user: str = Depends(get_current_user),
):
    data = _generate_demo_data(workspace_id)
    return {"devices": data["devices"], "browsers": data["browsers"]}


@router.get("/countries")
async def get_analytics_countries(
    workspace_id: str = Query(default="ws-default"),
    user: str = Depends(get_current_user),
):
    data = _generate_demo_data(workspace_id)
    return {"countries": data["countries"]}


@router.get("/realtime")
async def get_analytics_realtime(
    workspace_id: str = Query(default="ws-default"),
    user: str = Depends(get_current_user),
):
    data = _generate_demo_data(workspace_id)
    # Simulate slightly different realtime number
    realtime = data["realtime"]
    realtime["active_users"] = max(1, realtime["active_users"] + random.randint(-5, 5))
    return realtime
