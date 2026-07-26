import time
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.security import get_current_user
from app.schemas.email import (
    EmailAIRequest,
    EmailAIResponse,
    EmailCampaignCreateRequest,
    EmailCampaignPaginatedResponse,
    EmailCampaignResponse,
    EmailCampaignUpdateRequest,
    EmailGenerateRequest,
    EmailGenerateResponse,
    EmailStatsResponse,
    EmailTemplateCreateRequest,
    EmailTemplateResponse,
    EmailTemplateUpdateRequest,
)

router = APIRouter()

_campaigns: dict[str, dict] = {}
_templates: dict[str, dict] = {}
_history: dict[str, list] = {}
_rate_limits: dict[str, list[float]] = {}

RATE_LIMIT_WINDOW = 60.0
RATE_LIMIT_MAX_REQUESTS = 60
AI_RATE_LIMIT_MAX = 10

_VALID_EMAIL_TYPES = {
    "promotional",
    "transactional",
    "newsletter",
    "welcome",
    "product-launch",
    "cold-outreach",
    "follow-up",
    "announcement",
    "nurture",
    "re-engagement",
    "abandoned-cart",
    "thank-you",
    "event-invitation",
    "discount",
}

_VALID_CATEGORIES = {
    "business",
    "ecommerce",
    "saas",
    "startup",
    "agency",
    "education",
}


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


def _to_campaign_response(campaign: dict) -> EmailCampaignResponse:
    return EmailCampaignResponse(
        id=campaign["id"],
        workspace_id=campaign["workspaceId"],
        name=campaign["name"],
        subject=campaign["subject"],
        preview_text=campaign.get("previewText"),
        email_type=campaign["emailType"],
        html_content=campaign.get("htmlContent"),
        markdown_content=campaign.get("markdownContent"),
        plain_text=campaign.get("plainText"),
        json_content=campaign.get("jsonContent"),
        brand=campaign.get("brand"),
        audience=campaign.get("audience"),
        goal=campaign.get("goal"),
        tone=campaign.get("tone"),
        language=campaign.get("language", "English"),
        cta=campaign.get("cta"),
        product=campaign.get("product"),
        keywords=campaign.get("keywords"),
        template_id=campaign.get("templateId"),
        status=campaign["status"],
        sent_at=campaign.get("sentAt"),
        open_rate=campaign.get("openRate"),
        click_rate=campaign.get("clickRate"),
        unsubscribe_rate=campaign.get("unsubscribeRate"),
        recipient_count=campaign.get("recipientCount", 0),
        ai_generated=campaign.get("aiGenerated", False),
        ai_provider=campaign.get("aiProvider"),
        ai_latency_ms=campaign.get("aiLatencyMs"),
        created_at=campaign["createdAt"],
        updated_at=campaign["updatedAt"],
    )


def _to_template_response(template: dict) -> EmailTemplateResponse:
    return EmailTemplateResponse(
        id=template["id"],
        workspace_id=template["workspaceId"],
        name=template["name"],
        description=template.get("description"),
        category=template["category"],
        email_type=template["emailType"],
        subject=template["subject"],
        preview_text=template.get("previewText"),
        html_content=template["htmlContent"],
        markdown_content=template.get("markdownContent"),
        json_content=template.get("jsonContent"),
        variables=template.get("variables"),
        thumbnail_url=template.get("thumbnailUrl"),
        is_system=template.get("isSystem", False),
        usage_count=template.get("usageCount", 0),
        created_at=template["createdAt"],
        updated_at=template["updatedAt"],
    )


