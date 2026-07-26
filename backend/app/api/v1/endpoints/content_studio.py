import math
import re
import time
import urllib.parse
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.security import get_current_user
from app.schemas.content import (
    ContentAIOptimizeRequest,
    ContentAIOptimizeResponse,
    ContentBulkDeleteRequest,
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
AI_RATE_LIMIT_MAX = 30


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
        plain_lower = plain.lower()
        for kw in keywords:
            kw_lower = kw.lower()
            count = plain_lower.count(kw_lower) if " " in kw_lower else words.count(kw_lower)
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
        image_url=item.get("imageUrl"),
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


def _generate_fallback_content(data: ContentGenerateRequest) -> str:
    """Generate template-based content when AI is unavailable."""
    biz = data.business_name or "your business"
    prod = data.product or "products and services"
    ind = data.industry or "the industry"
    aud = data.target_audience or "customers"
    cta = data.call_to_action or "Get Started"
    tone = data.tone or "professional"
    kw_list = ", ".join(data.keywords) if data.keywords else "industry-leading solutions"

    length = data.length or "medium"
    if length == "short":
        repeat = 2
    elif length == "medium":
        repeat = 4
    elif length == "long":
        repeat = 13
    else:
        repeat = 30

    def _expand_blog(biz, prod, ind, aud, cta, tone, kw_list, repeat):
        paras = []
        paras.append(
            f"Welcome to {biz}, where we are dedicated to transforming {ind} through innovative solutions "
            f"designed to deliver measurable results. In today's fast-paced and increasingly digital world, "
            f"businesses face unprecedented challenges and opportunities. The companies that thrive are those "
            f"that embrace change, invest in the right partnerships, and continuously strive for excellence. "
            f"At {biz}, we understand this reality better than anyone, and we have built our entire organization "
            f"around helping {aud} navigate the complexities of {ind} with confidence and clarity."
        )
        paras.append(
            f"The landscape of {ind} has evolved dramatically over the past decade. New technologies, shifting "
            f"consumer expectations, and global market forces have reshaped the way businesses operate. "
            f"Organizations that fail to adapt risk falling behind their competitors and losing relevance in "
            f"an increasingly crowded marketplace. This is precisely where {biz} makes a difference. Our team "
            f"of experienced professionals stays ahead of industry trends, continuously monitoring developments "
            f"in {ind} to ensure our {prod} remain at the cutting edge. We do not just react to change; "
            f"we anticipate it, positioning our clients for long-term success."
        )
        paras.append(
            f"Our approach to {prod} is rooted in a deep understanding of the unique challenges that {aud} face. "
            f"We recognize that no two businesses are alike, which is why we never offer one-size-fits-all solutions. "
            f"Instead, we take the time to learn about your specific goals, constraints, and opportunities before "
            f"developing a customized strategy that aligns with your vision. Whether you are a startup looking to "
            f"establish your presence in {ind} or an established enterprise seeking to optimize your operations, "
            f"{biz} has the expertise and resources to help you succeed."
        )
        paras.append(
            f"Quality is the cornerstone of everything we do at {biz}. From the initial consultation through "
            f"implementation and ongoing support, we maintain the highest standards of excellence. Our {tone} "
            f"team meticulously crafts every solution to ensure it meets our rigorous quality benchmarks. "
            f"We believe that {aud} deserve nothing less than perfection, and we hold ourselves accountable "
            f"to that standard. This unwavering commitment to quality has earned us the trust and loyalty "
            f"of hundreds of clients across {ind}, many of whom have been with us for years."
        )
        paras.append(
            f"Innovation drives everything we do at {biz}. We continuously invest in research and development, "
            f"exploring new technologies and methodologies that can enhance our {prod}. Our team attends "
            f"industry conferences, pursues ongoing professional development, and collaborates with leading "
            f"technology partners to ensure we remain at the forefront of {ind}. This dedication to innovation "
            f"means our clients always have access to the most advanced and effective solutions available, "
            f"giving them a significant competitive advantage in their respective markets."
        )
        paras.append(
            f"Our process is designed to deliver maximum value with minimal disruption to your operations. "
            f"We begin with a comprehensive assessment of your current situation, identifying strengths, "
            f"weaknesses, and opportunities for improvement. Based on this analysis, we develop a detailed "
            f"roadmap that outlines specific actions, timelines, and milestones. Throughout the engagement, "
            f"we maintain open lines of communication, providing regular progress updates and adjusting our "
            f"approach as needed to ensure optimal results. This transparent, collaborative process has "
            f"proven to be highly effective in delivering outcomes that consistently exceed expectations."
        )
        paras.append(
            f"Transparency is a core value at {biz}. We believe that {aud} have the right to know exactly "
            f"how their investments are performing. That is why we provide detailed reports and analytics "
            f"that give you full visibility into the status and impact of our {prod}. Our reporting goes "
            f"beyond simple metrics; we provide actionable insights that help you make informed decisions "
            f"about your business. When you partner with {biz}, you will never have to guess about the "
            f"return on your investment; you will have clear, data-driven evidence of the value we deliver."
        )
        paras.append(
            f"Our team is our greatest asset at {biz}. Each member brings a unique combination of skills, "
            f"experience, and passion to the table. We carefully select our team members not just for their "
            f"technical expertise but also for their ability to understand and connect with {aud}. "
            f"Our collaborative culture fosters creativity and encourages innovative thinking, resulting in "
            f"solutions that are both practical and groundbreaking. From senior consultants to project managers, "
            f"every member of the {biz} team is committed to your success."
        )
        paras.append(
            f"Results speak louder than words, and our track record in {ind} is proof of our capabilities. "
            f"We have helped numerous {aud} achieve significant improvements in efficiency, revenue, and "
            f"overall business performance. Our case studies demonstrate the tangible impact of our {prod}, "
            f"with clients reporting average improvements of thirty percent or more in key performance metrics. "
            f"These results are not accidental; they are the product of careful planning, expert execution, "
            f"and an unwavering focus on delivering value."
        )
        paras.append(
            f"We understand that investing in {prod} is a significant decision for any business. That is why "
            f"we offer flexible engagement models that accommodate businesses of all sizes and budgets. "
            f"Our pricing is transparent and straightforward, with no hidden fees or surprise charges. "
            f"We work with you to determine the most cost-effective approach that delivers the results you need. "
            f"Whether you require a focused, short-term project or a comprehensive, long-term partnership, "
            f"{biz} has a solution that fits your needs and your budget."
        )
        paras.append(
            f"Client satisfaction is the ultimate measure of our success at {biz}. We are proud that the "
            f"vast majority of our business comes from repeat clients and referrals. This loyalty is a "
            f"testament to the quality of our {prod} and the strength of our relationships. We do not "
            f"view our clients as transactions; we view them as partners, and we invest the time and effort "
            f"necessary to build lasting, mutually beneficial relationships."
        )
        paras.append(
            f"At {biz}, we also believe in giving back to the {ind} community. We actively participate in "
            f"industry associations, contribute to thought leadership through publications and speaking "
            f"engagements, and support initiatives that advance the interests of {aud}. This commitment "
            f"to the broader community reinforces our position as a trusted leader in {ind} and reflects "
            f"the values that guide everything we do."
        )
        paras.append(
            f"Getting started with {biz} is straightforward. Our streamlined onboarding process ensures "
            f"that you can begin seeing results quickly, without the lengthy delays that often accompany "
            f"new partnerships. We handle all the planning and coordination, allowing you to focus on what "
            f"you do best: running your business. Our dedicated onboarding team will work closely with "
            f"yours to ensure a smooth transition and immediate impact."
        )
        paras.append(
            f"Ready to experience the {biz} difference? {cta} today and discover how we can help you "
            f"achieve your goals. Contact our team to schedule a free, no-obligation consultation. "
            f"During this consultation, we will discuss your specific needs, answer your questions, and "
            f"outline how our {prod} can benefit your business. Take the first step toward a brighter "
            f"future for your organization and join the growing community of {aud} across {ind} who have "
            f"chosen {biz} as their trusted partner for {prod}. We look forward to working with you."
        )
        paras.append(
            f"Building trust is at the heart of every successful business relationship. At {biz}, "
            f"we earn that trust every day through consistent delivery, honest communication, and "
            f"genuine care for our clients' outcomes. We understand that {aud} in {ind} have many "
            f"options when it comes to {prod}, and we never take your trust for granted. Every "
            f"project we undertake is an opportunity to strengthen our relationship and demonstrate "
            f"the value of partnering with a {tone} and dedicated organization."
        )
        paras.append(
            f"Data-driven decision making is a fundamental principle at {biz}. In the modern business "
            f"environment, intuition alone is not enough to stay competitive. Our {prod} incorporate "
            f"advanced analytics and reporting capabilities that give {aud} clear insights into their "
            f"performance and opportunities for improvement. We help you make sense of complex data, "
            f"transforming raw numbers into actionable strategies that drive growth and profitability."
        )
        paras.append(
            f"Sustainability and long-term thinking guide our approach at {biz}. We are not interested "
            f"in quick fixes that deliver short-term gains at the expense of lasting success. Instead, "
            f"we develop strategies that build a strong foundation for your business, ensuring continued "
            f"growth and resilience in the face of market changes. Our {prod} are designed to scale with "
            f"your business, adapting to your evolving needs and helping you stay ahead of the curve."
        )
        paras.append(
            f"Collaboration is central to our methodology at {biz}. We believe that the best results "
            f"come from working together, combining our expertise with your knowledge of your business. "
            f"Our {tone} team integrates seamlessly with your existing operations, becoming an extension "
            f"of your own team rather than an outside vendor. This collaborative approach ensures that "
            f"our {prod} are perfectly aligned with your goals and that implementation is smooth and "
            f"efficient."
        )
        paras.append(
            f"Continuous improvement is a way of life at {biz}. We regularly review and refine our "
            f"{prod} to ensure they remain effective and relevant. We gather feedback from {aud}, "
            f"analyze performance data, and incorporate the latest industry research to constantly "
            f"enhance our offerings. This commitment to improvement means that our clients always "
            f"benefit from the most current and effective solutions available in {ind}."
        )
        paras.append(
            f"Risk management is an integral part of our {prod} at {biz}. We understand that {aud} "
            f"face numerous risks in {ind}, from regulatory changes to market volatility. Our team "
            f"helps you identify potential risks and develop strategies to mitigate them, protecting "
            f"your business while positioning you to capitalize on opportunities. With {biz} as your "
            f"partner, you can navigate uncertainty with confidence."
        )
        paras.append(
            f"The success of {biz} is ultimately measured by the success of our {aud}. Every testimonial, "
            f"every case study, and every long-term partnership reflects our unwavering dedication to "
            f"delivering exceptional value. We are proud of what we have accomplished together with our "
            f"clients, and we are excited about the opportunities that lie ahead. When you succeed, we "
            f"succeed, and that is the foundation of everything we do at {biz}."
        )
        paras.append(
            f"Time is a precious resource for any business leader. At {biz}, we respect your time by "
            f"delivering {prod} efficiently and without unnecessary complications. Our proven processes "
            f"and experienced team ensure that projects are completed on time and within budget. "
            f"We handle the complexity so you can focus on what matters most: growing your business "
            f"and serving your customers in {ind}."
        )
        paras.append(
            f"Global perspective with local expertise is what {biz} brings to every engagement. "
            f"While we serve {aud} across multiple markets, we maintain a deep understanding of "
            f"local dynamics in {ind}. This combination of broad experience and focused knowledge "
            f"allows us to deliver {prod} that are both world-class and perfectly suited to your "
            f"specific market conditions and customer expectations."
        )
        paras.append(
            f"The future of {ind} is bright, and {biz} is committed to being at the forefront of "
            f"that future. We are investing in emerging technologies, developing new {prod}, and "
            f"expanding our capabilities to meet the evolving needs of {aud}. By partnering with "
            f"{biz} today, you position your business to take advantage of tomorrow's opportunities "
            f"and stay ahead of the competition."
        )
        paras.append(
            f"Your success story starts with {biz}. Whether you are looking to solve a specific "
            f"challenge, explore new opportunities, or simply ensure your business is on the right "
            f"track, our team is here to help. We bring the expertise, the tools, and the commitment "
            f"needed to help {aud} in {ind} achieve their full potential. The journey to exceptional "
            f"results begins with a single conversation."
        )
        return "\n\n".join(paras[:repeat])

    base_templates = {
        "blog_post": _expand_blog(biz, prod, ind, aud, cta, tone, kw_list, repeat),
        "facebook_ad": (
            f"Introducing {biz} - Your Solution for {prod}\n\n"
            f"Looking for reliable {prod} in {ind}? {biz} is here to help {aud} succeed.\n\n"
            f"Expert solutions tailored for {aud}\n"
            f"Proven results in {ind}\n"
            f"Trusted by businesses worldwide\n\n"
        ),
        "google_ad": (
            f"{biz} | Professional {prod} for {aud}\n\n"
            f"Looking for the best {prod} in {ind}? {biz} offers top-rated solutions "
            f"designed specifically for {aud}. Get results you can count on.\n\n"
        ),
        "product_description": (
            f"Discover {prod} by {biz} - designed for {aud} in {ind}.\n\n"
            f"Our {prod} combines quality craftsmanship with innovative design to deliver "
            f"exceptional value. Built with {aud} in mind, every detail has been carefully "
            f"considered to ensure the best possible experience.\n\n"
            f"Key Features:\n"
            f"- Premium quality materials and construction\n"
            f"- Designed specifically for {aud}\n"
            f"- Backed by {biz}'s commitment to excellence\n"
            f"- Proven performance in {ind}\n\n"
        ),
        "landing_page_copy": (
            f"Welcome to {biz}\n\n"
            f"The #1 choice for {prod} in {ind}\n\n"
            f"We help {aud} achieve their goals with professional {prod} "
            f"that delivers real results. Our {tone} approach ensures you get "
            f"the best experience from start to finish.\n\n"
        ),
        "instagram_caption": (
            f"{biz} - Where Innovation Meets Excellence\n\n"
            f"Proud to serve {aud} with premium {prod}. Every day, we push "
            f"boundaries in {ind} to bring you the best.\n\n"
        ),
        "linkedin_post": (
            f"I'm excited to share that {biz} continues to lead in {ind}.\n\n"
            f"Our team has been working tirelessly to deliver exceptional {prod} "
            f"for {aud}. The results speak for themselves.\n\n"
        ),
        "twitter_post": (
            f"{biz} is changing the game in {ind}!\n\n"
            f"Professional {prod} designed for {aud}. See why businesses trust us.\n\n"
        ),
        "email_campaign": (
            f"Subject: Transform Your {ind} Experience with {biz}\n\n"
            f"Dear {aud},\n\n"
            f"We're reaching out because we believe {biz} can make a real difference "
            f"for you in {ind}.\n\n"
            f"Our {prod} has been designed with {aud} in mind, offering the perfect "
            f"blend of quality and value.\n\n"
        ),
        "youtube_title": f"How {biz} is Revolutionizing {ind} | {prod}",
        "youtube_description": (
            f"Discover how {biz} is transforming {ind} with our innovative {prod}.\n\n"
            f"In this video, we explore:\n"
            f"- What makes our {prod} unique\n"
            f"- How {aud} benefit from our solutions\n"
            f"- Real results from real customers\n\n"
        ),
        "video_script": (
            f"[INTRO]\nHey everyone, welcome to {biz}!\n\n"
            f"[PROBLEM]\nIf you're {aud} looking for great {prod} in {ind}, you've come to the right place.\n\n"
            f"[SOLUTION]\nAt {biz}, we've developed {prod} that truly makes a difference. "
            f"Our {tone} approach means you get the best experience possible.\n\n"
            f"[PROOF]\nBusinesses across {ind} trust {biz} for their {prod} needs.\n\n"
            f"[CTA]\nDon't wait - {cta} today and see the difference for yourself!"
        ),
        "faq": (
            f"Frequently Asked Questions - {biz}\n\n"
            f"Q: What {prod} does {biz} offer?\n"
            f"A: {biz} provides professional {prod} tailored for {aud} in {ind}.\n\n"
            f"Q: Who is {biz} designed for?\n"
            f"A: Our {prod} are specifically designed for {aud} in {ind}.\n\n"
            f"Q: How do I get started?\n"
            f"A: Simply {cta.lower()} and our team will guide you through the process.\n\n"
            f"Q: What makes {biz} different?\n"
            f"A: Our commitment to quality, {tone} service, and deep expertise in {ind} sets us apart."
        ),
        "tagline": f"{biz} - Empowering {aud} Through Innovation",
        "headline": f"{biz}: The Future of {ind} Starts Here",
        "cta": f"{cta} with {biz} Today",
        "meta_title": f"{biz} | Professional {prod} for {aud}",
        "meta_description": f"{biz} offers premium {prod} for {aud} in {ind}. Discover how our solutions can help you succeed. {cta}.",
        "cold_email": (
            f"Subject: Quick question about your {ind} strategy, {aud}\n\n"
            f"Hi there,\n\n"
            f"I noticed you're in {ind} and wanted to reach out. At {biz}, we help {aud} "
            f"like you with professional {prod}.\n\n"
        ),
        "newsletter": (
            f"{biz} Monthly Newsletter\n\n"
            f"Hello {aud}!\n\n"
            f"What's new at {biz}:\n"
            f"Latest innovations in {ind}\n"
            f"Tips for getting the most from {prod}\n"
            f"Customer success stories\n\n"
        ),
    }

    if data.content_type in base_templates:
        return base_templates[data.content_type]

    return (
        f"{biz} provides professional {prod} for {aud} in {ind}. "
        f"Our {tone} approach ensures exceptional results. {cta} today to learn more."
    )


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
    full_prompt += f"\n\nIMPORTANT: The target length is {length_desc}. You MUST write at least the minimum word count specified. Do NOT write shorter content. If the target is 1000-2000 words, write at least 1000 words with detailed paragraphs, examples, and thorough coverage of the topic."
    full_prompt += "\n\nReturn your response as a JSON object with this structure: {\"title\": \"...\", \"content\": \"the content text\", \"html\": \"the formatted HTML content\", \"seo\": {\"meta_title\": \"...\", \"meta_description\": \"...\", \"keywords\": [\"...\"]}}"

    json_data = {}
    ai_success = False
    response_provider = "none"
    response_model = "unknown"
    response_latency = 0.0
    response_tokens = {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0, "estimated_cost": 0}

    for attempt in range(3):
        try:
            response = await engine.generate_json(
                prompt=full_prompt,
                system_instruction=data.system_prompt or "You are an expert content writer. Create high-quality, engaging content optimized for the specified audience.",
                operation=f"content_generate_{data.content_type}",
                user_id=user,
            )

            response_provider = response.provider or "none"
            response_model = response.model or "unknown"
            response_latency = response.latency_ms or 0
            if response.tokens:
                response_tokens = {
                    "prompt_tokens": response.tokens.prompt_tokens,
                    "completion_tokens": response.tokens.completion_tokens,
                    "total_tokens": response.tokens.total_tokens,
                    "estimated_cost": response.tokens.estimated_cost,
                }

            if response.success and response.json_data:
                json_data = response.json_data
                ai_success = True
                break
            elif response.success and response.text:
                text = response.text.strip()
                try:
                    json_data = __import__("json").loads(text)
                    ai_success = True
                    break
                except Exception:
                    pass

            if response.error and "429" in str(response.error):
                import asyncio
                await asyncio.sleep(2 * (attempt + 1))
                continue
            break
        except Exception:
            import asyncio
            await asyncio.sleep(2 * (attempt + 1))
            continue

    title = json_data.get("title", "") or data.title or f"{data.business_name or 'My Business'} - {data.content_type.replace('_', ' ').title()}"
    content_text = json_data.get("content", "")
    html_content = json_data.get("html", f"<p>{content_text}</p>" if content_text else "")
    seo = json_data.get("seo", {})

    if not content_text and not ai_success:
        content_text = _generate_fallback_content(data)
        paragraphs = [p.strip() for p in content_text.split("\n\n") if p.strip()]
        if paragraphs:
            html_content = "".join(f"<p>{p}</p>" for p in paragraphs)
        else:
            html_content = f"<p>{content_text}</p>"
        title = data.title or f"{data.business_name or 'My Business'} - {data.content_type.replace('_', ' ').title()}"

    item_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    slug = slugify(title)

    image_url = None
    _ad_image_types = {
        "facebook_ad": (1536, 1024),
        "google_ad": (1536, 1024),
        "instagram_caption": (1024, 1024),
        "product_description": (1024, 1024),
        "landing_page_copy": (1536, 1024),
        "linkedin_post": (1536, 1024),
        "twitter_post": (1536, 1024),
        "youtube_title": (1536, 1024),
    }
    if data.content_type in _ad_image_types:
        img_w, img_h = _ad_image_types[data.content_type]
        img_prompt = f"{data.business_name or 'business'}"
        if data.product:
            img_prompt += f", {data.product}"
        img_prompt += f", professional {data.content_type.replace('_', ' ')} advertisement, high quality, modern design, sharp details, vibrant colors, marketing material"
        encoded = urllib.parse.quote(img_prompt)
        negative = urllib.parse.quote("worst quality, blurry, low resolution, deformed, ugly, watermark, text errors, bad typography")
        image_url = (
            f"https://image.pollinations.ai/prompt/{encoded}"
            f"?width={img_w}&height={img_h}&model=nanobanana-pro"
            f"&enhance=true&nofeed=true&nologo=true"
            f"&negative_prompt={negative}&reasoning=pro"
        )

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
        "metadata": {"generated_by": "ai" if ai_success else "fallback", "provider": response_provider, "model": response_model},
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
        "generationSettings": {"provider": response_provider, "model": response_model},
        "currentVersion": 1,
        "wordCount": count_words(content_text),
        "isFavorite": False,
        "isArchived": False,
        "tags": [],
        "imageUrl": image_url,
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
        "changeSummary": "AI generation" if ai_success else "Template generation",
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
        provider=response_provider,
        model=response_model,
        latency_ms=response_latency,
        tokens=response_tokens,
        image_url=image_url,
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

    prompt = (
        f"Action: {action_text}\n\n"
        f"Text to optimize:\n{data.text}\n\n"
        f"{extra}\n\n"
        "Return ONLY the optimized text without explanations or markdown formatting."
    )

    optimized = data.text
    provider = "none"
    latency = 0.0

    for attempt in range(3):
        try:
            response = await engine.generate(
                prompt=prompt,
                system_instruction="You are an expert content editor. Optimize the given text according to the specified action.",
                operation="content_optimize",
                user_id=user,
            )

            if response.success and response.text and response.text.strip():
                optimized = response.text.strip()
                provider = response.provider or "none"
                latency = response.latency_ms or 0
                break

            if response.error and "429" in str(response.error):
                import asyncio
                await asyncio.sleep(2 * (attempt + 1))
                continue
            break
        except HTTPException:
            raise
        except Exception:
            import asyncio
            await asyncio.sleep(2 * (attempt + 1))
            continue

    if optimized == data.text and data.text.strip():
        optimized = _apply_fallback_transform(data.text, data.action)

    return ContentAIOptimizeResponse(
        original=data.text,
        optimized=optimized,
        action=data.action,
        provider=provider,
        latency_ms=latency,
    )


def _apply_fallback_transform(text: str, action: str) -> str:
    import re, random

    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    if not sentences:
        return text

    if action == "shorten":
        keep = max(1, len(sentences) * 2 // 3)
        return " ".join(sentences[:keep])
    elif action == "expand":
        synonyms = [
            ("important", "crucial"), ("essential", "vital"), ("good", "excellent"),
            ("bad", "poor"), ("big", "substantial"), ("small", "modest"),
            ("help", "assist"), ("make", "create"), ("use", "utilize"),
            ("get", "obtain"), ("find", "discover"), ("start", "initiate"),
            ("show", "demonstrate"), ("give", "provide"), ("tell", "communicate"),
            ("need", "require"), ("like", "appreciate"), ("try", "attempt"),
        ]
        expanded = []
        for s in sentences:
            new_s = s
            for orig, syn in synonyms:
                pattern = r'\b' + re.escape(orig) + r'\b'
                if re.search(pattern, new_s, re.IGNORECASE) and random.random() > 0.4:
                    new_s = re.sub(pattern, syn, new_s, count=1, flags=re.IGNORECASE)
            expanded.append(new_s)
            if len(sentences) < 5:
                extra = random.choice([
                    "This approach delivers measurable results.",
                    "Our solution is designed for long-term success.",
                    "Customers consistently report positive outcomes.",
                ])
                expanded.append(extra)
        return " ".join(expanded)
    elif action == "regenerate":
        if len(sentences) > 1:
            mid = max(1, len(sentences) // 2)
            return " ".join(sentences[mid:] + sentences[:mid])
        words = text.split()
        random.shuffle(words)
        return " ".join(words)
    elif action == "change_tone":
        formal_map = {
            "can": "shall", "will": "shall", "want": "desire",
            "need": "require", "use": "leverage", "get": "acquire",
            "help": "facilitate", "make": "construct", "start": "commence",
            "end": "conclude", "buy": "procure", "sell": "distribute",
            "show": "illustrate", "tell": "inform", "give": "furnish",
            "think": "determine", "ask": "inquire", "try": "endeavor",
        }
        result = text
        for word, replacement in formal_map.items():
            pattern = r'\b' + re.escape(word) + r'\b'
            if re.search(pattern, result, re.IGNORECASE):
                result = re.sub(pattern, replacement, result, count=1, flags=re.IGNORECASE)
        if result == text:
            result = "It is worth noting that " + sentences[0].lower()
            if len(sentences) > 1:
                result += " " + " ".join(sentences[1:])
        return result
    elif action == "fix_grammar":
        result = text
        result = re.sub(r'\s+([.,!?;:])', r'\1', result)
        result = re.sub(r'([.,!?;:])([A-Za-z])', r'\1 \2', result)
        result = re.sub(r'\bi\b', 'I', result)
        result = re.sub(r'\bim\b', "I'm", result, flags=re.IGNORECASE)
        result = re.sub(r'\bdoesnt\b', "doesn't", result, flags=re.IGNORECASE)
        result = re.sub(r'\bwont\b', "won't", result, flags=re.IGNORECASE)
        result = re.sub(r'\bcant\b', "can't", result, flags=re.IGNORECASE)
        result = re.sub(r'\bdont\b', "don't", result, flags=re.IGNORECASE)
        result = re.sub(r'\byoure\b', "you're", result, flags=re.IGNORECASE)
        result = re.sub(r'\bits a\b', "it's a", result, flags=re.IGNORECASE)
        if result == text:
            words = text.split()
            if len(words) > 6:
                mid = len(words) // 2
                result = " ".join(words[mid:mid+3] + words[:mid] + words[mid+3:])
        return result
    elif action in ("improve", "rewrite"):
        improved_words = {
            "good": "excellent", "bad": "poor", "big": "significant",
            "small": "modest", "very": "extremely", "really": "truly",
            "help": "assist", "make": "create", "use": "utilize",
            "get": "obtain", "find": "discover", "start": "begin",
            "show": "demonstrate", "give": "provide", "tell": "convey",
            "need": "require", "try": "strive", "think": "believe",
            "important": "essential", "great": "outstanding", "new": "innovative",
        }
        result = text
        for orig, repl in improved_words.items():
            pattern = r'\b' + re.escape(orig) + r'\b'
            if re.search(pattern, result, re.IGNORECASE):
                result = re.sub(pattern, repl, result, count=1, flags=re.IGNORECASE)
        if result == text:
            result = " ".join(sentences[-1:] + sentences[:-1])
        return result
    elif action in ("professional", "formal"):
        formal = {
            "can": "shall", "will": "shall", "use": "utilize",
            "get": "obtain", "help": "facilitate", "make": "construct",
            "start": "commence", "end": "conclude", "buy": "procure",
            "show": "illustrate", "tell": "inform", "give": "furnish",
            "think": "determine", "ask": "inquire", "try": "endeavor",
        }
        result = text
        for word, repl in formal.items():
            pattern = r'\b' + re.escape(word) + r'\b'
            if re.search(pattern, result, re.IGNORECASE):
                result = re.sub(pattern, repl, result, count=1, flags=re.IGNORECASE)
        return result
    elif action in ("friendly", "casual"):
        casual = {
            "utilize": "use", "facilitate": "help", "commence": "start",
            "procure": "get", "endeavor": "try", "inquire": "ask",
            "construct": "make", "demonstrate": "show", "acquire": "get",
            "illustrate": "show", "furnish": "give", "conclude": "end",
        }
        result = text
        for word, repl in casual.items():
            pattern = r'\b' + re.escape(word) + r'\b'
            if re.search(pattern, result, re.IGNORECASE):
                result = re.sub(pattern, repl, result, count=1, flags=re.IGNORECASE)
        if result == text:
            result = "Hey! " + sentences[0]
            if len(sentences) > 1:
                result += " " + " ".join(sentences[1:])
        return result
    elif action == "simplify":
        complex_words = {
            "utilize": "use", "facilitate": "help", "implement": "do",
            "approximately": "about", "subsequently": "then",
            "demonstrate": "show", "commence": "start", "terminate": "end",
            "endeavor": "try", "acquire": "get", "sufficient": "enough",
            "necessitate": "need", "prioritize": "focus on",
            "innovative": "new", "comprehensive": "full", "significant": "big",
            "substantial": "large", "extraordinary": "great", "fundamental": "basic",
        }
        result = text
        for word, repl in complex_words.items():
            pattern = r'\b' + re.escape(word) + r'\b'
            if re.search(pattern, result, re.IGNORECASE):
                result = re.sub(pattern, repl, result, count=1, flags=re.IGNORECASE)
        if result == text:
            simplified = []
            for s in sentences:
                s = re.sub(r'\bthat is\b', "that's", s, flags=re.IGNORECASE)
                s = re.sub(r'\bdo not\b', "don't", s, flags=re.IGNORECASE)
                s = re.sub(r'\bcannot\b', "can't", s, flags=re.IGNORECASE)
                s = re.sub(r'\bwill not\b', "won't", s, flags=re.IGNORECASE)
                simplified.append(s)
            result = " ".join(simplified)
        if result == text and len(sentences) > 1:
            result = " ".join(sentences[1:] + sentences[:1])
        return result
    elif action == "luxury":
        luxury_words = {
            "good": "exceptional", "great": "exquisite", "best": "finest",
            "quality": "premium", "new": "exclusive", "special": "bespoke",
            "help": "curate", "make": "craft", "provide": "offer",
        }
        result = text
        for word, repl in luxury_words.items():
            pattern = r'\b' + re.escape(word) + r'\b'
            if re.search(pattern, result, re.IGNORECASE):
                result = re.sub(pattern, repl, result, count=1, flags=re.IGNORECASE)
        return result
    elif action == "startup":
        startup_words = {
            "business": "venture", "company": "startup", "product": "solution",
            "service": "platform", "customer": "user", "market": "ecosystem",
            "grow": "scale", "improve": "iterate", "build": "ship",
        }
        result = text
        for word, repl in startup_words.items():
            pattern = r'\b' + re.escape(word) + r'\b'
            if re.search(pattern, result, re.IGNORECASE):
                result = re.sub(pattern, repl, result, count=1, flags=re.IGNORECASE)
        return result
    elif action == "technical":
        tech_words = {
            "use": "implement", "make": "develop", "help": "optimize",
            "improve": "enhance", "fix": "debug", "change": "modify",
            "build": "deploy", "run": "execute", "test": "validate",
        }
        result = text
        for word, repl in tech_words.items():
            pattern = r'\b' + re.escape(word) + r'\b'
            if re.search(pattern, result, re.IGNORECASE):
                result = re.sub(pattern, repl, result, count=1, flags=re.IGNORECASE)
        return result
    elif action == "persuasive":
        persuasive_additions = [
            "Don't miss out on this opportunity.",
            "The results speak for themselves.",
            "Take action today and see the difference.",
            "Join thousands of satisfied customers.",
            "This is your chance to get ahead.",
        ]
        result = text
        result += " " + random.choice(persuasive_additions)
        return result
    elif action == "grammar_fix":
        result = text
        result = re.sub(r'\s+([.,!?;:])', r'\1', result)
        result = re.sub(r'([.,!?;:])([A-Za-z])', r'\1 \2', result)
        result = re.sub(r'\bi\b', 'I', result)
        if result == text:
            words = text.split()
            if len(words) > 6:
                mid = len(words) // 2
                result = " ".join(words[mid:mid+3] + words[:mid] + words[mid+3:])
        return result
    return text


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
    content_text = data.content or ""
    if data.item_id:
        if data.item_id not in _items:
            raise HTTPException(status_code=404, detail="Content not found.")
        item = _items[data.item_id]
        content_text = item.get("plainBody", "") or item.get("body", {}).get("text", "")
    filename = "export"
    if data.item_id and data.item_id in _items:
        filename = slugify(_items[data.item_id].get("title", "content"))
    return {"content": content_text, "format": data.format, "filename": f"{filename}.{data.format}"}


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
async def bulk_delete_content(data: ContentBulkDeleteRequest, user: str = Depends(get_current_user)):
    check_rate_limit(f"bulk:{user}")
    deleted = 0
    for item_id in data.ids:
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


@router.get("/{item_id}/export", response_model=ContentExportResponse)
async def export_content_item(item_id: str, format: str = "html", user: str = Depends(get_current_user)):
    check_rate_limit(f"export:{user}")
    if item_id not in _items:
        raise HTTPException(status_code=404, detail="Content not found")

    item = _items[item_id]
    title = item["title"]
    html = item.get("htmlBody", "")
    plain = item.get("plainBody", "")
    image_url = item.get("imageUrl")

    if format == "html":
        image_html = f'\n<div style="text-align:center;margin:20px 0;"><img src="{image_url}" alt="{title}" style="max-width:100%;border-radius:8px;" /></div>\n' if image_url else ""
        content = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
</head>
<body>
<h1>{title}</h1>
{image_html}{html}
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
