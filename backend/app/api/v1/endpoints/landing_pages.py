import time
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from app.core.security import get_current_user
from app.schemas.landing_page import (
    CopyImproveRequest,
    CopyImproveResponse,
    LandingPageCreateRequest,
    LandingPagePromptRequest,
    LandingPageRestoreRequest,
    LandingPageUpdateRequest,
)

router = APIRouter()

_lp_store: dict[str, dict] = {}
_lp_versions: dict[str, list[dict]] = {}
_rate_limits: dict[str, list[float]] = {}

RATE_LIMIT_WINDOW = 60.0
RATE_LIMIT_MAX_REQUESTS = 30
AI_RATE_LIMIT_MAX = 5


def check_rate_limit(key: str, max_requests: int = RATE_LIMIT_MAX_REQUESTS) -> None:
    now = time.time()
    if key not in _rate_limits:
        _rate_limits[key] = []
    _rate_limits[key] = [t for t in _rate_limits[key] if now - t < RATE_LIMIT_WINDOW]
    if len(_rate_limits[key]) >= max_requests:
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Try again later.")
    _rate_limits[key].append(now)


@router.post("/generate")
async def generate_landing_page(data: LandingPagePromptRequest, user: str = Depends(get_current_user)):
    check_rate_limit(f"ai:{user}", AI_RATE_LIMIT_MAX)
    from app.engine import get_ai_engine

    engine = get_ai_engine()

    color_palette = data.color_palette or {"primary": "#0066CC", "secondary": "#004499", "accent": "#00AAFF"}
    year = str(datetime.now(timezone.utc).year)
    bn = data.business_name
    pn = data.product_name
    desc = data.description
    industry = data.industry
    audience = data.target_audience
    voice = data.brand_voice
    cta1 = data.primary_cta or "Get Started"
    cta2 = data.secondary_cta or "Learn More"
    pcolor = color_palette.get("primary", "#0066CC")
    scolor = color_palette.get("secondary", "#004499")
    acolor = color_palette.get("accent", "#00AAFF")

    fallback_content = {
        "title": f"{pn} — {industry} Solution",
        "hero": {
            "headline": f"The #1 {industry} Platform for {audience}",
            "subheadline": f"{desc[:120] if desc else f'{pn} helps {audience} achieve {data.primary_goal} faster and more efficiently'}",
            "primaryCta": cta1,
            "secondaryCta": cta2,
            "trustBadges": ["No credit card required", "Free 14-day trial", "Cancel anytime"],
            "imageUrl": None,
            "socialProof": {
                "label": f"Trusted by 10,000+ {audience} worldwide",
                "logos": ["Google", "Microsoft", "Stripe", "Shopify", "Notion"],
            },
        },
        "problem": {
            "headline": f"Stop Struggling With {industry} Challenges",
            "description": f"Most {audience} waste hours every week on manual processes that {pn} automates in seconds.",
            "points": [
                f"Manual workflows drain your team's productivity and morale",
                f"Disconnected tools create data silos and costly errors",
                f"Scaling {industry} operations requires hiring more people, not working smarter",
                f"Competitors using modern tools are leaving you behind",
            ],
        },
        "solution": {
            "headline": f"{pn}: The Modern Way to {data.primary_goal.title()}",
            "description": f"{pn} is purpose-built for {audience} who demand results. Our AI-powered platform eliminates busywork so you can focus on what matters — growing your {industry} business.",
            "highlights": [
                f"Automate repetitive tasks and save 10+ hours per week",
                f"Unified dashboard gives you complete visibility and control",
                f"Enterprise-grade security with 99.9% guaranteed uptime",
                f"Seamless integrations with your existing {industry} tools",
            ],
        },
        "benefits": [
            {"title": "Save Time", "description": f"Automate manual processes and reclaim 10+ hours every week. Spend less time on busywork, more time on strategy.", "icon": "Clock"},
            {"title": "Reduce Costs", "description": f"Cut operational costs by up to 40% while improving output quality. No more expensive manual bottlenecks.", "icon": "DollarSign"},
            {"title": "Scale Faster", "description": f"Grow without limits. Our platform handles 10x your current workload without breaking a sweat.", "icon": "TrendingUp"},
            {"title": "Work Smarter", "description": f"AI-powered insights surface opportunities you'd miss manually. Make data-driven decisions every time.", "icon": "Brain"},
            {"title": "Stay Compliant", "description": f"Built-in compliance tools ensure you meet every {industry} regulation automatically. Zero manual effort.", "icon": "Shield"},
            {"title": "Delight Customers", "description": f"Deliver exceptional experiences that keep {audience} coming back. NPS scores improve by an average of 40%.", "icon": "Heart"},
        ],
        "features": [
            {"title": "AI-Powered Automation", "description": "Intelligent workflows that learn from your patterns and automate repetitive tasks with zero configuration.", "icon": "Sparkles"},
            {"title": "Real-Time Analytics", "description": "Live dashboards with actionable insights. Track KPIs, identify trends, and make decisions backed by data.", "icon": "BarChart3"},
            {"title": "Team Collaboration", "description": "Shared workspaces, comments, and real-time editing. Keep your entire team aligned and productive.", "icon": "Users"},
            {"title": "API & Integrations", "description": "Connect with 200+ tools you already use. REST API and webhooks for custom integrations.", "icon": "Plug"},
            {"title": "Custom Reporting", "description": "Build beautiful, branded reports in minutes. Schedule automated delivery to stakeholders.", "icon": "FileText"},
            {"title": "Mobile App", "description": "Manage everything from your phone. Full feature access on iOS and Android with offline support.", "icon": "Smartphone"},
        ],
        "howItWorks": {
            "headline": f"Get Started in 3 Simple Steps",
            "steps": [
                {"number": 1, "title": "Create Your Account", "description": f"Sign up in 30 seconds. No credit card required. Import your existing {industry} data in one click."},
                {"number": 2, "title": "Configure Your Workspace", "description": f"Customize {pn} for your {audience} needs. Our setup wizard guides you through every option."},
                {"number": 3, "title": "See Results Instantly", "description": f"Watch your {data.primary_goal} improve within the first week. Most teams see a 3x ROI in 30 days."},
            ],
        },
        "socialProof": {
            "headline": "Loved by Industry Leaders",
            "logos": ["Google", "Microsoft", "Stripe", "Shopify", "Notion", "Slack"],
            "metrics": [
                {"value": "10,000+", "label": "Active Users"},
                {"value": "99.9%", "label": "Uptime SLA"},
                {"value": "4.9/5", "label": "Customer Rating"},
                {"value": "$2.4M", "label": "Saved for Clients"},
            ],
        },
        "testimonials": [
            {"name": "Sarah Chen", "role": "VP of Operations", "company": "TechFlow Inc.", "quote": f"{pn} transformed how our team works. We cut our workflow time by 60% in the first month. The ROI was immediate and dramatic.", "rating": 5, "imageUrl": None},
            {"name": "Marcus Rodriguez", "role": "Head of Growth", "company": "ScaleUp Labs", "quote": f"We tried every {industry} tool on the market. {pn} is the only one that actually delivered on its promises. Our revenue grew 3x in one quarter.", "rating": 5, "imageUrl": None},
            {"name": "Emily Watson", "role": "CEO", "company": "BrightPath Solutions", "quote": f"The best investment we've made this year. {pn} paid for itself in the first two weeks. Our team can't imagine going back.", "rating": 5, "imageUrl": None},
        ],
        "statistics": [
            {"value": "60%", "label": "Time Saved"},
            {"value": "3x", "label": "Faster Results"},
            {"value": "10,000+", "label": "Happy Customers"},
            {"value": "99.9%", "label": "Uptime"},
        ],
        "pricing": [
            {
                "name": "Starter",
                "price": "$29",
                "period": "/month",
                "description": "Perfect for individuals and small teams getting started",
                "features": ["5 team members", "10 GB storage", "Basic analytics", "Email support", "API access", "Core integrations"],
                "cta": "Start Free Trial",
                "highlighted": False,
            },
            {
                "name": "Professional",
                "price": "$79",
                "period": "/month",
                "description": "For growing teams that need advanced features and priority support",
                "features": ["Unlimited team members", "100 GB storage", "Advanced analytics & reports", "Priority support (4h SLA)", "Full API access", "All integrations", "Custom branding", "AI-powered automation"],
                "cta": "Start Free Trial",
                "highlighted": True,
            },
            {
                "name": "Enterprise",
                "price": "$199",
                "period": "/month",
                "description": "For large organizations with custom requirements and compliance needs",
                "features": ["Everything in Professional", "Unlimited storage", "Dedicated account manager", "SSO & SAML", "Custom integrations", "SLA guarantee", "On-premise deployment", "Audit logs", "White-label option"],
                "cta": "Contact Sales",
                "highlighted": False,
            },
        ],
        "guarantee": {
            "headline": "100% Money-Back Guarantee",
            "description": "Try {pn} risk-free for 30 days. If you're not completely satisfied, we'll refund every penny — no questions asked.".format(pn=pn),
            "icon": "ShieldCheck",
        },
        "faq": [
            {"question": f"How quickly can I get started with {pn}?", "answer": f"Most {audience} are up and running in under 5 minutes. Our guided setup wizard walks you through everything, and our migration tool imports your existing data in one click."},
            {"question": f"Is my {industry} data secure with {pn}?", "answer": f"Absolutely. We use bank-level AES-256 encryption, are SOC 2 Type II certified, and comply with all major {industry} regulations. Your data is hosted on enterprise-grade infrastructure with 99.9% uptime."},
            {"question": f"Can I integrate {pn} with my existing tools?", "answer": f"Yes! {pn} integrates with 200+ popular tools including Slack, Notion, Google Workspace, Microsoft 365, and more. We also provide a REST API and webhooks for custom integrations."},
            {"question": f"What kind of support does {pn} offer?", "answer": f"We offer email support for all plans, priority support (4-hour response time) for Professional, and a dedicated account manager for Enterprise. Our help center has 500+ articles and video tutorials."},
            {"question": f"Can I cancel my subscription anytime?", "answer": f"Absolutely. There are no long-term contracts. Cancel anytime from your dashboard and you'll keep access until the end of your billing period. We also offer a 30-day money-back guarantee."},
        ],
        "finalCta": {
            "headline": f"Ready to Transform Your {industry} Workflow?",
            "subheadline": f"Join 10,000+ {audience} who are already saving time and money with {pn}. Start your free trial today.",
            "cta": cta1,
        },
        "contact": {
            "headline": "Get in Touch",
            "description": f"Have questions about {pn}? Our team is here to help you find the perfect solution for your {industry} needs.",
            "email": f"hello@{bn.lower().replace(' ', '')}.com",
            "phone": None,
        },
        "footer": {
            "description": f"{pn} — The modern {industry} platform for {audience}.",
            "copyright": f"© {year} {bn}. All rights reserved.",
        },
        "seo": {
            "title": f"{pn} — #1 {industry} Platform for {audience}",
            "description": f"{desc[:120] if desc else f'{pn} helps {audience} {data.primary_goal} faster with AI-powered automation. Start your free trial.'}",
            "keywords": [pn, industry, audience, data.primary_goal, voice],
            "ogTitle": f"{pn}: The Modern Way to {data.primary_goal.title()}",
            "ogDescription": f"Join 10,000+ {audience} using {pn} to {data.primary_goal}. Free trial, no credit card required.",
            "schemaOrg": {"@type": "Organization", "name": bn, "description": desc or f"{pn} for {audience}"},
        },
        "twitterCard": {
            "card": "summary_large_image",
            "title": f"{pn} — {data.primary_goal.title()} for {audience}",
            "description": f"Join 10,000+ {audience} using {pn} to {data.primary_goal}. Start your free trial.",
        },
        "colors": {
            "primary": pcolor,
            "secondary": scolor,
            "accent": acolor,
        },
        "typography": data.typography or "Modern Sans-Serif",
    }

    try:
        prompt = engine.render_prompt(
            "landing_page_generation",
            "landing_page",
            business_name=bn,
            product_name=pn,
            description=desc,
            industry=industry,
            target_audience=audience,
            primary_goal=data.primary_goal,
            brand_voice=voice,
            language=data.language,
            country=data.country,
            primary_cta=cta1,
            secondary_cta=cta2,
            primary_color=pcolor,
            secondary_color=scolor,
            accent_color=acolor,
            typography=data.typography or "Modern Sans-Serif",
            sections_required=", ".join(data.sections_required) if data.sections_required else "all sections",
            year=year,
        )

        ai_response = await engine.generate_json(
            prompt,
            operation="landing_page_generation",
            user_id=user,
        )

        if ai_response.success and ai_response.json_data:
            return {"content": ai_response.json_data}

        return {"content": fallback_content}
    except Exception:
        return {"content": fallback_content}