def _seed_system_templates() -> None:
    now = datetime.now(timezone.utc).isoformat()

    system_templates = [
        {
            "id": "system-biz-newsletter",
            "workspaceId": "__system__",
            "name": "Professional Business Newsletter",
            "description": "A clean, professional newsletter template for business communications with stakeholders, partners, and customers.",
            "category": "business",
            "emailType": "newsletter",
            "subject": "{{brand_name}} Monthly Update - {{month_year}}",
            "previewText": "Stay informed with the latest from {{brand_name}}",
            "htmlContent": (
                '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>'
                '<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">'
                '<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:20px 0;">'
                '<tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;">'
                '<tr><td style="background-color:#1a365d;padding:30px 40px;text-align:center;">'
                '<h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:600;">{{brand_name}}</h1></td></tr>'
                '<tr><td style="padding:40px;"><h2 style="color:#1a365d;margin:0 0 16px;font-size:20px;">Monthly Newsletter</h2>'
                '<p style="color:#4a5568;line-height:1.6;font-size:16px;margin:0 0 20px;">Dear {{recipient_name}},</p>'
                '<p style="color:#4a5568;line-height:1.6;font-size:16px;margin:0 0 20px;">{{body_content}}</p>'
                '<p style="color:#4a5568;line-height:1.6;font-size:16px;margin:0 0 30px;">Best regards,<br>The {{brand_name}} Team</p>'
                '<table cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr>'
                '<td style="background-color:#2b6cb0;border-radius:6px;"><a href="{{cta_url}}" style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;">{{cta_text}}</a></td>'
                '</tr></table></td></tr>'
                '<tr><td style="background-color:#edf2f7;padding:20px 40px;text-align:center;">'
                '<p style="color:#718096;font-size:12px;margin:0;">&copy; {{year}} {{brand_name}}. All rights reserved.</p></td></tr>'
                '</table></td></tr></table></body></html>'
            ),
            "markdownContent": "# {{brand_name}} Monthly Newsletter\n\nDear {{recipient_name}},\n\n{{body_content}}\n\nBest regards,\nThe {{brand_name}} Team\n\n[{{cta_text}}]({{cta_url}})",
            "variables": ["brand_name", "month_year", "recipient_name", "body_content", "cta_text", "cta_url", "year"],
            "thumbnailUrl": None,
            "isSystem": True,
            "usageCount": 0,
            "createdAt": now,
            "updatedAt": now,
        },
        {
            "id": "system-ecom-promo",
            "workspaceId": "__system__",
            "name": "Product Promotion Email",
            "description": "High-converting promotional template for ecommerce product launches, sales, and special offers.",
            "category": "ecommerce",
            "emailType": "promotional",
            "subject": "Don't Miss Out! {{product_name}} - {{discount}}% Off",
            "previewText": "Limited time offer on {{product_name}}",
            "htmlContent": (
                '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>'
                '<body style="margin:0;padding:0;background-color:#fff5f5;font-family:Arial,Helvetica,sans-serif;">'
                '<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fff5f5;padding:20px 0;">'
                '<tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;">'
                '<tr><td style="background-color:#e53e3e;padding:20px;text-align:center;">'
                '<p style="color:#ffffff;margin:0;font-size:14px;font-weight:600;letter-spacing:1px;">LIMITED TIME OFFER</p></td></tr>'
                '<tr><td style="padding:40px;text-align:center;">'
                '<h1 style="color:#1a202c;margin:0 0 10px;font-size:28px;">{{product_name}}</h1>'
                '<p style="color:#e53e3e;margin:0 0 20px;font-size:32px;font-weight:700;">{{discount}}% OFF</p>'
                '<p style="color:#4a5568;line-height:1.6;font-size:16px;margin:0 0 30px;">{{description}}</p>'
                '<table cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr>'
                '<td style="background-color:#e53e3e;border-radius:6px;"><a href="{{cta_url}}" style="display:inline-block;padding:16px 40px;color:#ffffff;text-decoration:none;font-weight:700;font-size:18px;">SHOP NOW</a></td>'
                '</tr></table>'
                '<p style="color:#718096;font-size:13px;margin:20px 0 0;">Use code <strong>{{promo_code}}</strong> at checkout</p></td></tr>'
                '<tr><td style="background-color:#fed7d7;padding:15px 40px;text-align:center;">'
                '<p style="color:#9b2c2c;font-size:13px;margin:0;font-weight:600;">Offer expires {{expiry_date}}</p></td></tr>'
                '</table></td></tr></table></body></html>'
            ),
            "markdownContent": "# {{product_name}}\n\n**{{discount}}% OFF** - Limited Time!\n\n{{description}}\n\n[SHOP NOW]({{cta_url}})\n\nUse code `{{promo_code}}` at checkout.\n\n*Offer expires {{expiry_date}}*",
            "variables": ["product_name", "discount", "description", "cta_url", "promo_code", "expiry_date"],
            "thumbnailUrl": None,
            "isSystem": True,
            "usageCount": 0,
            "createdAt": now,
            "updatedAt": now,
        },
        {
            "id": "system-saas-welcome",
            "workspaceId": "__system__",
            "name": "Welcome & Onboarding Email",
            "description": "Friendly onboarding email for SaaS products to welcome new users and guide first steps.",
            "category": "saas",
            "emailType": "welcome",
            "subject": "Welcome to {{brand_name}}, {{user_name}}!",
            "previewText": "Let's get you started with {{brand_name}}",
            "htmlContent": (
                '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>'
                '<body style="margin:0;padding:0;background-color:#ebf8ff;font-family:Arial,Helvetica,sans-serif;">'
                '<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ebf8ff;padding:20px 0;">'
                '<tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;">'
                '<tr><td style="background-color:#2b6cb0;padding:30px 40px;text-align:center;">'
                '<h1 style="color:#ffffff;margin:0;font-size:24px;">Welcome to {{brand_name}}!</h1></td></tr>'
                '<tr><td style="padding:40px;">'
                '<p style="color:#2d3748;line-height:1.6;font-size:16px;margin:0 0 20px;">Hi {{user_name}},</p>'
                '<p style="color:#4a5568;line-height:1.6;font-size:16px;margin:0 0 20px;">We\'re thrilled to have you on board! {{brand_name}} will help you {{value_prop}}.</p>'
                '<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">'
                '<tr><td style="padding:16px;background-color:#ebf8ff;border-radius:8px;border-left:4px solid #2b6cb0;">'
                '<p style="color:#2b6cb0;margin:0 0 4px;font-weight:700;font-size:14px;">Step 1: Set Up Your Profile</p>'
                '<p style="color:#4a5568;margin:0;font-size:14px;">Complete your profile to personalize your experience.</p></td></tr>'
                '<tr><td style="height:10px;"></td></tr>'
                '<tr><td style="padding:16px;background-color:#ebf8ff;border-radius:8px;border-left:4px solid #2b6cb0;">'
                '<p style="color:#2b6cb0;margin:0 0 4px;font-weight:700;font-size:14px;">Step 2: Connect Your Tools</p>'
                '<p style="color:#4a5568;margin:0;font-size:14px;">Integrate with your existing workflow tools.</p></td></tr>'
                '<tr><td style="height:10px;"></td></tr>'
                '<tr><td style="padding:16px;background-color:#ebf8ff;border-radius:8px;border-left:4px solid #2b6cb0;">'
                '<p style="color:#2b6cb0;margin:0 0 4px;font-weight:700;font-size:14px;">Step 3: Launch Your First Project</p>'
                '<p style="color:#4a5568;margin:0;font-size:14px;">Create and launch your first project in minutes.</p></td></tr></table>'
                '<table cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr>'
                '<td style="background-color:#2b6cb0;border-radius:6px;"><a href="{{cta_url}}" style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;">Get Started</a></td>'
                '</tr></table></td></tr>'
                '<tr><td style="background-color:#bee3f8;padding:20px 40px;text-align:center;">'
                '<p style="color:#2c5282;font-size:13px;margin:0;">Need help? Reply to this email or visit our <a href="{{help_url}}" style="color:#2b6cb0;">Help Center</a></p></td></tr>'
                '</table></td></tr></table></body></html>'
            ),
            "markdownContent": "# Welcome to {{brand_name}}!\n\nHi {{user_name}},\n\nWe're thrilled to have you on board! {{brand_name}} will help you {{value_prop}}.\n\n## Getting Started\n\n1. **Set Up Your Profile** - Complete your profile to personalize your experience.\n2. **Connect Your Tools** - Integrate with your existing workflow tools.\n3. **Launch Your First Project** - Create and launch your first project in minutes.\n\n[Get Started]({{cta_url}})\n\n---\n\nNeed help? Reply to this email or visit our [Help Center]({{help_url}})",
            "variables": ["brand_name", "user_name", "value_prop", "cta_url", "help_url"],
            "thumbnailUrl": None,
            "isSystem": True,
            "usageCount": 0,
            "createdAt": now,
            "updatedAt": now,
        },
        {
            "id": "system-startup-launch",
            "workspaceId": "__system__",
            "name": "Product Launch Announcement",
            "description": "Bold, energetic template for startup product launches and major feature announcements.",
            "category": "startup",
            "emailType": "product-launch",
            "subject": "Introducing {{product_name}} - {{tagline}}",
            "previewText": "The wait is over. {{product_name}} is here.",
            "htmlContent": (
                '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>'
                '<body style="margin:0;padding:0;background-color:#faf5ff;font-family:Arial,Helvetica,sans-serif;">'
                '<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#faf5ff;padding:20px 0;">'
                '<tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;">'
                '<tr><td style="background:linear-gradient(135deg,#6b46c1,#9f7aea);padding:50px 40px;text-align:center;">'
                '<p style="color:#e9d8fd;margin:0 0 8px;font-size:14px;letter-spacing:2px;text-transform:uppercase;">Now Available</p>'
                '<h1 style="color:#ffffff;margin:0 0 10px;font-size:32px;">{{product_name}}</h1>'
                '<p style="color:#e9d8fd;margin:0;font-size:18px;font-style:italic;">{{tagline}}</p></td></tr>'
                '<tr><td style="padding:40px;">'
                '<p style="color:#2d3748;line-height:1.6;font-size:16px;margin:0 0 20px;">Hi {{recipient_name}},</p>'
                '<p style="color:#4a5568;line-height:1.6;font-size:16px;margin:0 0 20px;">{{description}}</p>'
                '<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">'
                '<tr><td style="padding:12px 0;border-bottom:1px solid #e2e8f0;">'
                '<table cellpadding="0" cellspacing="0"><tr>'
                '<td style="width:40px;color:#6b46c1;font-size:20px;">&#10003;</td>'
                '<td style="color:#4a5568;font-size:15px;">{{feature_1}}</td></tr></table></td></tr>'
                '<tr><td style="padding:12px 0;border-bottom:1px solid #e2e8f0;">'
                '<table cellpadding="0" cellspacing="0"><tr>'
                '<td style="width:40px;color:#6b46c1;font-size:20px;">&#10003;</td>'
                '<td style="color:#4a5568;font-size:15px;">{{feature_2}}</td></tr></table></td></tr>'
                '<tr><td style="padding:12px 0;">'
                '<table cellpadding="0" cellspacing="0"><tr>'
                '<td style="width:40px;color:#6b46c1;font-size:20px;">&#10003;</td>'
                '<td style="color:#4a5568;font-size:15px;">{{feature_3}}</td></tr></table></td></tr></table>'
                '<table cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr>'
                '<td style="background-color:#6b46c1;border-radius:6px;"><a href="{{cta_url}}" style="display:inline-block;padding:16px 40px;color:#ffffff;text-decoration:none;font-weight:700;font-size:18px;">Try It Now</a></td>'
                '</tr></table></td></tr>'
                '<tr><td style="background-color:#f5f3ff;padding:20px 40px;text-align:center;">'
                '<p style="color:#6b46c1;font-size:13px;margin:0;">Share the news: <a href="{{share_url}}" style="color:#6b46c1;">Twitter</a> | <a href="{{linkedin_url}}" style="color:#6b46c1;">LinkedIn</a></p></td></tr>'
                '</table></td></tr></table></body></html>'
            ),
            "markdownContent": "# Introducing {{product_name}}\n\n*{{tagline}}*\n\nHi {{recipient_name}},\n\n{{description}}\n\n## Key Features\n\n- {{feature_1}}\n- {{feature_2}}\n- {{feature_3}}\n\n[Try It Now]({{cta_url}})\n\n---\n\nShare the news: [Twitter]({{share_url}}) | [LinkedIn]({{linkedin_url}})",
            "variables": ["product_name", "tagline", "recipient_name", "description", "feature_1", "feature_2", "feature_3", "cta_url", "share_url", "linkedin_url"],
            "thumbnailUrl": None,
            "isSystem": True,
            "usageCount": 0,
            "createdAt": now,
            "updatedAt": now,
        },
        {
            "id": "system-agency-proposal",
            "workspaceId": "__system__",
            "name": "Client Proposal Email",
            "description": "Sleek, professional cold-outreach template for agencies pitching services to potential clients.",
            "category": "agency",
            "emailType": "cold-outreach",
            "subject": "{{agency_name}} + {{prospect_company}} - Let's Grow Together",
            "previewText": "A quick idea to help {{prospect_company}} achieve {{goal}}",
            "htmlContent": (
                '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>'
                '<body style="margin:0;padding:0;background-color:#f7fafc;font-family:Arial,Helvetica,sans-serif;">'
                '<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7fafc;padding:20px 0;">'
                '<tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;">'
                '<tr><td style="padding:30px 40px;border-bottom:1px solid #e2e8f0;">'
                '<table width="100%" cellpadding="0" cellspacing="0"><tr>'
                '<td><h2 style="color:#1a202c;margin:0;font-size:18px;">{{agency_name}}</h2></td>'
                '<td align="right"><p style="color:#718096;margin:0;font-size:12px;">{{date}}</p></td>'
                '</tr></table></td></tr>'
                '<tr><td style="padding:40px;">'
                '<p style="color:#2d3748;line-height:1.6;font-size:16px;margin:0 0 16px;">Hi {{prospect_name}},</p>'
                '<p style="color:#4a5568;line-height:1.6;font-size:16px;margin:0 0 20px;">I noticed that {{prospect_company}} is {{observation}}. We recently helped {{case_study_company}} achieve {{result}} in just {{timeframe}}.</p>'
                '<p style="color:#4a5568;line-height:1.6;font-size:16px;margin:0 0 20px;">I put together a quick idea for how we could help {{prospect_company}} {{goal}}:</p>'
                '<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;background-color:#f7fafc;border-radius:8px;padding:20px;">'
                '<tr><td style="padding:20px;">'
                '<p style="color:#2d3748;margin:0 0 8px;font-weight:700;font-size:14px;">Proposal Highlights</p>'
                '<p style="color:#4a5568;margin:0 0 6px;font-size:14px;">&#8226; {{highlight_1}}</p>'
                '<p style="color:#4a5568;margin:0 0 6px;font-size:14px;">&#8226; {{highlight_2}}</p>'
                '<p style="color:#4a5568;margin:0;font-size:14px;">&#8226; {{highlight_3}}</p></td></tr></table>'
                '<p style="color:#4a5568;line-height:1.6;font-size:16px;margin:0 0 30px;">Would you be open to a quick 15-minute call this week to discuss?</p>'
                '<table cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr>'
                '<td style="background-color:#2d3748;border-radius:6px;"><a href="{{cta_url}}" style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;">Book a Call</a></td>'
                '</tr></table></td></tr>'
                '<tr><td style="padding:20px 40px;border-top:1px solid #e2e8f0;">'
                '<p style="color:#718096;font-size:13px;margin:0 0 4px;">{{sender_name}} | {{sender_title}}, {{agency_name}}</p>'
                '<p style="color:#718096;font-size:13px;margin:0 0 4px;">{{sender_email}} | {{sender_phone}}</p></td></tr>'
                '</table></td></tr></table></body></html>'
            ),
            "markdownContent": "# {{agency_name}} + {{prospect_company}}\n\nHi {{prospect_name}},\n\nI noticed that {{prospect_company}} is {{observation}}. We recently helped {{case_study_company}} achieve {{result}} in just {{timeframe}}.\n\nI put together a quick idea for how we could help {{prospect_company}} {{goal}}:\n\n### Proposal Highlights\n- {{highlight_1}}\n- {{highlight_2}}\n- {{highlight_3}}\n\nWould you be open to a quick 15-minute call this week to discuss?\n\n[Book a Call]({{cta_url}})\n\n---\n\n{{sender_name}} | {{sender_title}}, {{agency_name}}\n{{sender_email}} | {{sender_phone}}",
            "variables": ["agency_name", "date", "prospect_name", "prospect_company", "observation", "case_study_company", "result", "timeframe", "goal", "highlight_1", "highlight_2", "highlight_3", "cta_url", "sender_name", "sender_title", "sender_email", "sender_phone"],
            "thumbnailUrl": None,
            "isSystem": True,
            "usageCount": 0,
            "createdAt": now,
            "updatedAt": now,
        },
        {
            "id": "system-edu-announcement",
            "workspaceId": "__system__",
            "name": "Course Announcement",
            "description": "Engaging announcement template for educational institutions launching new courses or programs.",
            "category": "education",
            "emailType": "announcement",
            "subject": "New Course: {{course_name}} - Enroll Now!",
            "previewText": "Expand your skills with {{course_name}} starting {{start_date}}",
            "htmlContent": (
                '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>'
                '<body style="margin:0;padding:0;background-color:#f0fff4;font-family:Arial,Helvetica,sans-serif;">'
                '<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0fff4;padding:20px 0;">'
                '<tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;">'
                '<tr><td style="background-color:#276749;padding:30px 40px;text-align:center;">'
                '<p style="color:#c6f6d5;margin:0 0 6px;font-size:13px;letter-spacing:1px;text-transform:uppercase;">New Course Announcement</p>'
                '<h1 style="color:#ffffff;margin:0;font-size:26px;">{{course_name}}</h1></td></tr>'
                '<tr><td style="padding:40px;">'
                '<p style="color:#2d3748;line-height:1.6;font-size:16px;margin:0 0 16px;">Dear {{recipient_name}},</p>'
                '<p style="color:#4a5568;line-height:1.6;font-size:16px;margin:0 0 20px;">We\'re excited to announce a brand new course: <strong>{{course_name}}</strong>!</p>'
                '<p style="color:#4a5568;line-height:1.6;font-size:16px;margin:0 0 20px;">{{description}}</p>'
                '<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;background-color:#f0fff4;border-radius:8px;">'
                '<tr><td style="padding:20px;">'
                '<table width="100%" cellpadding="0" cellspacing="0"><tr>'
                '<td width="50%" style="padding:8px;">'
                '<p style="color:#276749;margin:0;font-size:12px;text-transform:uppercase;font-weight:600;">Start Date</p>'
                '<p style="color:#2d3748;margin:4px 0 0;font-size:15px;font-weight:600;">{{start_date}}</p></td>'
                '<td width="50%" style="padding:8px;">'
                '<p style="color:#276749;margin:0;font-size:12px;text-transform:uppercase;font-weight:600;">Duration</p>'
                '<p style="color:#2d3748;margin:4px 0 0;font-size:15px;font-weight:600;">{{duration}}</p></td></tr>'
                '<tr><td width="50%" style="padding:8px;">'
                '<p style="color:#276749;margin:0;font-size:12px;text-transform:uppercase;font-weight:600;">Format</p>'
                '<p style="color:#2d3748;margin:4px 0 0;font-size:15px;font-weight:600;">{{format}}</p></td>'
                '<td width="50%" style="padding:8px;">'
                '<p style="color:#276749;margin:0;font-size:12px;text-transform:uppercase;font-weight:600;">Price</p>'
                '<p style="color:#2d3748;margin:4px 0 0;font-size:15px;font-weight:600;">{{price}}</p></td></tr></table></td></tr></table>'
                '<p style="color:#4a5568;line-height:1.6;font-size:16px;margin:0 0 6px;"><strong>What you\'ll learn:</strong></p>'
                '<p style="color:#4a5568;font-size:15px;margin:0 0 4px;">&#10003; {{learning_1}}</p>'
                '<p style="color:#4a5568;font-size:15px;margin:0 0 4px;">&#10003; {{learning_2}}</p>'
                '<p style="color:#4a5568;font-size:15px;margin:0 0 20px;">&#10003; {{learning_3}}</p>'
                '<table cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr>'
                '<td style="background-color:#276749;border-radius:6px;"><a href="{{cta_url}}" style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;">Enroll Now</a></td>'
                '</tr></table>'
                '<p style="color:#718096;font-size:13px;margin:20px 0 0;text-align:center;">Early bird discount ends {{early_bird_date}}</p></td></tr>'
                '<tr><td style="background-color:#c6f6d5;padding:20px 40px;text-align:center;">'
                '<p style="color:#276749;font-size:12px;margin:0;">Questions? Contact us at <a href="mailto:{{contact_email}}" style="color:#276749;">{{contact_email}}</a></p></td></tr>'
                '</table></td></tr></table></body></html>'
            ),
            "markdownContent": "# {{course_name}}\n\nDear {{recipient_name}},\n\nWe're excited to announce a brand new course: **{{course_name}}**!\n\n{{description}}\n\n### Course Details\n| | |\n|---|---|\n| **Start Date** | {{start_date}} |\n| **Duration** | {{duration}} |\n| **Format** | {{format}} |\n| **Price** | {{price}} |\n\n### What You'll Learn\n- {{learning_1}}\n- {{learning_2}}\n- {{learning_3}}\n\n[Enroll Now]({{cta_url}})\n\n*Early bird discount ends {{early_bird_date}}*\n\n---\n\nQuestions? Contact us at [{{contact_email}}](mailto:{{contact_email}})",
            "variables": ["course_name", "recipient_name", "description", "start_date", "duration", "format", "price", "learning_1", "learning_2", "learning_3", "cta_url", "early_bird_date", "contact_email"],
            "thumbnailUrl": None,
            "isSystem": True,
            "usageCount": 0,
            "createdAt": now,
            "updatedAt": now,
        },
    ]

    for template in system_templates:
        if template["id"] not in _templates:
            _templates[template["id"]] = template


