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
    """Generate template-based email when AI is unavailable."""
    brand = data.brand or "your brand"
    audience = data.audience or "valued customers"
    product = data.product or "our products"
    cta = data.cta or "Learn More"

    subjects = {
        "promotional": f"Don't Miss Out - Special Offer from {brand}!",
        "transactional": f"Your {brand} Order Confirmation",
        "newsletter": f"{brand} Newsletter - What's New This Month",
        "welcome": f"Welcome to {brand} - Let's Get Started!",
        "product-launch": f"Introducing Something New from {brand}",
        "cold-outreach": f"A Quick Question About Your {brand} Strategy",
        "follow-up": f"Following Up from {brand}",
        "announcement": f"Important Update from {brand}",
        "nurture": f"Valuable Insights from {brand}",
        "re-engagement": f"We Miss You at {brand}!",
        "abandoned-cart": f"You Left Something Behind at {brand}!",
        "thank-you": f"Thank You from {brand}!",
        "event-invitation": f"You're Invited - {brand} Event",
        "discount": f"Exclusive Discount from {brand}!",
    }
    previews = {
        "promotional": f"Exclusive deal for {audience} - limited time only",
        "transactional": "We've received your order and are processing it now",
        "newsletter": f"Latest updates, tips, and insights from {brand}",
        "welcome": "We're thrilled to have you on board",
        "product-launch": f"Be the first to experience {product}",
        "cold-outreach": f"Helping {audience} achieve more with {product}",
        "follow-up": "Just checking in on our previous conversation",
        "announcement": f"News about {product} from {brand}",
        "nurture": f"Resources to help you succeed with {product}",
        "re-engagement": f"Come back and see what's new with {product}",
        "abandoned-cart": f"Complete your order for {product} before it's gone",
        "thank-you": "We truly appreciate your support",
        "event-invitation": f"Join us for an exclusive event from {brand}",
        "discount": f"Save big on {product} - limited time only",
    }

    subject = subjects.get(data.email_type, f"Message from {brand}")
    preview = previews.get(data.email_type, f"An important update from {brand}")

    headline = {
        "promotional": f"Special Offer Just for {audience}",
        "transactional": "Order Confirmed",
        "newsletter": f"{brand} Monthly Update",
        "welcome": f"Welcome to the {brand} Family!",
        "product-launch": f"Introducing {product}",
        "cold-outreach": "Let's Start a Conversation",
        "follow-up": "Just Following Up",
        "announcement": f"Big News from {brand}",
        "nurture": "Tips for Your Success",
        "re-engagement": "We'd Love to See You Again",
        "abandoned-cart": "Your Selection Is Waiting",
        "thank-you": f"From the Heart at {brand}",
        "event-invitation": "You're Invited!",
        "discount": "Exclusive Savings Inside",
    }.get(data.email_type, f"Hello from {brand}")

    body_paragraphs = {
        "promotional": [
            f"We're thrilled to offer {audience} an exclusive opportunity to experience {product} at a special price.",
            f"For a limited time, enjoy premium access to everything {brand} has to offer. Our customers consistently report improved efficiency, satisfaction, and results after switching to {product}.",
            f"This offer won't last forever. Take advantage of it today and see why hundreds of {audience} trust {brand} for their needs.",
        ],
        "transactional": [
            f"Thank you for your order with {brand}. We've received your request and our team is already working on it.",
            f"Your order includes access to {product}, which will be activated within the next few minutes. You'll receive a separate email with all the details.",
            "If you have any questions about your order, please don't hesitate to contact our support team. We're here to help.",
        ],
        "newsletter": [
            f"Here are the latest updates from {brand} that we think you'll find valuable.",
            f"We've been busy working on new features and improvements for {product}. Here's what's new this month: enhanced performance, new integrations, and improved user experience.",
            f"We've also published a new guide on getting the most out of {product}. Check it out and let us know what you think!",
        ],
        "welcome": [
            f"Welcome to {brand}! We're absolutely thrilled to have you join our community of {audience} who are transforming their experience with {product}.",
            "Here's what you can expect as a member: personalized recommendations, priority support, exclusive content, and early access to new features.",
            f"Your first step is simple. Log in to your dashboard and explore everything that {brand} has to offer. Our onboarding guide will walk you through each feature.",
        ],
        "product-launch": [
            f"We're excited to announce the launch of {product} - designed specifically for {audience} who demand excellence.",
            "This represents months of development, testing, and refinement based on feedback from our earliest users. The result is a product that truly understands your needs.",
            "Key features include: a streamlined interface, powerful analytics, seamless integrations, and 24/7 support. Everything you need to achieve your goals is built right in.",
        ],
        "cold-outreach": [
            f"I'm reaching out because I believe {brand} can help you achieve your goals more effectively. We specialize in {product} and have helped many {audience} achieve measurable results.",
            "Our clients typically see a 40% improvement in efficiency within the first 90 days. We'd love to show you how.",
            f"Would you be open to a quick 15-minute call to discuss how {brand} might be able to help? No pressure, just a conversation.",
        ],
        "follow-up": [
            f"I wanted to follow up on our previous conversation. We're still very much interested in helping you with {product}.",
            f"I've put together some additional information that I think you'll find valuable. It includes case studies from similar {audience} and a detailed breakdown of our approach.",
            "Let me know if you have any questions or if there's anything else I can help with. I'm here whenever you're ready.",
        ],
        "announcement": [
            f"We have some exciting news to share with you. {brand} is making important updates to {product} that will benefit you directly.",
            "These changes include improved performance, new features based on your feedback, and enhanced security. We've been working on this for months and can't wait for you to try it.",
            "Stay tuned for more details in the coming days. In the meantime, if you have any questions, please don't hesitate to reach out.",
        ],
        "nurture": [
            f"At {brand}, we're committed to your success. That's why we've put together some valuable resources to help you get the most out of {product}.",
            "Here are three tips from our experts: First, start with clear goals in mind. Second, leverage our resources and support. Third, track your progress regularly.",
            f"We're always here to help you succeed. If you need guidance on any aspect of {product}, our team is just a click away.",
        ],
        "re-engagement": [
            f"It's been a while since we've heard from you, and we wanted to reach out. A lot has changed at {brand}, and we think you'll love what's new.",
            f"We've added powerful new features to {product}, improved performance, and introduced new integrations that make everything easier.",
            "Come back and see what's new. We have a special welcome-back offer waiting for you.",
        ],
        "abandoned-cart": [
            "We noticed you left something in your cart. Your selection is still saved, but we can't guarantee it'll stay available for long.",
            f"Your cart includes {product} - a great choice that many {audience} have already benefited from.",
            f"Complete your order today and enjoy {product} delivered right to your door. If you have any questions, our support team is ready to help.",
        ],
        "thank-you": [
            f"We just wanted to take a moment to say thank you. Your support means the world to us at {brand}.",
            f"Because of customers like you, we continue to grow and improve {product}. We're committed to delivering the best experience possible.",
            "If there's anything we can do better, please don't hesitate to reach out. We're always here to listen and improve.",
        ],
        "event-invitation": [
            f"We're thrilled to invite you to our upcoming event. This is an exclusive opportunity to connect with our team and learn about the latest in {product}.",
            "You'll hear from industry experts, see live demos, and have the chance to ask questions. It's the perfect way to stay ahead of the curve.",
            "Spaces are limited, so reserve your spot today. We can't wait to see you there!",
        ],
        "discount": [
            f"We're offering an exclusive discount on {product} just for you. This is a limited-time offer, so don't miss out!",
            f"With this discount, you'll get access to everything {brand} has to offer at a fraction of the regular price. It's our way of saying thank you for being a valued {audience}.",
            f"Use this offer before it expires and start experiencing the difference that {product} can make for you.",
        ],
    }

    features = {
        "promotional": ["Premium quality products", "24/7 customer support", "Money-back guarantee", "Fast delivery"],
        "transactional": ["Secure processing", "Instant confirmation", "Easy returns", "24/7 support"],
        "newsletter": ["Industry insights", "Expert tips", "Product updates", "Community stories"],
        "welcome": ["Personalized dashboard", "Priority support", "Exclusive content", "Early access"],
        "product-launch": ["Streamlined interface", "Powerful analytics", "Seamless integrations", "24/7 support"],
        "cold-outreach": ["Proven results", "Custom solutions", "No long-term contracts", "Free consultation"],
        "follow-up": ["Case studies", "Detailed breakdown", "Expert guidance", "Flexible scheduling"],
        "announcement": ["Improved performance", "New features", "Enhanced security", "Better UX"],
        "nurture": ["Actionable tips", "Expert insights", "Resource library", "Community access"],
        "re-engagement": ["New features", "Better performance", "Welcome-back offer", "Priority support"],
        "abandoned-cart": ["Still available", "Secure checkout", "Free support", "Easy returns"],
        "thank-you": ["Exclusive perks", "Priority support", "Early access", "Community membership"],
        "event-invitation": ["Expert speakers", "Live demos", "Networking", "Q&A sessions"],
        "discount": ["Limited-time offer", "Premium access", "Full features", "No hidden fees"],
    }

    type_features = features.get(data.email_type, ["Quality", "Support", "Value", "Results"])
    feature_html = "".join(
        f'<tr><td style="padding:12px 0;border-bottom:1px solid #eee"><table cellpadding="0" cellspacing="0"><tr>'
        f'<td style="width:36px;height:36px;border-radius:50%;background:#667eea;text-align:center;color:#fff;font-size:16px;vertical-align:middle">{chr(8710 + i)}</td>'
        f'<td style="padding-left:12px;font-size:15px;color:#333">{f}</td></tr></table></td></tr>'
        for i, f in enumerate(type_features)
    )

    paragraphs = body_paragraphs.get(data.email_type, [
        f"We're excited to share this update with you. At {brand}, we're always working to improve {product} for {audience}.",
        "This is just the beginning of something special, and we want you to be part of it.",
        "If you have any questions, please don't hesitate to reach out. We're here to help.",
    ])

    body_html = "".join(
        f'<p style="font-size:16px;line-height:1.7;color:#444;margin:0 0 18px">{p}</p>' for p in paragraphs
    )

    html = f"""<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 20px"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)"><tr><td style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:48px 40px;text-align:center"><h1 style="color:#ffffff;margin:0 0 8px;font-size:30px;font-weight:700">{headline}</h1><p style="color:rgba(255,255,255,0.9);margin:0;font-size:16px">{brand}</p></td></tr><tr><td style="padding:40px 40px 20px"><p style="font-size:16px;line-height:1.7;color:#444;margin:0 0 18px">Hi {audience},</p>{body_html}</td></tr><tr><td style="padding:0 40px 20px"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;border-radius:8px"><tr><td style="padding:24px 28px"><h3 style="margin:0 0 14px;font-size:17px;color:#333">What You Get</h3><table width="100%" cellpadding="0" cellspacing="0">{feature_html}</table></td></tr></table></td></tr><tr><td style="padding:20px 40px 40px;text-align:center"><table cellpadding="0" cellspacing="0" style="margin:0 auto"><tr><td style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:8px;padding:16px 44px"><a href="#" style="color:#ffffff;text-decoration:none;font-size:17px;font-weight:bold;display:inline-block">{cta}</a></td></tr></table></td></tr><tr><td style="padding:24px 40px;background:#f8f9fa;border-top:1px solid #eee"><p style="font-size:13px;color:#999;margin:0;text-align:center">This email was sent by {brand}. If you no longer wish to receive these emails, you can <a href="#" style="color:#667eea">unsubscribe</a>.<br>&copy; 2026 {brand}. All rights reserved.</p></td></tr></table></td></tr></table></body></html>"""

    paragraphs_md = "\n\n".join(paragraphs)
    features_md = "\n".join(f"- {f}" for f in type_features)
    markdown = f"# {headline}\n\nHi {audience},\n\n{paragraphs_md}\n\n## What You Get\n\n{features_md}\n\n**{cta}**\n\n---\n*{brand}. All rights reserved.*"

    return {"subject": subject, "preview_text": preview, "html": html, "markdown": markdown}


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
        "\nIMPORTANT: This must be a COMPLETE, VISUALLY RICH, PROFESSIONAL HTML email. The html_content MUST include:\n"
        "1. A visually striking header/hero section with a colored background gradient or solid color, large bold headline\n"
        "2. 2-4 paragraphs of compelling body content (not just 1-2 sentences)\n"
        "3. A features/benefits section with 3-4 items as styled bullet points or icon rows, each with a short title and description\n"
        "4. A prominent, large call-to-action button (styled as a pill/rounded button with background color, padding, and hover-ready design)\n"
        "5. Social proof section (testimonial quote, star ratings, or trust badges)\n"
        "6. A professional footer with brand name, address, and unsubscribe link\n"
        "7. Full inline CSS styling: responsive table-based layout, email-safe fonts, background colors, padding, borders, rounded corners\n"
        "8. Visual dividers or section separators between content blocks\n"
        "Use colored section backgrounds (#f8f9fa, #e8f4fd, #fff3cd, etc.) to create visual depth.\n"
        "Use icon-like Unicode characters (★, ●, ✦, →) for bullet points and feature markers.\n"
        "The email should look like it was designed by a professional designer, NOT plain text in a table.\n"
        "Total content: 400-700 words. Do NOT generate minimal or stub content.\n\n"
        "Return a JSON object with:\n"
        '- "subject": the email subject line (compelling, under 60 characters)\n'
        '- "preview_text": the preview/preheader text (under 100 characters)\n'
        '- "html_content": the FULL styled HTML email with inline CSS, table layout, colored sections, buttons, and visual hierarchy\n'
        '- "markdown_content": the markdown version of the email text content\n'
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
                    "You are an expert email marketing copywriter and HTML email designer. "
                    "Create visually stunning, high-converting emails with rich HTML and inline CSS. "
                    "Use table-based layout with colored section backgrounds, styled buttons, bullet points with icons, "
                    "testimonial sections, and visual hierarchy. The email should look professionally designed, "
                    "not like plain text. Ensure all HTML is email-client compatible. "
                    "Return only valid JSON without any markdown formatting."
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