@router.post("/")
async def create_landing_page(data: LandingPageCreateRequest, user: str = Depends(get_current_user)):
    check_rate_limit(f"create:{user}")
    lp_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    slug = data.name.lower().replace(" ", "-").replace(".", "")

    lp = {
        "id": lp_id,
        "projectId": data.project_id,
        "name": data.name,
        "slug": slug,
        "status": "draft",
        "currentVersion": 1,
        "generationPrompt": data.prompt,
        "aiResponse": data.content,
        "seoData": data.seo,
        "createdAt": now,
        "updatedAt": now,
    }
    _lp_store[lp_id] = lp

    version_entry = {
        "id": str(uuid.uuid4()),
        "landingPageId": lp_id,
        "versionNumber": 1,
        "content": data.content or {},
        "changeSummary": "Initial generation",
        "isAutoSave": False,
        "createdAt": now,
    }
    _lp_versions[lp_id] = [version_entry]

    return lp


@router.post("/improve-copy", response_model=CopyImproveResponse)
async def improve_copy(request: CopyImproveRequest, user: str = Depends(get_current_user)):
    check_rate_limit(f"ai:{user}", AI_RATE_LIMIT_MAX)
    from app.engine import get_ai_engine

    engine = get_ai_engine()

    action_map = {
        "regenerate": "Rewrite this completely with a fresh approach",
        "improve": "Improve the quality, clarity, and impact",
        "shorten": "Make this shorter and more concise while keeping the meaning",
        "expand": "Expand this with more detail and depth",
        "professional": "Rewrite in a professional, authoritative tone",
        "friendly": "Rewrite in a warm, friendly, approachable tone",
        "luxury": "Rewrite in a premium, luxury, sophisticated tone",
        "startup": "Rewrite in an energetic, startup-friendly tone",
        "technical": "Rewrite in a precise, technical, data-driven tone",
    }

    action_text = action_map.get(request.action, request.action)

    tone_instruction = "No specific tone requested."
    if request.tone:
        tone_instruction = f"Use a {request.tone} tone throughout."
    if request.context:
        tone_instruction += f"\nContext about the brand: {request.context}"

    try:
        prompt = engine.render_prompt(
            "copy_improve",
            "copywriting",
            action=action_text,
            text=request.text,
            tone_instruction=tone_instruction,
        )

        improved = await engine.generate(
            prompt,
            operation="copy_improve",
            user_id=user,
        )

        if improved.success:
            return CopyImproveResponse(original=request.text, improved=improved.text.strip())

        return CopyImproveResponse(original=request.text, improved=request.text)
    except Exception:
        return CopyImproveResponse(original=request.text, improved=request.text)