_seed_system_templates()


# ─── CAMPAIGNS STATS ────────────────────────────────────────────────────────


@router.get("/campaigns/stats", response_model=EmailStatsResponse)
async def get_campaign_stats(workspace_id: str = Query(default="dev-workspace"), user: str = Depends(get_current_user)):
    check_rate_limit(f"stats:{user}")
    campaigns = [c for c in _campaigns.values() if c["workspaceId"] == workspace_id]

    by_type: dict[str, int] = {}
    by_status: dict[str, int] = {}
    ai_count = 0
    total_recipients = 0
    open_rates: list[float] = []
    click_rates: list[float] = []

    for c in campaigns:
        et = c["emailType"]
        by_type[et] = by_type.get(et, 0) + 1

        st = c["status"]
        by_status[st] = by_status.get(st, 0) + 1

        if c.get("aiGenerated"):
            ai_count += 1

        total_recipients += c.get("recipientCount", 0)

        if c.get("openRate") is not None:
            open_rates.append(c["openRate"])
        if c.get("clickRate") is not None:
            click_rates.append(c["clickRate"])

    avg_open = round(sum(open_rates) / len(open_rates), 4) if open_rates else 0.0
    avg_click = round(sum(click_rates) / len(click_rates), 4) if click_rates else 0.0

    templates = [t for t in _templates.values() if t["workspaceId"] == workspace_id or t["workspaceId"] == "__system__"]

    return EmailStatsResponse(
        total_campaigns=len(campaigns),
        by_type=by_type,
        by_status=by_status,
        ai_generated_count=ai_count,
        total_templates=len(templates),
        avg_open_rate=avg_open,
        avg_click_rate=avg_click,
        total_recipients=total_recipients,
    )


# ─── CAMPAIGNS LIST / CREATE ─────────────────────────────────────────────────


@router.get("/campaigns", response_model=EmailCampaignPaginatedResponse)
async def list_campaigns(
    workspace_id: str = Query(default="dev-workspace"),
    search: str | None = None,
    email_type: str | None = None,
    status: str | None = None,
    is_deleted: bool = False,
    sort_by: str = "updated_at",
    sort_order: str = "desc",
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user: str = Depends(get_current_user),
):
    check_rate_limit(f"list:{user}")
    campaigns = [c for c in _campaigns.values() if c["workspaceId"] == workspace_id]

    if is_deleted:
        campaigns = [c for c in campaigns if c.get("deletedAt")]
    else:
        campaigns = [c for c in campaigns if not c.get("deletedAt")]

    if email_type:
        campaigns = [c for c in campaigns if c["emailType"].lower() == email_type.lower()]
    if status:
        campaigns = [c for c in campaigns if c["status"].lower() == status.lower()]
    if search:
        search_lower = search.lower()
        campaigns = [
            c for c in campaigns
            if search_lower in c["name"].lower()
            or search_lower in c["subject"].lower()
            or search_lower in (c.get("brand") or "").lower()
            or search_lower in " ".join(c.get("keywords") or []).lower()
        ]

    reverse = sort_order == "desc"
    sort_key_map = {
        "updated_at": lambda x: x["updatedAt"],
        "created_at": lambda x: x["createdAt"],
        "name": lambda x: x["name"].lower(),
        "subject": lambda x: x["subject"].lower(),
        "email_type": lambda x: x["emailType"].lower(),
        "status": lambda x: x["status"].lower(),
        "recipient_count": lambda x: x.get("recipientCount", 0),
    }
    key_fn = sort_key_map.get(sort_by, sort_key_map["updated_at"])
    campaigns.sort(key=key_fn, reverse=reverse)

    start = (page - 1) * page_size
    end = start + page_size
    total = len(campaigns)
    total_pages = (total + page_size - 1) // page_size
    return {
        "items": [_to_campaign_response(c).model_dump() for c in campaigns[start:end]],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@router.post("/campaigns", response_model=EmailCampaignResponse)
async def create_campaign(data: EmailCampaignCreateRequest, user: str = Depends(get_current_user)):
    check_rate_limit(f"create:{user}")

    email_type = data.email_type.lower()
    if email_type not in _VALID_EMAIL_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid email_type '{data.email_type}'. Must be one of: {', '.join(sorted(_VALID_EMAIL_TYPES))}",
        )

    campaign_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    campaign = {
        "id": campaign_id,
        "workspaceId": data.workspace_id,
        "name": data.name,
        "subject": data.subject,
        "previewText": data.preview_text,
        "emailType": email_type,
        "htmlContent": data.html_content,
        "markdownContent": data.markdown_content,
        "plainText": None,
        "jsonContent": data.json_content,
        "brand": data.brand,
        "audience": data.audience,
        "goal": data.goal,
        "tone": data.tone,
        "language": data.language or "English",
        "cta": data.cta,
        "product": data.product,
        "keywords": data.keywords or [],
        "templateId": data.template_id,
        "status": "draft",
        "sentAt": None,
        "openRate": None,
        "clickRate": None,
        "unsubscribeRate": None,
        "recipientCount": 0,
        "aiGenerated": False,
        "aiProvider": None,
        "aiLatencyMs": None,
        "deletedAt": None,
        "createdAt": now,
        "updatedAt": now,
    }
    _campaigns[campaign_id] = campaign

    if data.template_id and data.template_id in _templates:
        _templates[data.template_id]["usageCount"] = _templates[data.template_id].get("usageCount", 0) + 1
        _templates[data.template_id]["updatedAt"] = now

    return _to_campaign_response(campaign)


# ─── CAMPAIGNS GET / UPDATE / DELETE ─────────────────────────────────────────


@router.get("/campaigns/{campaign_id}", response_model=EmailCampaignResponse)
async def get_campaign(campaign_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"read:{user}")
    if campaign_id not in _campaigns:
        raise HTTPException(status_code=404, detail="Campaign not found")
    campaign = _campaigns[campaign_id]
    if campaign.get("deletedAt"):
        raise HTTPException(status_code=404, detail="Campaign not found")
    return _to_campaign_response(campaign)


@router.put("/campaigns/{campaign_id}", response_model=EmailCampaignResponse)
async def update_campaign(
    campaign_id: str,
    data: EmailCampaignUpdateRequest,
    user: str = Depends(get_current_user),
):
    check_rate_limit(f"update:{user}")
    if campaign_id not in _campaigns:
        raise HTTPException(status_code=404, detail="Campaign not found")
    campaign = _campaigns[campaign_id]
    if campaign.get("deletedAt"):
        raise HTTPException(status_code=404, detail="Campaign not found")

    now = datetime.now(timezone.utc).isoformat()

    if data.name is not None:
        campaign["name"] = data.name
    if data.subject is not None:
        campaign["subject"] = data.subject
    if data.preview_text is not None:
        campaign["previewText"] = data.preview_text
    if data.html_content is not None:
        campaign["htmlContent"] = data.html_content
    if data.markdown_content is not None:
        campaign["markdownContent"] = data.markdown_content
    if data.json_content is not None:
        campaign["jsonContent"] = data.json_content
    if data.status is not None:
        valid_statuses = {"draft", "scheduled", "sent", "archived"}
        if data.status.lower() not in valid_statuses:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status '{data.status}'. Must be one of: {', '.join(sorted(valid_statuses))}",
            )
        campaign["status"] = data.status.lower()

    campaign["updatedAt"] = now
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
    campaign["status"] = "archived"
    campaign["updatedAt"] = now
    return {"detail": "Campaign deleted"}


# ─── CAMPAIGN ACTIONS ────────────────────────────────────────────────────────


@router.post("/campaigns/{campaign_id}/restore", response_model=EmailCampaignResponse)
async def restore_campaign(campaign_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"restore:{user}")
    if campaign_id not in _campaigns:
        raise HTTPException(status_code=404, detail="Campaign not found")
    campaign = _campaigns[campaign_id]
    if not campaign.get("deletedAt"):
        raise HTTPException(status_code=400, detail="Campaign is not deleted")

    now = datetime.now(timezone.utc).isoformat()
    campaign["deletedAt"] = None
    campaign["status"] = "draft"
    campaign["updatedAt"] = now
    return _to_campaign_response(campaign)


