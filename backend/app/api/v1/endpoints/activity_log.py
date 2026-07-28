import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query

from app.core.security import get_current_user

router = APIRouter()

_activity_store: dict[str, list[dict]] = {}

_ACTION_ICONS = {
    "organization.created": "Building2",
    "organization.updated": "Building2",
    "organization.deleted": "Building2",
    "member.invited": "UserPlus",
    "member.removed": "UserMinus",
    "member.role_updated": "Shield",
    "project.created": "Folder",
    "project.updated": "Folder",
    "project.deleted": "Folder",
    "project.published": "Globe",
    "content.created": "FileText",
    "content.updated": "FileText",
    "content.deleted": "FileText",
    "website.generated": "Sparkles",
    "website.published": "Globe",
    "email.sent": "Mail",
    "email.campaign_created": "Mail",
    "integration.connected": "Link",
    "integration.disconnected": "Unlink",
    "landing_page.created": "Wand2",
    "landing_page.published": "Globe",
    "brand.created": "Palette",
    "brand.updated": "Palette",
    "image.generated": "Image",
    "social.post_created": "Send",
}

_ACTION_DESCRIPTIONS = {
    "organization.created": "created organization",
    "organization.updated": "updated organization settings",
    "organization.deleted": "deleted organization",
    "member.invited": "invited a new member",
    "member.removed": "removed a member",
    "member.role_updated": "changed member role",
    "project.created": "created a new project",
    "project.updated": "updated project",
    "project.deleted": "deleted project",
    "project.published": "published project",
    "content.created": "created new content",
    "content.updated": "edited content",
    "content.deleted": "deleted content",
    "website.generated": "generated a website with AI",
    "website.published": "published a website",
    "email.sent": "sent an email campaign",
    "email.campaign_created": "created an email campaign",
    "integration.connected": "connected an integration",
    "integration.disconnected": "disconnected an integration",
    "landing_page.created": "created a landing page",
    "landing_page.published": "published a landing page",
    "brand.created": "created a brand profile",
    "brand.updated": "updated brand profile",
    "image.generated": "generated an image",
    "social.post_created": "created a social media post",
}


def log_activity(
    user_id: str,
    organization_id: str,
    action: str,
    entity_type: str,
    entity_id: str,
    entity_name: str = "",
    metadata: dict | None = None,
) -> dict:
    log_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    entry = {
        "id": log_id,
        "userId": user_id,
        "organizationId": organization_id,
        "action": action,
        "entityType": entity_type,
        "entityId": entity_id,
        "entityName": entity_name,
        "description": _ACTION_DESCRIPTIONS.get(action, action),
        "icon": _ACTION_ICONS.get(action, "Activity"),
        "metadata": metadata or {},
        "createdAt": now,
    }
    if organization_id not in _activity_store:
        _activity_store[organization_id] = []
    _activity_store[organization_id].insert(0, entry)
    if len(_activity_store[organization_id]) > 500:
        _activity_store[organization_id] = _activity_store[organization_id][:500]
    return entry


def _generate_demo_activity(org_id: str) -> list[dict]:
    if org_id in _activity_store and len(_activity_store[org_id]) > 5:
        return _activity_store[org_id]

    demo_actions = [
        ("project.created", "project", "Homepage Redesign", "dev-user"),
        ("website.generated", "website", "Landing Page v2", "dev-user"),
        ("content.created", "content", "Blog Post: AI Trends", "dev-user"),
        ("email.campaign_created", "campaign", "Welcome Series", "dev-user"),
        ("integration.connected", "integration", "Slack Notifications", "dev-user"),
        ("member.invited", "member", "sarah@example.com", "dev-user"),
        ("project.published", "project", "Homepage Redesign", "dev-user"),
        ("brand.created", "brand", "BuilderWeb Brand Kit", "dev-user"),
        ("landing_page.created", "landing_page", "Product Launch Page", "dev-user"),
        ("social.post_created", "social_post", "LinkedIn Announcement", "dev-user"),
        ("image.generated", "image", "Hero Banner AI", "dev-user"),
        ("content.updated", "content", "About Us Page", "dev-user"),
        ("organization.created", "organization", "BuilderWeb Team", "dev-user"),
        ("member.role_updated", "member", "john@example.com", "dev-user"),
        ("website.published", "website", "Homepage Redesign", "dev-user"),
    ]

    from datetime import timedelta
    now = datetime.now(timezone.utc)

    for i, (action, entity_type, entity_name, user_id) in enumerate(demo_actions):
        entry = {
            "id": str(uuid.uuid4()),
            "userId": user_id,
            "organizationId": org_id,
            "action": action,
            "entityType": entity_type,
            "entityId": str(uuid.uuid4()),
            "entityName": entity_name,
            "description": _ACTION_DESCRIPTIONS.get(action, action),
            "icon": _ACTION_ICONS.get(action, "Activity"),
            "metadata": {},
            "createdAt": (now - timedelta(hours=i * 3, minutes=i * 17)).isoformat(),
        }
        if org_id not in _activity_store:
            _activity_store[org_id] = []
        _activity_store[org_id].append(entry)

    return _activity_store[org_id]


@router.get("/")
async def list_activity_logs(
    organization_id: str = Query(default="org-default"),
    action: str | None = Query(default=None),
    entity_type: str | None = Query(default=None),
    user_id: str | None = Query(default=None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user: str = Depends(get_current_user),
):
    logs = _generate_demo_activity(organization_id)

    if action:
        logs = [l for l in logs if l["action"] == action]
    if entity_type:
        logs = [l for l in logs if l["entityType"] == entity_type]
    if user_id:
        logs = [l for l in logs if l["userId"] == user_id]

    total = len(logs)
    start = (page - 1) * page_size
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return {
        "items": logs[start:start + page_size],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@router.get("/actions")
async def list_activity_actions(
    organization_id: str = Query(default="org-default"),
    user: str = Depends(get_current_user),
):
    logs = _generate_demo_activity(organization_id)
    actions = {}
    for l in logs:
        act = l["action"]
        if act not in actions:
            actions[act] = {"action": act, "description": _ACTION_DESCRIPTIONS.get(act, act), "count": 0}
        actions[act]["count"] += 1
    return list(actions.values())


@router.get("/stats")
async def activity_stats(
    organization_id: str = Query(default="org-default"),
    user: str = Depends(get_current_user),
):
    logs = _generate_demo_activity(organization_id)
    total = len(logs)
    today = datetime.now(timezone.utc).date().isoformat()
    today_count = sum(1 for l in logs if l["createdAt"].startswith(today))

    entities = {}
    for l in logs:
        et = l["entityType"]
        entities[et] = entities.get(et, 0) + 1

    return {
        "total_actions": total,
        "today_actions": today_count,
        "by_entity": entities,
        "unique_users": len({l["userId"] for l in logs}),
    }