@router.get("/project/{project_id}")
async def list_landing_pages(project_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"list:{user}")
    return [lp for lp in _lp_store.values() if lp["projectId"] == project_id]


@router.get("/{lp_id}")
async def get_landing_page(lp_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"read:{user}")
    if lp_id not in _lp_store:
        raise HTTPException(status_code=404, detail="Landing page not found")
    return _lp_store[lp_id]


@router.put("/{lp_id}")
async def update_landing_page(
    lp_id: str,
    request: LandingPageUpdateRequest,
    user: str = Depends(get_current_user),
):
    check_rate_limit(f"update:{user}")
    if lp_id not in _lp_store:
        raise HTTPException(status_code=404, detail="Landing page not found")

    lp = _lp_store[lp_id]
    lp["aiResponse"] = request.content
    lp["updatedAt"] = datetime.now(timezone.utc).isoformat()

    new_version = lp["currentVersion"] + 1
    lp["currentVersion"] = new_version

    version_entry = {
        "id": str(uuid.uuid4()),
        "landingPageId": lp_id,
        "versionNumber": new_version,
        "content": request.content,
        "changeSummary": request.change_summary,
        "isAutoSave": False,
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }
    _lp_versions.setdefault(lp_id, []).append(version_entry)

    return lp


@router.post("/{lp_id}/auto-save")
async def auto_save_landing_page(
    lp_id: str,
    request: LandingPageUpdateRequest,
    user: str = Depends(get_current_user),
):
    check_rate_limit(f"autosave:{user}")
    if lp_id not in _lp_store:
        raise HTTPException(status_code=404, detail="Landing page not found")

    lp = _lp_store[lp_id]
    lp["aiResponse"] = request.content
    lp["updatedAt"] = datetime.now(timezone.utc).isoformat()

    version_entry = {
        "id": str(uuid.uuid4()),
        "landingPageId": lp_id,
        "versionNumber": lp["currentVersion"],
        "content": request.content,
        "changeSummary": "Auto-save",
        "isAutoSave": True,
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }
    _lp_versions.setdefault(lp_id, []).append(version_entry)

    return {"status": "saved"}