@router.post("/campaigns/{campaign_id}/duplicate", response_model=EmailCampaignResponse)
async def duplicate_campaign(campaign_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"duplicate:{user}")
    if campaign_id not in _campaigns:
        raise HTTPException(status_code=404, detail="Campaign not found")

    original = _campaigns[campaign_id]
    new_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    campaign = {
        **original,
        "id": new_id,
        "name": f"{original['name']} (Copy)",
        "status": "draft",
        "sentAt": None,
        "openRate": None,
        "clickRate": None,
        "unsubscribeRate": None,
        "recipientCount": 0,
        "aiGenerated": original.get("aiGenerated", False),
        "aiProvider": original.get("aiProvider"),
        "aiLatencyMs": original.get("aiLatencyMs"),
        "deletedAt": None,
        "createdAt": now,
        "updatedAt": now,
    }
    _campaigns[new_id] = campaign
    return _to_campaign_response(campaign)


@router.post("/campaigns/{campaign_id}/send", response_model=EmailCampaignResponse)
async def send_campaign(campaign_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"send:{user}")
    if campaign_id not in _campaigns:
        raise HTTPException(status_code=404, detail="Campaign not found")
    campaign = _campaigns[campaign_id]
    if campaign.get("deletedAt"):
        raise HTTPException(status_code=404, detail="Campaign not found")
    if campaign["status"] == "sent":
        raise HTTPException(status_code=400, detail="Campaign is already sent")

    now = datetime.now(timezone.utc).isoformat()
    campaign["status"] = "sent"
    campaign["sentAt"] = now
    campaign["updatedAt"] = now
    return _to_campaign_response(campaign)


@router.get("/campaigns/{campaign_id}/history")
async def get_campaign_history(campaign_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"read:{user}")
    if campaign_id not in _campaigns:
        raise HTTPException(status_code=404, detail="Campaign not found")
    history = _history.get(campaign_id, [])
    return history


# ─── FALLBACK EMAIL GENERATOR ────────────────────────────────────────────────


def _generate_fallback_email(data: EmailGenerateRequest) -> dict:
    """Generate extraordinary template-based email when AI is unavailable."""
    brand = data.brand or "your brand"
    audience = data.audience or "valued customers"
    product = data.product or "our products"
    cta = data.cta or "Get Started"

    _THEMES = {
        "promotional": {
            "gradient": "linear-gradient(135deg,#ff6b35 0%,#f7931e 50%,#ffd700 100%)",
            "accent": "#ff6b35", "accent2": "#f7931e", "bg_alt": "#fff8f0",
            "hero_emoji": "🔥", "badge_color": "#ff6b35",
            "features_icon": ["⚡", "🎁", "💎", "🚀"],
        },
        "transactional": {
            "gradient": "linear-gradient(135deg,#0f2027 0%,#203a43 50%,#2c5364 100%)",
            "accent": "#2c5364", "accent2": "#203a43", "bg_alt": "#f0f7fa",
            "hero_emoji": "✅", "badge_color": "#2c5364",
            "features_icon": ["🔒", "📦", "💳", "📞"],
        },
        "newsletter": {
            "gradient": "linear-gradient(135deg,#667eea 0%,#764ba2 100%)",
            "accent": "#667eea", "accent2": "#764ba2", "bg_alt": "#f4f0ff",
            "hero_emoji": "📰", "badge_color": "#667eea",
            "features_icon": ["💡", "📊", "🎯", "🏆"],
        },
        "welcome": {
            "gradient": "linear-gradient(135deg,#11998e 0%,#38ef7d 100%)",
            "accent": "#11998e", "accent2": "#38ef7d", "bg_alt": "#f0faf6",
            "hero_emoji": "👋", "badge_color": "#11998e",
            "features_icon": ["🌟", "🎯", "💎", "🎁"],
        },
        "product-launch": {
            "gradient": "linear-gradient(135deg,#0f0c29 0%,#302b63 50%,#24243e 100%)",
            "accent": "#7c3aed", "accent2": "#a855f7", "bg_alt": "#f5f3ff",
            "hero_emoji": "🚀", "badge_color": "#7c3aed",
            "features_icon": ["⚡", "🎨", "📊", "🔗"],
        },
        "cold-outreach": {
            "gradient": "linear-gradient(135deg,#1e3c72 0%,#2a5298 100%)",
            "accent": "#1e3c72", "accent2": "#2a5298", "bg_alt": "#eef4fb",
            "hero_emoji": "🤝", "badge_color": "#1e3c72",
            "features_icon": ["📈", "🏆", "💼", "🎯"],
        },
        "follow-up": {
            "gradient": "linear-gradient(135deg,#f093fb 0%,#f5576c 100%)",
            "accent": "#f5576c", "accent2": "#f093fb", "bg_alt": "#fef0f5",
            "hero_emoji": "💬", "badge_color": "#f5576c",
            "features_icon": ["📋", "📊", "💡", "🤝"],
        },
        "announcement": {
            "gradient": "linear-gradient(135deg,#fc4a1a 0%,#f7b733 100%)",
            "accent": "#fc4a1a", "accent2": "#f7b733", "bg_alt": "#fff8f0",
            "hero_emoji": "📢", "badge_color": "#fc4a1a",
            "features_icon": ["🆕", "⭐", "🔥", "🎯"],
        },
        "nurture": {
            "gradient": "linear-gradient(135deg,#56ab2f 0%,#a8e063 100%)",
            "accent": "#56ab2f", "accent2": "#a8e063", "bg_alt": "#f2f9ec",
            "hero_emoji": "🌱", "badge_color": "#56ab2f",
            "features_icon": ["📖", "💡", "🎓", "🌟"],
        },
        "re-engagement": {
            "gradient": "linear-gradient(135deg,#e44d26 0%,#f16529 50%,#e44d26 100%)",
            "accent": "#e44d26", "accent2": "#f16529", "bg_alt": "#fef2ee",
            "hero_emoji": "❤️", "badge_color": "#e44d26",
            "features_icon": ["🆕", "⚡", "🎁", "🚀"],
        },
        "abandoned-cart": {
            "gradient": "linear-gradient(135deg,#eb3349 0%,#f45c43 100%)",
            "accent": "#eb3349", "accent2": "#f45c43", "bg_alt": "#fef0f0",
            "hero_emoji": "🛒", "badge_color": "#eb3349",
            "features_icon": ["⏰", "💰", "🚚", "🔒"],
        },
        "thank-you": {
            "gradient": "linear-gradient(135deg,#a18cd1 0%,#fbc2eb 100%)",
            "accent": "#a18cd1", "accent2": "#fbc2eb", "bg_alt": "#f9f3fd",
            "hero_emoji": "🙏", "badge_color": "#a18cd1",
            "features_icon": ["❤️", "🌟", "🎁", "💎"],
        },
        "event-invitation": {
            "gradient": "linear-gradient(135deg,#7f00ff 0%,#e100ff 100%)",
            "accent": "#7f00ff", "accent2": "#e100ff", "bg_alt": "#f8f0ff",
            "hero_emoji": "🎉", "badge_color": "#7f00ff",
            "features_icon": ["🎤", "💡", "🤝", "📝"],
        },
        "discount": {
            "gradient": "linear-gradient(135deg,#f7971e 0%,#ffd200 100%)",
            "accent": "#f7971e", "accent2": "#ffd200", "bg_alt": "#fffbf0",
            "hero_emoji": "🏷️", "badge_color": "#f7971e",
            "features_icon": ["💰", "⚡", "🎁", "⏰"],
        },
    }
    theme = _THEMES.get(data.email_type, _THEMES["promotional"])

    subjects = {
        "promotional": f"🔥 Don't Miss Out — Exclusive Offer from {brand}!",
        "transactional": f"✅ Your {brand} Order is Confirmed!",
        "newsletter": f"📰 {brand} Weekly — What's Hot This Month",
        "welcome": f"👋 Welcome to {brand} — Let's Go!",
        "product-launch": f"🚀 Introducing {product} — Be the First!",
        "cold-outreach": f"🤝 Let's Grow Together, {brand} + You",
        "follow-up": f"💬 Quick Follow-Up from {brand}",
        "announcement": f"📢 Big News from {brand}!",
        "nurture": f"🌱 Your Success Blueprint from {brand}",
        "re-engagement": f"❤️ We Miss You at {brand}!",
        "abandoned-cart": "🛒 Your Cart Misses You — Complete Your Order!",
        "thank-you": f"🙏 Thank You from {brand}!",
        "event-invitation": f"🎉 You're Invited — {brand} Exclusive Event",
        "discount": f"🏷️ Save Big Today at {brand}!",
    }
    previews = {
        "promotional": f"Exclusive deal for {audience} — limited time only!",
        "transactional": "Your order details and next steps inside",
        "newsletter": f"Tips, updates, and insights from {brand}",
        "welcome": "Your journey with us starts now",
        "product-launch": f"The future of {product} is here",
        "cold-outreach": f"How {brand} helps {audience} achieve 3x results",
        "follow-up": "A quick thought from our last conversation",
        "announcement": f"Important update about {product}",
        "nurture": "3 tips to accelerate your success",
        "re-engagement": "See what you've been missing — plus a gift",
        "abandoned-cart": "Your items are selling fast — don't miss out",
        "thank-you": "We truly appreciate your support",
        "event-invitation": "Reserve your spot before it's gone",
        "discount": "Your exclusive discount is waiting inside",
    }

    _CONTENT = {
        "promotional": {
            "headline": f"Special Offer Just for {audience}!",
            "subheadline": f"Save big on {product} — this week only",
            "body": [
                f"For a limited time, we're giving {audience} exclusive access to {product} at an incredible price.",
                f"Whether you're just getting started or looking to level up, {brand} has everything you need to succeed.",
                f"This is the moment to take action. Hundreds of {audience} have already made the switch.",
            ],
            "quote": f"\"{brand} completely transformed how we do business. Best decision we ever made.\" — Sarah K., CEO",
            "stat": ("500+", "Happy Customers"),
            "urgency": "⏰ Offer expires in 48 hours — don't wait!",
        },
        "transactional": {
            "headline": "Order Confirmed!",
            "subheadline": "We're already working on your order",
            "body": [
                f"Thank you for your purchase with {brand}. Your order has been received and is being processed.",
                f"You'll receive a confirmation email shortly with tracking details for {product}.",
                "If you have any questions about your order, our support team is available 24/7.",
            ],
            "quote": "\"Super fast delivery and amazing quality. Will order again!\" — Michael R.",
            "stat": ("99.9%", "Orders On Time"),
            "urgency": "📦 Estimated delivery: 2-3 business days",
        },
        "newsletter": {
            "headline": f"{brand} Weekly Digest",
            "subheadline": "Your curated dose of insights and inspiration",
            "body": [
                "Here's what's trending this week in our community. We've handpicked the best content just for you.",
                f"From expert tips to product updates, {brand} is committed to keeping you informed and inspired.",
                "Don't miss our featured story this week — it's a game-changer for your strategy.",
            ],
            "quote": "\"I look forward to this newsletter every week. Always packed with value.\" — Priya M.",
            "stat": ("10K+", "Subscribers"),
            "urgency": "📖 Read time: 3 minutes — worth every second",
        },
        "welcome": {
            "headline": f"Welcome to the {brand} Family!",
            "subheadline": "Your journey to excellence starts now",
            "body": [
                f"We're thrilled to have you join {brand}. You're now part of a community of {audience} who are transforming their results.",
                f"As a {brand} member, you'll get exclusive access to {product}, expert resources, and priority support.",
                "Start by exploring your personalized dashboard — it's designed to help you hit the ground running.",
            ],
            "quote": "\"Joining {brand} was the best decision I made this year. The support is incredible.\" — Alex T.",
            "stat": ("100%", "Welcome Rate"),
            "urgency": "🎁 Your welcome gift is waiting inside your dashboard",
        },
        "product-launch": {
            "headline": f"Introducing {product}",
            "subheadline": "The future of innovation is here",
            "body": [
                f"After months of development, we're thrilled to unveil {product} — built from the ground up for {audience}.",
                f"Packed with cutting-edge features, {product} delivers unmatched performance, design, and reliability.",
                f"Be among the first to experience the next generation of {brand}. Early adopters get exclusive benefits.",
            ],
            "quote": "\"This is exactly what we've been waiting for. {product} is a game-changer.\" — James L.",
            "stat": ("10x", "Faster Performance"),
            "urgency": "🚀 Launch offer: 20% off for the first 100 customers",
        },
        "cold-outreach": {
            "headline": "Let's Grow Together",
            "subheadline": f"How {brand} helps {audience} achieve 3x results",
            "body": [
                f"I'm reaching out because I believe {brand} can make a real difference for your team.",
                f"We've helped similar {audience} increase their efficiency by 40% within the first 90 days.",
                f"Would you be open to a quick 15-minute call to explore how {brand} and {product} can help you?",
            ],
            "quote": "\"{brand} helped us scale from 10 to 100 customers in 6 months.\" — David Chen, Founder",
            "stat": ("40%", "Efficiency Gain"),
            "urgency": "📞 Reply to this email to schedule your free consultation",
        },
        "follow-up": {
            "headline": "Just Checking In",
            "subheadline": "A quick follow-up from our conversation",
            "body": [
                f"I wanted to follow up on our previous chat about how {product} can help your team.",
                f"I've prepared a personalized demo just for you — it takes 10 minutes and shows exactly how {brand} works.",
                "No pressure at all. I'm here whenever you're ready to take the next step.",
            ],
            "quote": "\"{brand} made the onboarding process seamless. We were up and running in a day.\" — Lisa W.",
            "stat": ("24hr", "Avg. Setup Time"),
            "urgency": "📅 Your personalized demo link expires in 7 days",
        },
        "announcement": {
            "headline": f"Big News from {brand}!",
            "subheadline": "An exciting update you won't want to miss",
            "body": [
                f"We have some exciting news to share. {brand} is making major moves to serve {audience} better.",
                f"This update brings powerful new features, improved performance, and a redesigned experience for {product}.",
                "We can't wait for you to try it. Stay tuned for the full rollout details.",
            ],
            "quote": "\"{brand} never stops innovating. This is why we're loyal customers.\" — Rachel P.",
            "stat": ("New", "Version 3.0"),
            "urgency": "🆕 Rolling out to all users this week",
        },
        "nurture": {
            "headline": "Your Success Blueprint",
            "subheadline": "3 expert tips to level up your game",
            "body": [
                f"At {brand}, we're committed to helping you succeed. Here are 3 expert tips to get more from {product}.",
                "Start with clear goals, leverage our resources, and track your progress. Simple but powerful.",
                f"Our community of {audience} is growing fast — join the conversation and learn from peers.",
            ],
            "quote": "\"The resources at {brand} are top-notch. Changed how I approach my work.\" — Karen S.",
            "stat": ("50+", "Expert Resources"),
            "urgency": "📚 New guide: \"10 Strategies for Success\" — free download",
        },
        "re-engagement": {
            "headline": f"We Miss You at {brand}!",
            "subheadline": "A lot has changed since you've been gone",
            "body": [
                f"It's been a while, and we wanted to reach out. {brand} has been busy — and we think you'll love what's new.",
                f"We've added powerful new features to {product}, improved performance, and introduced new integrations.",
                "Come back and see what's new. We have a special welcome-back offer waiting for you.",
            ],
            "quote": "\"I came back and was blown away by the improvements. So glad I gave it another try.\" — Tom H.",
            "stat": ("3x", "More Features"),
            "urgency": "🎁 Welcome-back gift: 30% off your next purchase",
        },
        "abandoned-cart": {
            "headline": "Your Cart Misses You!",
            "subheadline": "Don't let your favorites slip away",
            "body": [
                f"We noticed you left something in your cart. Your selection of {product} is still saved — but not for long.",
                f"Thousands of {audience} have already chosen {product}. Here's what they're saying about it.",
                "Complete your order today and enjoy fast, secure checkout with free shipping on all orders.",
            ],
            "quote": "\"Best purchase I've made this year. The quality is outstanding.\" — Emma L.",
            "stat": ("95%", "Customer Satisfaction"),
            "urgency": "⏰ Your cart expires in 24 hours — complete your order now!",
        },
        "thank-you": {
            "headline": f"Thank You from {brand}!",
            "subheadline": "We truly appreciate your support",
            "body": [
                f"We just wanted to take a moment to say a heartfelt thank you. Your support means the world to us at {brand}.",
                f"Because of customers like you, we continue to grow and improve {product}. You make it all possible.",
                "If there's anything we can do better, please don't hesitate to reach out. We're always here for you.",
            ],
            "quote": "\"{brand} has the best customer service I've ever experienced. Truly exceptional.\" — Nina K.",
            "stat": ("10K+", "Happy Customers"),
            "urgency": "🎁 As a thank-you, enjoy 15% off your next order",
        },
        "event-invitation": {
            "headline": "You're Invited!",
            "subheadline": f"Exclusive {brand} event — {product} deep dive",
            "body": [
                f"We're thrilled to invite you to our exclusive event. Join us for an in-depth look at {product} with live demos.",
                "You'll hear from industry experts, see real-world case studies, and have the chance to ask questions live.",
                "Spaces are limited and filling fast. Reserve your spot today to guarantee your seat.",
            ],
            "quote": "\"Best virtual event I attended this year. Packed with actionable insights.\" — George M.",
            "stat": ("500+", "Registered"),
            "urgency": "📅 Event date: Next Friday — only 20 spots left!",
        },
        "discount": {
            "headline": "Exclusive Discount Inside!",
            "subheadline": f"Save 30% on {product} — today only",
            "body": [
                f"We're offering an exclusive discount on {product} just for you. This is our biggest sale of the season!",
                f"With this discount, you'll get full access to everything {brand} offers at a fraction of the price.",
                f"Don't miss this limited-time offer. Use it before it expires and start seeing results with {product}.",
            ],
            "quote": "\"Saved $200 with this deal. {product} is absolutely worth every penny.\" — Chris B.",
            "stat": ("30%", "Off Today"),
            "urgency": "⏰ Sale ends at midnight — use code SAVE30 at checkout",
        },
    }
    c = _CONTENT.get(data.email_type, _CONTENT["promotional"])

    _FEATURES = {
        "promotional": ["Premium Quality Products", "24/7 Expert Support", "Money-Back Guarantee", "Free Express Shipping"],
        "transactional": ["Secure Payment Processing", "Instant Order Confirmation", "Easy Returns Policy", "24/7 Customer Support"],
        "newsletter": ["Curated Industry Insights", "Expert Tips & Tricks", "Exclusive Product Updates", "Community Highlights"],
        "welcome": ["Personalized Dashboard", "Priority Support Access", "Exclusive Member Content", "Early Feature Access"],
        "product-launch": ["Streamlined Interface", "Powerful Analytics", "Seamless Integrations", "24/7 Dedicated Support"],
        "cold-outreach": ["Proven Track Record", "Custom Solutions", "No Long-Term Contracts", "Free Initial Consultation"],
        "follow-up": ["Detailed Case Studies", "Custom Breakdown", "Expert Guidance", "Flexible Scheduling"],
        "announcement": ["Improved Performance", "New Features", "Enhanced Security", "Better User Experience"],
        "nurture": ["Actionable Expert Tips", "In-Depth Insights", "Full Resource Library", "Vibrant Community"],
        "re-engagement": ["Brand-New Features", "Lightning Performance", "Welcome-Back Bonus", "VIP Priority Support"],
        "abandoned-cart": ["Still Available for You", "Secure 1-Click Checkout", "Free Live Support", "Hassle-Free Returns"],
        "thank-you": ["Exclusive Member Perks", "Priority Support Line", "Early Feature Access", "VIP Community"],
        "event-invitation": ["World-Class Speakers", "Live Product Demos", "Networking Opportunities", "Interactive Q&A"],
        "discount": ["Limited-Time Offer", "Full Premium Access", "All Features Included", "No Hidden Fees"],
    }
    features = _FEATURES.get(data.email_type, _FEATURES["promotional"])
    icons = theme["features_icon"]

    feature_rows = ""
    for i, f in enumerate(features):
        ic = icons[i % len(icons)]
        bg = theme["accent"] if i % 2 == 0 else theme["accent2"]
        feature_rows += (
            f'<tr><td style="padding:14px 0;border-bottom:1px solid #e8e8e8">'
            f'<table cellpadding="0" cellspacing="0" width="100%"><tr>'
            f'<td width="48" style="vertical-align:top"><div style="width:44px;height:44px;border-radius:12px;background:{bg};text-align:center;line-height:44px;font-size:20px;color:#fff">{ic}</div></td>'
            f'<td style="padding-left:14px;vertical-align:top"><div style="font-size:16px;font-weight:700;color:#1a1a2e;margin-bottom:3px">{f}</div>'
            f'<div style="font-size:13px;color:#666;line-height:1.4">Premium quality and reliability you can count on</div></td>'
            f'</tr></table></td></tr>'
        )

    paragraphs = c["body"]
    body_html = "".join(
        f'<p style="font-size:16px;line-height:1.8;color:#444;margin:0 0 16px">{p}</p>' for p in paragraphs
    )

    quote_author = c["quote"].split("—")[-1].strip() if "—" in c["quote"] else "Happy Customer"
    quote_text = c["quote"].split('"')[1] if '"' in c["quote"] else c["quote"]

    html = f"""<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f0f0f0;font-family:'Segoe UI',Arial,Helvetica,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f0f0;padding:40px 20px">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.12)">

<!-- HERO -->
<tr><td style="background:{theme['gradient']};padding:52px 44px;text-align:center">
<div style="font-size:48px;margin-bottom:12px">{theme['hero_emoji']}</div>
<h1 style="color:#ffffff;margin:0 0 10px;font-size:32px;font-weight:800;letter-spacing:-0.5px;text-shadow:0 2px 8px rgba(0,0,0,0.15)">{c['headline']}</h1>
<p style="color:rgba(255,255,255,0.92);margin:0;font-size:17px;font-weight:400">{c['subheadline']}</p>
<div style="margin-top:20px"><a href="#" style="display:inline-block;background:#ffffff;color:{theme['accent']};padding:14px 40px;border-radius:50px;text-decoration:none;font-weight:700;font-size:16px;box-shadow:0 4px 16px rgba(0,0,0,0.15)">{cta}</a></div>
</td></tr>

<!-- STAT BANNER -->
<tr><td style="background:{theme['accent']};padding:18px 40px;text-align:center">
<table cellpadding="0" cellspacing="0" width="100%"><tr>
<td width="33%" align="center"><div style="color:#fff;font-size:28px;font-weight:800">{c['stat'][0]}</div><div style="color:rgba(255,255,255,0.85);font-size:12px;text-transform:uppercase;letter-spacing:1px">{c['stat'][1]}</div></td>
<td width="33%" align="center"><div style="color:#fff;font-size:28px;font-weight:800">★★★★★</div><div style="color:rgba(255,255,255,0.85);font-size:12px;text-transform:uppercase;letter-spacing:1px">Top Rated</div></td>
<td width="33%" align="center"><div style="color:#fff;font-size:28px;font-weight:800">24/7</div><div style="color:rgba(255,255,255,0.85);font-size:12px;text-transform:uppercase;letter-spacing:1px">Always On</div></td>
</tr></table>
</td></tr>

<!-- BODY -->
<tr><td style="padding:40px 44px 24px">
<p style="font-size:17px;line-height:1.8;color:#333;margin:0 0 20px">Hi {audience},</p>
{body_html}
</td></tr>

<!-- FEATURES -->
<tr><td style="padding:0 44px 24px">
<div style="background:{theme['bg_alt']};border-radius:14px;padding:28px 28px;border:1px solid #e8e8e8">
<h3 style="margin:0 0 18px;font-size:19px;color:#1a1a2e;font-weight:700">✨ What You Get</h3>
<table width="100%" cellpadding="0" cellspacing="0">{feature_rows}</table>
</div>
</td></tr>

<!-- TESTIMONIAL -->
<tr><td style="padding:0 44px 24px">
<div style="background:linear-gradient(135deg,#fafafa,#f5f5f5);border-radius:14px;padding:32px;border-left:5px solid {theme['accent']};position:relative">
<div style="font-size:40px;color:{theme['accent']};opacity:0.3;margin-bottom:-10px">❝</div>
<p style="font-size:16px;line-height:1.7;color:#555;font-style:italic;margin:0 0 14px">{quote_text}</p>
<table cellpadding="0" cellspacing="0"><tr>
<td><div style="width:42px;height:42px;border-radius:50%;background:{theme['gradient']};text-align:center;line-height:42px;color:#fff;font-weight:700;font-size:16px">{quote_author[0]}</div></td>
<td style="padding-left:12px"><div style="font-size:14px;font-weight:700;color:#1a1a2e">{quote_author}</div><div style="font-size:12px;color:#999">Verified Customer</div></td>
</tr></table>
</div>
</td></tr>

<!-- URGENCY BANNER -->
<tr><td style="padding:0 44px 24px">
<div style="background:{theme['bg_alt']};border:2px dashed {theme['accent']};border-radius:12px;padding:20px 24px;text-align:center">
<div style="font-size:17px;font-weight:700;color:{theme['accent']}">{c['urgency']}</div>
</div>
</td></tr>

<!-- CTA -->
<tr><td style="padding:10px 44px 40px;text-align:center">
<table cellpadding="0" cellspacing="0" style="margin:0 auto"><tr>
<td style="background:{theme['gradient']};border-radius:50px;padding:18px 52px;box-shadow:0 6px 20px rgba(0,0,0,0.15)">
<a href="#" style="color:#ffffff;text-decoration:none;font-size:18px;font-weight:700;display:inline-block;letter-spacing:0.5px">{cta} →</a>
</td></tr></table>
</td></tr>

<!-- DIVIDER -->
<tr><td style="padding:0 44px"><div style="height:1px;background:linear-gradient(90deg,transparent,{theme['accent']},transparent)"></div></td></tr>

<!-- SOCIAL PROOF -->
<tr><td style="padding:30px 44px;text-align:center">
<p style="margin:0 0 12px;font-size:14px;color:#999;text-transform:uppercase;letter-spacing:2px">Trusted by</p>
<div style="font-size:28px;letter-spacing:8px;color:{theme['accent']}">★ ★ ★ ★ ★</div>
<p style="margin:10px 0 0;font-size:13px;color:#999">Rated 4.9/5 by 2,000+ customers</p>
</td></tr>

<!-- FOOTER -->
<tr><td style="background:#1a1a2e;padding:36px 44px">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center">
<div style="font-size:22px;font-weight:800;color:#ffffff;margin-bottom:8px">{brand}</div>
<div style="font-size:13px;color:rgba(255,255,255,0.6);margin-bottom:16px">Innovation • Quality • Trust</div>
<table cellpadding="0" cellspacing="0"><tr>
<td style="padding:0 8px"><a href="#" style="display:inline-block;width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.1);text-align:center;line-height:36px;color:#fff;text-decoration:none;font-size:14px">𝕏</a></td>
<td style="padding:0 8px"><a href="#" style="display:inline-block;width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.1);text-align:center;line-height:36px;color:#fff;text-decoration:none;font-size:14px">in</a></td>
<td style="padding:0 8px"><a href="#" style="display:inline-block;width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.1);text-align:center;line-height:36px;color:#fff;text-decoration:none;font-size:14px">f</a></td>
<td style="padding:0 8px"><a href="#" style="display:inline-block;width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.1);text-align:center;line-height:36px;color:#fff;text-decoration:none;font-size:14px">ig</a></td>
</tr></table>
</td></tr>
<tr><td align="center" style="padding-top:20px">
<p style="font-size:12px;color:rgba(255,255,255,0.4);margin:0">This email was sent by {brand}. <a href="#" style="color:rgba(255,255,255,0.5)">Unsubscribe</a> | <a href="#" style="color:rgba(255,255,255,0.5)">Manage Preferences</a></p>
<p style="font-size:11px;color:rgba(255,255,255,0.3);margin:6px 0 0">&copy; 2026 {brand}. All rights reserved.</p>
</td></tr>
</table>
</td></tr>

</table>
</td></tr>
</table>
</body></html>"""

    paragraphs_md = "\n\n".join(paragraphs)
    features_md = "\n".join(f"- {ic} **{f}**" for ic, f in zip(icons, features))
    markdown = (
        f"# {theme['hero_emoji']} {c['headline']}\n\n"
        f"*{c['subheadline']}*\n\n"
        f"Hi {audience},\n\n{paragraphs_md}\n\n"
        f"## ✨ What You Get\n\n{features_md}\n\n"
        f"> {quote_text}\n> — *{quote_author}*\n\n"
        f"### {c['urgency']}\n\n"
        f"**[{cta} →](#)**\n\n"
        f"---\n*{brand} — Innovation • Quality • Trust*\n"
    )

    return {"subject": subjects.get(data.email_type, f"Message from {brand}"), "preview_text": previews.get(data.email_type, f"An important update from {brand}"), "html": html, "markdown": markdown}