@router.get("/{lp_id}/versions")
async def list_versions(lp_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"read:{user}")
    return _lp_versions.get(lp_id, [])


@router.post("/{lp_id}/versions")
async def create_version(
    lp_id: str,
    request: LandingPageUpdateRequest,
    user: str = Depends(get_current_user),
):
    check_rate_limit(f"update:{user}")
    if lp_id not in _lp_store:
        raise HTTPException(status_code=404, detail="Landing page not found")

    lp = _lp_store[lp_id]
    lp["aiResponse"] = request.content
    lp["updatedAt"] = datetime.now(timezone.utc).isoformat()

    new_version = lp["currentVersion"] + 1
    lp["currentVersion"] = new_version

    version_entry = {
        "id": str(uuid.uuid4()),
        "landingPageId": lp_id,
        "versionNumber": new_version,
        "content": request.content,
        "changeSummary": request.change_summary or "Manual save",
        "isAutoSave": False,
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }
    _lp_versions.setdefault(lp_id, []).append(version_entry)

    return version_entry


@router.post("/{lp_id}/restore")
async def restore_version(
    lp_id: str,
    request: LandingPageRestoreRequest,
    user: str = Depends(get_current_user),
):
    check_rate_limit(f"update:{user}")
    if lp_id not in _lp_store:
        raise HTTPException(status_code=404, detail="Landing page not found")

    versions = _lp_versions.get(lp_id, [])
    target = None
    for v in versions:
        if v["versionNumber"] == request.version_number:
            target = v
            break

    if not target:
        raise HTTPException(status_code=404, detail="Version not found")

    lp = _lp_store[lp_id]
    lp["aiResponse"] = target["content"]
    lp["updatedAt"] = datetime.now(timezone.utc).isoformat()

    new_version = lp["currentVersion"] + 1
    lp["currentVersion"] = new_version

    restore_entry = {
        "id": str(uuid.uuid4()),
        "landingPageId": lp_id,
        "versionNumber": new_version,
        "content": target["content"],
        "changeSummary": f"Restored from version {request.version_number}",
        "isAutoSave": False,
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }
    _lp_versions[lp_id].append(restore_entry)

    return lp


@router.delete("/{lp_id}")
async def delete_landing_page(lp_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"delete:{user}")
    if lp_id not in _lp_store:
        raise HTTPException(status_code=404, detail="Landing page not found")
    del _lp_store[lp_id]
    _lp_versions.pop(lp_id, None)
    return {"detail": "Landing page deleted"}