# ─── AI GENERATE ─────────────────────────────────────────────────────────────


@router.post("/generate", response_model=EmailGenerateResponse)
async def generate_email(data: EmailGenerateRequest, user: str = Depends(get_current_user)):
    check_rate_limit(f"ai:{user}", AI_RATE_LIMIT_MAX)

    email_type = data.email_type.lower()
    if email_type not in _VALID_EMAIL_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid email_type '{data.email_type}'. Must be one of: {', '.join(sorted(_VALID_EMAIL_TYPES))}",
        )

    from app.engine import get_ai_engine
    engine = get_ai_engine()

    prompt_parts = [
        "Generate a professional marketing email with the following specifications:",
        f"Email Type: {data.email_type}",
    ]
    if data.brand:
        prompt_parts.append(f"Brand: {data.brand}")
    if data.campaign_name:
        prompt_parts.append(f"Campaign Name: {data.campaign_name}")
    if data.audience:
        prompt_parts.append(f"Target Audience: {data.audience}")
    if data.goal:
        prompt_parts.append(f"Goal: {data.goal}")
    if data.tone:
        prompt_parts.append(f"Tone: {data.tone}")
    if data.language and data.language != "English":
        prompt_parts.append(f"Language: {data.language}")
    if data.cta:
        prompt_parts.append(f"Call to Action: {data.cta}")
    if data.product:
        prompt_parts.append(f"Product/Service: {data.product}")
    if data.keywords:
        prompt_parts.append(f"Keywords to include: {', '.join(data.keywords)}")
    if data.context:
        prompt_parts.append(f"Additional Context: {data.context}")

    type_tips = {
        "promotional": "Create an urgency-driven promotional email with clear product benefits and a strong CTA. Use persuasive language and highlight discounts or offers. Include a compelling headline, 2-3 benefit bullet points, social proof or testimonials, and a prominent CTA button.",
        "transactional": "Create a clear, concise transactional email (receipt, confirmation, notification). Keep it informative and professional. Include order details, next steps, and contact information.",
        "newsletter": "Create an informative newsletter with 3-4 engaging sections, valuable content, and a clean layout. Include a main feature story, quick links, a tip of the week, and a CTA to read more.",
        "welcome": "Create a warm, welcoming email for new subscribers or users. Be friendly, set expectations, explain what they will receive, highlight 3 key benefits, and guide them to take their first action.",
        "product-launch": "Create an exciting product launch email that builds anticipation. Include a hero headline, 3-4 key features with descriptions, benefits section, launch pricing or offer, and a strong launch CTA button.",
        "cold-outreach": "Create a professional cold outreach email that personalizes the message, demonstrates value with specific examples or stats, includes a testimonial, and a low-friction CTA. Keep it under 200 words.",
        "follow-up": "Create a thoughtful follow-up email that adds value with a specific insight or resource, references the previous interaction, and gently nudges the recipient toward action with a clear CTA.",
        "announcement": "Create a clear announcement email with the key news as a headline, supporting details in 2-3 paragraphs, a quote or testimonial, and a clear next step CTA.",
        "nurture": "Create a nurturing email that builds relationship and trust. Provide value through 3 actionable tips, insights, or resources. Include a soft CTA and establish thought leadership.",
        "re-engagement": "Create a re-engagement email that reminds the recipient of your value proposition, highlights what they have been missing with 2-3 updates, and offers an incentive to return with a strong CTA.",
        "abandoned-cart": "Create a recovery email that reminds the customer of their selected items, addresses potential objections, offers social proof, and includes an incentive or urgency to complete the purchase.",
        "thank-you": "Create a genuine thank-you email that expresses specific appreciation, shares the impact of their action, offers a next step or bonus, and strengthens the relationship.",
        "event-invitation": "Create an exciting event invitation with event details (date, time, topic), 3 key takeaways attendees will gain, speaker credibility, and a clear RSVP CTA.",
        "discount": "Create a discount email with a compelling headline showing the savings, 2-3 featured products or benefits, urgency elements (expiry date), and a prominent CTA to claim the discount.",
    }
    tip = type_tips.get(data.email_type, "Create a professional, engaging email with clear structure and multiple sections.")
    prompt_parts.append(f"Email best practices: {tip}")

    prompt_parts.append(
        "\nGenerate a WORLD-CLASS, EXTRAORDINARY HTML email that looks like it was designed by a top-tier email agency.\n\n"
        "DESIGN REQUIREMENTS (your html_content MUST match this level of quality):\n"
        "- Hero section: full-width gradient background (e.g. linear-gradient 135deg), large bold white headline (28-34px), subtitle in lighter color\n"
        "- Content sections: alternating background colors (#ffffff, #f8f9fa, #e8f4fd) for visual rhythm\n"
        "- Feature list: 3-4 items, each with a colored circle icon (Unicode: ★ ● ✦ ◆), bold title, and 1-line description\n"
        "- CTA button: large pill shape (border-radius 8px), gradient or solid bg, white bold text, 16px padding, centered\n"
        "- Social proof: styled testimonial card with italic quote, bold author name, and star ratings (★★★★★)\n"
        "- Trust badges row: 3-4 small badges with icons (✓ Free Shipping, ✓ 24/7 Support, ✓ Money Back, ✓ Premium Quality)\n"
        "- Footer: dark background (#1a1a2e), brand name, address, unsubscribe link, copyright\n"
        "- Visual dividers: thin colored lines or gradient bars between sections\n"
        "- Table-based layout with 600px max-width, inline CSS on every element\n"
        "- Unicode decorative elements: ✦ ★ ● ◆ → ♦ for visual flair\n"
        "- Total: 400-700 words, 5-7 distinct visual sections\n\n"
        "WHAT MAKES IT EXTRAORDINARY:\n"
        "- Not just text in a table — it should feel like a designed newsletter\n"
        "- Use box shadows, rounded corners, gradient backgrounds, colored section breaks\n"
        "- Include a 'quote of the day' or 'tip of the week' styled section\n"
        "- Add a 'What Our Customers Say' testimonial block\n"
        "- End with a 'Stay Connected' section with social media icons (Unicode)\n\n"
        "Return a JSON object with:\n"
        '- "subject": compelling subject line (under 60 chars, with emoji if appropriate)\n'
        '- "preview_text": preheader text (under 100 chars)\n'
        '- "html_content": the FULL extraordinary HTML email with all above elements\n'
        '- "markdown_content": markdown version of the email text\n'
    )

    if data.num_variations > 1:
        prompt_parts.append(f"\nGenerate exactly {min(data.num_variations, 5)} variations.")
        prompt_parts.append(
            'Return a JSON object with a "campaigns" array, each containing "subject", "preview_text", "html_content", "markdown_content".'
        )
    else:
        prompt_parts.append("\nGenerate exactly 1 variation.")

    full_prompt = "\n".join(prompt_parts)

    json_data = {}
    ai_success = False
    response_provider = "none"
    response_latency = 0.0

    for attempt in range(3):
        try:
            response = await engine.generate_json(
                prompt=full_prompt,
                system_instruction=(
                    "You are a world-class email marketing designer and copywriter. "
                    "Create EXTRAORDINARY, visually stunning HTML emails that look like premium agency work. "
                    "Use rich inline CSS: gradients, box shadows, rounded corners, colored backgrounds, styled buttons. "
                    "Every email must have: gradient hero header, feature bullets with icons, styled CTA button, "
                    "testimonial card with stars, trust badges, dark footer, visual dividers. "
                    "Table-based layout, 600px max-width, email-client compatible. "
                    "The email should be visually breathtaking — not plain text. "
                    "Return only valid JSON without markdown formatting."
                ),
                operation="email_generate",
                user_id=user,
            )

            response_provider = response.provider or "none"
            response_latency = response.latency_ms or 0

            json_data = response.json_data or {} if response.success else {}
            raw_campaigns = json_data.get("campaigns", [])

            if not raw_campaigns:
                raw_campaigns = [json_data]

            if raw_campaigns and raw_campaigns[0].get("subject"):
                ai_success = True
                break

            if response.error and "429" in str(response.error):
                import asyncio
                await asyncio.sleep(2 * (attempt + 1))
                continue
            break
        except Exception:
            import asyncio
            await asyncio.sleep(2 * (attempt + 1))
            continue

    if ai_success:
        now = datetime.now(timezone.utc).isoformat()
        created_campaigns: list[dict] = []
        num = max(1, min(data.num_variations, 5))
        for raw in raw_campaigns[:num]:
            campaign_id = str(uuid.uuid4())
            campaign = {
                "id": campaign_id,
                "workspaceId": data.workspace_id,
                "name": data.campaign_name or f"AI Generated - {data.email_type.title()}",
                "subject": raw.get("subject", ""),
                "previewText": raw.get("preview_text"),
                "emailType": email_type,
                "htmlContent": raw.get("html_content"),
                "markdownContent": raw.get("markdown_content"),
                "plainText": None,
                "jsonContent": None,
                "brand": data.brand,
                "audience": data.audience,
                "goal": data.goal,
                "tone": data.tone,
                "language": data.language or "English",
                "cta": data.cta,
                "product": data.product,
                "keywords": data.keywords or [],
                "templateId": None,
                "status": "draft",
                "sentAt": None,
                "openRate": None,
                "clickRate": None,
                "unsubscribeRate": None,
                "recipientCount": 0,
                "aiGenerated": True,
                "aiProvider": response.provider or "none",
                "aiLatencyMs": round(response.latency_ms or 0, 2),
                "deletedAt": None,
                "createdAt": now,
                "updatedAt": now,
            }
            _campaigns[campaign_id] = campaign
            created_campaigns.append(campaign)

        return EmailGenerateResponse(
            campaigns=[_to_campaign_response(c) for c in created_campaigns],
            provider=response_provider,
            latency_ms=round(response_latency, 2),
        )

    fallback = _generate_fallback_email(data)
    now = datetime.now(timezone.utc).isoformat()
    campaign_id = str(uuid.uuid4())
    campaign = {
        "id": campaign_id,
        "workspaceId": data.workspace_id,
        "name": data.campaign_name or f"Fallback Generated - {data.email_type.title()}",
        "subject": fallback["subject"],
        "previewText": fallback["preview_text"],
        "emailType": email_type,
        "htmlContent": fallback["html"],
        "markdownContent": fallback["markdown"],
        "plainText": None,
        "jsonContent": None,
        "brand": data.brand,
        "audience": data.audience,
        "goal": data.goal,
        "tone": data.tone,
        "language": data.language or "English",
        "cta": data.cta,
        "product": data.product,
        "keywords": data.keywords or [],
        "templateId": None,
        "status": "draft",
        "sentAt": None,
        "openRate": None,
        "clickRate": None,
        "unsubscribeRate": None,
        "recipientCount": 0,
        "aiGenerated": True,
        "aiProvider": "fallback",
        "aiLatencyMs": 0,
        "deletedAt": None,
        "createdAt": now,
        "updatedAt": now,
    }
    _campaigns[campaign_id] = campaign
    return EmailGenerateResponse(
        campaigns=[_to_campaign_response(campaign)],
        provider="fallback",
        latency_ms=0,
    )


# ─── AI ACTION ───────────────────────────────────────────────────────────────


@router.post("/ai/action", response_model=EmailAIResponse)
async def ai_action_on_campaign(data: EmailAIRequest, user: str = Depends(get_current_user)):
    check_rate_limit(f"ai:{user}", AI_RATE_LIMIT_MAX)

    if data.campaign_id not in _campaigns:
        raise HTTPException(status_code=404, detail="Campaign not found")

    campaign = _campaigns[data.campaign_id]
    if campaign.get("deletedAt"):
        raise HTTPException(status_code=404, detail="Campaign not found")

    from app.engine import get_ai_engine
    engine = get_ai_engine()

    valid_actions = {
        "rewrite",
        "improve",
        "expand",
        "shorten",
        "personalize",
        "translate",
        "grammar-fix",
    }
    if data.action.lower() not in valid_actions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid action '{data.action}'. Must be one of: {', '.join(sorted(valid_actions))}",
        )

    action_descriptions = {
        "rewrite": "Rewrite this email with fresh wording while preserving the core message and intent",
        "improve": "Improve this email for better clarity, engagement, and conversion",
        "expand": "Expand this email with more detail, supporting points, and richer content",
        "shorten": "Shorten this email to be more concise while keeping the essential message",
        "personalize": "Personalize this email to feel more tailored and individual to the recipient",
        "translate": "Translate this email to a different language while maintaining tone and intent",
        "grammar-fix": "Fix all grammar, spelling, and punctuation errors in this email",
    }

    action_text = action_descriptions.get(data.action.lower(), data.action)

    original_content = campaign.get("htmlContent") or campaign.get("markdownContent") or campaign["subject"]

    prompt = (
        f"You are editing an existing HTML email. You MUST preserve ALL of the following in your response:\n"
        f"- All HTML tags, table structure, and table-based layout\n"
        f"- All inline CSS styles (every style attribute on every element)\n"
        f"- All images, image URLs, and image dimensions\n"
        f"- All bullet points (<ul>, <ol>, <li> tags)\n"
        f"- All links (<a> tags) and button styles\n"
        f"- All colors, fonts, spacing, padding, and margins\n"
        f"- The overall visual structure and design of the email\n\n"
        f"Email Type: {campaign['emailType']}\n"
        f"Subject: {campaign['subject']}\n"
        f"Brand: {campaign.get('brand') or 'Not specified'}\n"
        f"Audience: {campaign.get('audience') or 'Not specified'}\n"
        f"Tone: {campaign.get('tone') or 'Professional'}\n"
        f"Action to perform: {action_text}\n\n"
        f"Current HTML email content (preserve ALL formatting, only change the text/copy as needed):\n{original_content}\n\n"
    )
    if data.context:
        prompt += f"Additional instructions: {data.context}\n\n"
    prompt += (
        "Return a JSON object with:\n"
        '- "subject": the updated subject line (keep if action does not require change)\n'
        '- "preview_text": the updated preview text (keep if action does not require change)\n'
        '- "html_content": the COMPLETE updated HTML email with ALL existing inline CSS, tables, images, bullets, and formatting preserved\n'
        '- "markdown_content": a markdown version of the email text content\n\n'
        "CRITICAL: The html_content must be a COMPLETE, READY-TO-SEND HTML email. "
        "Do NOT output plain text. Do NOT remove HTML tags. Do NOT strip styling. "
        "Do NOT remove images or bullet points. Do NOT simplify the layout. "
        "Only modify the text copy within the existing HTML structure."
    )

    ai_success = False
    response_provider = "none"
    response_latency = 0.0
    json_data = {}

    for attempt in range(3):
        try:
            response = await engine.generate_json(
                prompt=prompt,
                system_instruction=(
                    "You are an expert email marketing copywriter. "
                    "You are given an existing HTML email. Your job is to modify ONLY the text copy "
                    "(headlines, paragraphs, button text, etc.) according to the requested action. "
                    "You MUST keep the EXACT same HTML structure, table layout, inline CSS styles, "
                    "images, bullet points, links, and visual design. "
                    "Do NOT convert HTML to plain text. Do NOT remove any HTML tags or styles. "
                    "Do NOT simplify or strip the layout. "
                    "Return only valid JSON without any markdown formatting."
                ),
                operation=f"email_ai_{data.action}",
                user_id=user,
            )

            response_provider = response.provider or "none"
            response_latency = response.latency_ms or 0
            json_data = response.json_data or {} if response.success else {}

            if json_data.get("html_content"):
                ai_success = True
                break

            if response.error and "429" in str(response.error):
                import asyncio
                await asyncio.sleep(2 * (attempt + 1))
                continue
            break
        except Exception:
            import asyncio
            await asyncio.sleep(2 * (attempt + 1))
            continue

    if ai_success:
        new_content = json_data.get("html_content", original_content)

        now = datetime.now(timezone.utc).isoformat()

        if json_data.get("subject"):
            campaign["subject"] = json_data["subject"]
        if json_data.get("preview_text"):
            campaign["previewText"] = json_data["preview_text"]
        if json_data.get("html_content"):
            campaign["htmlContent"] = json_data["html_content"]
        if json_data.get("markdown_content"):
            campaign["markdownContent"] = json_data["markdown_content"]
        campaign["updatedAt"] = now

        history_entry = {
            "id": str(uuid.uuid4()),
            "campaignId": data.campaign_id,
            "action": data.action,
            "contentBefore": original_content,
            "contentAfter": new_content,
            "provider": response_provider,
            "latencyMs": round(response_latency, 2),
            "createdAt": now,
        }
        _history.setdefault(data.campaign_id, []).append(history_entry)

        return EmailAIResponse(
            campaign_id=data.campaign_id,
            field="html_content",
            original=original_content,
            updated=new_content,
            action=data.action,
            provider=response_provider,
            latency_ms=round(response_latency, 2),
        )

    import re

    def _transform_text(html: str, fn) -> str:
        """Apply fn() only to visible text between HTML tags, preserving all tags/CSS."""
        return re.sub(r'>([^<]+)<', lambda m: '>' + fn(m.group(1)) + '<', html)

    tone = (campaign.get("tone") or "professional").lower()
    brand = campaign.get("brand") or "our brand"
    cta = campaign.get("cta") or "Learn More"

    if data.action == "shorten":
        def _shorten(text):
            sentences = re.split(r'(?<=[.!?])\s+', text.strip())
            return " ".join(sentences[:max(1, len(sentences) // 2)])
        new_content = _transform_text(original_content, _shorten)

    elif data.action == "expand":
        fillers = {
            "professional": "We're committed to delivering exceptional results.",
            "friendly": "We'd love to help you every step of the way!",
            "luxury": "Experience the pinnacle of refined craftsmanship.",
            "casual": "Pretty cool, right?",
            "formal": "We cordially invite you to experience our offerings.",
        }
        filler = fillers.get(tone, fillers["professional"])

        def _expand(text):
            sentences = re.split(r'(?<=[.!?])\s+', text.strip())
            expanded = []
            for s in sentences:
                expanded.append(s)
                if s.strip() and len(expanded) % 2 == 0:
                    expanded.append(filler)
            return " ".join(expanded)
        new_content = _transform_text(original_content, _expand)

    elif data.action == "rewrite":
        word_map = {
            "amazing": "exceptional", "great": "remarkable", "best": "finest",
            "innovative": "groundbreaking", "solution": "approach", "help": "empower",
            "use": "leverage", "make": "craft", "get": "receive", "try": "explore",
            "big": "significant", "fast": "swift", "easy": "seamless",
            "stunning": "breathtaking", "beautiful": "elegant", "powerful": "robust",
            "save": "unlock", "discount": "exclusive offer", "buy": "discover",
        }

        def _rewrite(text):
            result = text
            for old, new in word_map.items():
                result = re.sub(r'\b' + old + r'\b', new, result, flags=re.IGNORECASE)
            return result
        new_content = _transform_text(original_content, _rewrite)

    elif data.action == "improve":
        new_content = original_content

        if "<h" not in original_content.lower():
            heading = f'<tr><td style="padding:20px 30px;text-align:center"><h1 style="margin:0;font-size:28px;color:#1a1a2e">Discover What {brand} Can Do for You</h1></td></tr>'
            new_content = re.sub(r'(<body[^>]*>)', r'\1\n' + heading, new_content, count=1, flags=re.IGNORECASE)

        if cta.lower() not in original_content.lower():
            cta_html = f'<tr><td style="padding:20px 30px;text-align:center"><a href="#" style="background:#2563eb;color:#fff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;display:inline-block">{cta}</a></td></tr>'
            new_content = re.sub(r'(</body>)', cta_html + '\n' + r'\1', new_content, count=1, flags=re.IGNORECASE)

    elif data.action == "personalize":
        greeting = '<tr><td style="padding:20px 30px 10px"><p style="margin:0;font-size:16px;color:#333">Hi there,</p></td></tr>'
        closing = f'<tr><td style="padding:10px 30px 20px"><p style="margin:0;font-size:14px;color:#666">Best regards,<br><strong>The {brand} Team</strong></p></td></tr>'
        new_content = original_content
        if "Hi there" not in original_content:
            new_content = re.sub(r'(<body[^>]*>)', r'\1\n' + greeting, new_content, count=1, flags=re.IGNORECASE)
        if "Best regards" not in original_content:
            new_content = re.sub(r'(</body>)', closing + '\n' + r'\1', new_content, count=1, flags=re.IGNORECASE)

    elif data.action == "translate":
        word_map = {
            "welcome": "bienvenue", "hello": "bonjour", "thank you": "merci",
            "discover": "découvrez", "today": "aujourd'hui", "new": "nouveau",
            "offer": "offre", "free": "gratuit", "click": "cliquez",
            "learn more": "en savoir plus", "get started": "commencer",
            "sign up": "s'inscrire", "contact us": "contactez-nous",
        }

        def _translate(text):
            result = text
            for en, fr in word_map.items():
                result = re.sub(r'\b' + re.escape(en) + r'\b', fr, result, flags=re.IGNORECASE)
            return result
        new_content = _transform_text(original_content, _translate)

    elif data.action == "grammar-fix":
        def _grammar(text):
            result = text
            result = re.sub(r'\s+', ' ', result)
            result = result.replace(" .", ".").replace(" ,", ",").replace(" !", "!").replace(" ?", "?")
            result = re.sub(r'\bi\b', 'I', result)
            result = re.sub(r"\bi'", "I'", result)
            return result
        new_content = _transform_text(original_content, _grammar)

    else:
        new_content = original_content

    now = datetime.now(timezone.utc).isoformat()
    campaign["htmlContent"] = new_content
    campaign["updatedAt"] = now

    history_entry = {
        "id": str(uuid.uuid4()),
        "campaignId": data.campaign_id,
        "action": data.action,
        "contentBefore": original_content,
        "contentAfter": new_content,
        "provider": "fallback",
        "latencyMs": 0,
        "createdAt": now,
    }
    _history.setdefault(data.campaign_id, []).append(history_entry)

    return EmailAIResponse(
        campaign_id=data.campaign_id,
        field="html_content",
        original=original_content,
        updated=new_content,
        action=data.action,
        provider="fallback",
        latency_ms=0,
    )


# ─── TEMPLATES LIST / CREATE ─────────────────────────────────────────────────


@router.get("/templates", response_model=list[EmailTemplateResponse])
async def list_templates(
    workspace_id: str = Query(default="dev-workspace"),
    category: str | None = None,
    email_type: str | None = None,
    search: str | None = None,
    user: str = Depends(get_current_user),
):
    check_rate_limit(f"list:{user}")
    templates = [
        t for t in _templates.values()
        if t["workspaceId"] == workspace_id or t["workspaceId"] == "__system__"
    ]

    if category:
        templates = [t for t in templates if t["category"].lower() == category.lower()]
    if email_type:
        templates = [t for t in templates if t["emailType"].lower() == email_type.lower()]
    if search:
        search_lower = search.lower()
        templates = [
            t for t in templates
            if search_lower in t["name"].lower()
            or search_lower in (t.get("description") or "").lower()
            or search_lower in t["subject"].lower()
        ]

    templates.sort(key=lambda x: (not x.get("isSystem", False), x["createdAt"]), reverse=False)
    return [_to_template_response(t) for t in templates]


@router.post("/templates", response_model=EmailTemplateResponse)
async def create_template(data: EmailTemplateCreateRequest, user: str = Depends(get_current_user)):
    check_rate_limit(f"create:{user}")

    email_type = data.email_type.lower()
    if email_type not in _VALID_EMAIL_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid email_type '{data.email_type}'. Must be one of: {', '.join(sorted(_VALID_EMAIL_TYPES))}",
        )

    category = data.category.lower()
    if category not in _VALID_CATEGORIES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid category '{data.category}'. Must be one of: {', '.join(sorted(_VALID_CATEGORIES))}",
        )

    template_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    template = {
        "id": template_id,
        "workspaceId": data.workspace_id,
        "name": data.name,
        "description": data.description,
        "category": category,
        "emailType": email_type,
        "subject": data.subject,
        "previewText": data.preview_text,
        "htmlContent": data.html_content,
        "markdownContent": data.markdown_content,
        "jsonContent": None,
        "variables": data.variables or [],
        "thumbnailUrl": None,
        "isSystem": False,
        "usageCount": 0,
        "createdAt": now,
        "updatedAt": now,
    }
    _templates[template_id] = template
    return _to_template_response(template)


# ─── TEMPLATES GET / UPDATE / DELETE ─────────────────────────────────────────


@router.get("/templates/{template_id}", response_model=EmailTemplateResponse)
async def get_template(template_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"read:{user}")
    if template_id not in _templates:
        raise HTTPException(status_code=404, detail="Template not found")
    return _to_template_response(_templates[template_id])


@router.put("/templates/{template_id}", response_model=EmailTemplateResponse)
async def update_template(
    template_id: str,
    data: EmailTemplateUpdateRequest,
    user: str = Depends(get_current_user),
):
    check_rate_limit(f"update:{user}")
    if template_id not in _templates:
        raise HTTPException(status_code=404, detail="Template not found")

    template = _templates[template_id]
    if template.get("isSystem"):
        raise HTTPException(status_code=400, detail="Cannot modify a system template")

    now = datetime.now(timezone.utc).isoformat()

    if data.name is not None:
        template["name"] = data.name
    if data.description is not None:
        template["description"] = data.description
    if data.category is not None:
        category = data.category.lower()
        if category not in _VALID_CATEGORIES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid category '{data.category}'. Must be one of: {', '.join(sorted(_VALID_CATEGORIES))}",
            )
        template["category"] = category
    if data.email_type is not None:
        email_type = data.email_type.lower()
        if email_type not in _VALID_EMAIL_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid email_type '{data.email_type}'. Must be one of: {', '.join(sorted(_VALID_EMAIL_TYPES))}",
            )
        template["emailType"] = email_type
    if data.subject is not None:
        template["subject"] = data.subject
    if data.preview_text is not None:
        template["previewText"] = data.preview_text
    if data.html_content is not None:
        template["htmlContent"] = data.html_content
    if data.markdown_content is not None:
        template["markdownContent"] = data.markdown_content
    if data.variables is not None:
        template["variables"] = data.variables

    template["updatedAt"] = now
    return _to_template_response(template)


@router.delete("/templates/{template_id}")
async def delete_template(template_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"delete:{user}")
    if template_id not in _templates:
        raise HTTPException(status_code=404, detail="Template not found")

    template = _templates[template_id]
    if template.get("isSystem"):
        raise HTTPException(status_code=400, detail="Cannot delete a system template")

    del _templates[template_id]
    return {"detail": "Template deleted"}


@router.post("/templates/{template_id}/use", response_model=EmailTemplateResponse)
async def use_template(template_id: str, user: str = Depends(get_current_user)):
    check_rate_limit(f"use:{user}")
    if template_id not in _templates:
        raise HTTPException(status_code=404, detail="Template not found")

    template = _templates[template_id]
    now = datetime.now(timezone.utc).isoformat()
    template["usageCount"] = template.get("usageCount", 0) + 1
    template["updatedAt"] = now
    return _to_template_response(template)
