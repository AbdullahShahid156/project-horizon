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

    type_templates = {
        "promotional": {
            "subject": f"Don't Miss Out - Special Offer from {brand}!",
            "preview_text": f"Exclusive deal for {audience} - limited time only",
            "html": f"""<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 20px"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden"><tr><td style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:40px 30px;text-align:center"><h1 style="color:#ffffff;margin:0;font-size:28px">Special Offer from {brand}</h1><p style="color:rgba(255,255,255,0.9);margin:10px 0 0;font-size:16px">Exclusive deal for {audience}</p></td></tr><tr><td style="padding:40px 30px"><p style="font-size:16px;line-height:1.6;color:#333;margin:0 0 20px">Hi {audience},</p><p style="font-size:16px;line-height:1.6;color:#333;margin:0 0 20px">We're excited to share an exclusive offer with you. For a limited time, enjoy special pricing on {product}.</p><p style="font-size:16px;line-height:1.6;color:#333;margin:0 0 30px">This is your chance to experience the quality and value that {brand} is known for.</p><table cellpadding="0" cellspacing="0" style="margin:0 auto"><tr><td style="background:#667eea;border-radius:6px;padding:14px 36px"><a href="#" style="color:#ffffff;text-decoration:none;font-size:16px;font-weight:bold">{cta}</a></td></tr></table></td></tr><tr><td style="padding:20px 30px;background:#f8f9fa;text-align:center"><p style="font-size:13px;color:#999;margin:0">&copy; {brand}. All rights reserved.</p></td></tr></table></td></tr></table></body></html>""",
            "markdown": f"# Special Offer from {brand}\n\nHi {audience},\n\nWe're excited to share an exclusive offer with you. For a limited time, enjoy special pricing on {product}.\n\n**{cta}** to take advantage of this offer.\n\n---\n*{brand} - All rights reserved.*",
        },
        "transactional": {
            "subject": f"Your {brand} Order Confirmation",
            "preview_text": "We've received your order and are processing it now",
            "html": f"""<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 20px"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden"><tr><td style="background:#27ae60;padding:30px;text-align:center"><h1 style="color:#ffffff;margin:0;font-size:24px">Order Confirmed</h1></td></tr><tr><td style="padding:40px 30px"><p style="font-size:16px;line-height:1.6;color:#333;margin:0 0 20px">Hi {audience},</p><p style="font-size:16px;line-height:1.6;color:#333;margin:0 0 20px">Thank you for your order with {brand}. We've received your request and our team is already working on it.</p><p style="font-size:16px;line-height:1.6;color:#333;margin:0 0 20px">You'll receive another email once your order has been processed and shipped.</p><p style="font-size:16px;line-height:1.6;color:#333;margin:0">If you have any questions, please don't hesitate to contact our support team.</p></td></tr><tr><td style="padding:20px 30px;background:#f8f9fa;text-align:center"><p style="font-size:13px;color:#999;margin:0">&copy; {brand}. All rights reserved.</p></td></tr></table></td></tr></table></body></html>""",
            "markdown": f"# Order Confirmed - {brand}\n\nHi {audience},\n\nThank you for your order with {brand}. We've received your request and our team is already working on it.\n\nYou'll receive another email once your order has been processed.\n\n---\n*{brand} - All rights reserved.*",
        },
        "newsletter": {
            "subject": f"{brand} Newsletter - What's New This Month",
            "preview_text": f"Latest updates, tips, and insights from {brand}",
            "html": f"""<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 20px"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden"><tr><td style="background:#3498db;padding:30px;text-align:center"><h1 style="color:#ffffff;margin:0;font-size:24px">{brand} Newsletter</h1><p style="color:rgba(255,255,255,0.9);margin:10px 0 0;font-size:14px">Monthly Updates & Insights</p></td></tr><tr><td style="padding:40px 30px"><h2 style="color:#333;font-size:20px;margin:0 0 15px">What's New</h2><p style="font-size:16px;line-height:1.6;color:#333;margin:0 0 20px">Here are the latest updates from {brand} that we think you'll find valuable.</p><h2 style="color:#333;font-size:20px;margin:0 0 15px">Featured Story</h2><p style="font-size:16px;line-height:1.6;color:#333;margin:0 0 20px">We've been working on exciting new developments in {product} that will help you achieve your goals more effectively.</p><h2 style="color:#333;font-size:20px;margin:0 0 15px">Tips & Resources</h2><p style="font-size:16px;line-height:1.6;color:#333;margin:0 0 30px">Stay tuned for more tips and resources to help you get the most out of {product}.</p><table cellpadding="0" cellspacing="0" style="margin:0 auto"><tr><td style="background:#3498db;border-radius:6px;padding:14px 36px"><a href="#" style="color:#ffffff;text-decoration:none;font-size:16px;font-weight:bold">Read More</a></td></tr></table></td></tr><tr><td style="padding:20px 30px;background:#f8f9fa;text-align:center"><p style="font-size:13px;color:#999;margin:0">&copy; {brand}. All rights reserved.</p></td></tr></table></td></tr></table></body></html>""",
            "markdown": f"# {brand} Newsletter\n\n## What's New\n\nHere are the latest updates from {brand} that we think you'll find valuable.\n\n## Featured Story\n\nWe've been working on exciting new developments in {product}.\n\n## Tips & Resources\n\nStay tuned for more tips and resources.\n\n**Read More**\n\n---\n*{brand} - All rights reserved.*",
        },
        "welcome": {
            "subject": f"Welcome to {brand}!",
            "preview_text": "We're thrilled to have you on board",
            "html": f"""<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 20px"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden"><tr><td style="background:#e74c3c;padding:30px;text-align:center"><h1 style="color:#ffffff;margin:0;font-size:24px">Welcome to {brand}!</h1></td></tr><tr><td style="padding:40px 30px"><p style="font-size:16px;line-height:1.6;color:#333;margin:0 0 20px">Hi {audience},</p><p style="font-size:16px;line-height:1.6;color:#333;margin:0 0 20px">We're thrilled to welcome you to the {brand} community! You've just taken the first step toward discovering what {product} can do for you.</p><p style="font-size:16px;line-height:1.6;color:#333;margin:0 0 20px">Here's what you can expect:</p><ul style="font-size:16px;line-height:1.8;color:#333;margin:0 0 30px"><li>Access to our premium {product}</li><li>Exclusive tips and insights</li><li>Priority customer support</li></ul><table cellpadding="0" cellspacing="0" style="margin:0 auto"><tr><td style="background:#e74c3c;border-radius:6px;padding:14px 36px"><a href="#" style="color:#ffffff;text-decoration:none;font-size:16px;font-weight:bold">{cta}</a></td></tr></table></td></tr><tr><td style="padding:20px 30px;background:#f8f9fa;text-align:center"><p style="font-size:13px;color:#999;margin:0">&copy; {brand}. All rights reserved.</p></td></tr></table></td></tr></table></body></html>""",
            "markdown": f"# Welcome to {brand}!\n\nHi {audience},\n\nWe're thrilled to welcome you to the {brand} community!\n\nHere's what you can expect:\n- Access to our premium {product}\n- Exclusive tips and insights\n- Priority customer support\n\n**{cta}**\n\n---\n*{brand} - All rights reserved.*",
        },
        "product-launch": {
            "subject": f"Introducing Something New from {brand}",
            "preview_text": f"Be the first to experience {product}",
            "html": f"""<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 20px"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden"><tr><td style="background:#9b59b6;padding:40px 30px;text-align:center"><h1 style="color:#ffffff;margin:0;font-size:28px">New from {brand}</h1><p style="color:rgba(255,255,255,0.9);margin:10px 0 0;font-size:16px">Introducing {product}</p></td></tr><tr><td style="padding:40px 30px"><p style="font-size:16px;line-height:1.6;color:#333;margin:0 0 20px">Hi {audience},</p><p style="font-size:16px;line-height:1.6;color:#333;margin:0 0 20px">We're excited to announce the launch of {product} - designed specifically for {audience} who demand excellence.</p><p style="font-size:16px;line-height:1.6;color:#333;margin:0 0 30px">This is just the beginning of something special, and we want you to be among the first to experience it.</p><table cellpadding="0" cellspacing="0" style="margin:0 auto"><tr><td style="background:#9b59b6;border-radius:6px;padding:14px 36px"><a href="#" style="color:#ffffff;text-decoration:none;font-size:16px;font-weight:bold">{cta}</a></td></tr></table></td></tr><tr><td style="padding:20px 30px;background:#f8f9fa;text-align:center"><p style="font-size:13px;color:#999;margin:0">&copy; {brand}. All rights reserved.</p></td></tr></table></td></tr></table></body></html>""",
            "markdown": f"# Introducing {product} from {brand}\n\nHi {audience},\n\nWe're excited to announce the launch of {product}.\n\nDesigned specifically for {audience} who demand excellence.\n\n**{cta}**\n\n---\n*{brand} - All rights reserved.*",
        },
        "cold-outreach": {
            "subject": f"Quick question about your {brand} strategy",
            "preview_text": f"Helping {audience} achieve more with {product}",
            "html": f"""<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 20px"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden"><tr><td style="background:#f39c12;padding:30px;text-align:center"><h1 style="color:#ffffff;margin:0;font-size:24px">Let's Connect</h1></td></tr><tr><td style="padding:40px 30px"><p style="font-size:16px;line-height:1.6;color:#333;margin:0 0 20px">Hi {audience},</p><p style="font-size:16px;line-height:1.6;color:#333;margin:0 0 20px">I'm reaching out because I believe {brand} can help you achieve your goals more effectively.</p><p style="font-size:16px;line-height:1.6;color:#333;margin:0 0 20px">We specialize in {product} and have helped many {audience} achieve measurable results.</p><p style="font-size:16px;line-height:1.6;color:#333;margin:0 0 30px">Would you be open to a quick chat about how we might be able to help?</p><table cellpadding="0" cellspacing="0" style="margin:0 auto"><tr><td style="background:#f39c12;border-radius:6px;padding:14px 36px"><a href="#" style="color:#ffffff;text-decoration:none;font-size:16px;font-weight:bold">{cta}</a></td></tr></table></td></tr><tr><td style="padding:20px 30px;background:#f8f9fa;text-align:center"><p style="font-size:13px;color:#999;margin:0">&copy; {brand}. All rights reserved.</p></td></tr></table></td></tr></table></body></html>""",
            "markdown": f"# Let's Connect\n\nHi {audience},\n\nI'm reaching out because I believe {brand} can help you achieve your goals.\n\nWe specialize in {product} and have helped many {audience} achieve results.\n\nWould you be open to a quick chat?\n\n**{cta}**\n\n---\n*{brand} - All rights reserved.*",
        },
        "follow-up": {
            "subject": f"Following up from {brand}",
            "preview_text": "Just checking in on our previous conversation",
            "html": f"""<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 20px"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden"><tr><td style="background:#1abc9c;padding:30px;text-align:center"><h1 style="color:#ffffff;margin:0;font-size:24px">Following Up</h1></td></tr><tr><td style="padding:40px 30px"><p style="font-size:16px;line-height:1.6;color:#333;margin:0 0 20px">Hi {audience},</p><p style="font-size:16px;line-height:1.6;color:#333;margin:0 0 20px">I wanted to follow up on our previous conversation. We're still very much interested in helping you with {product}.</p><p style="font-size:16px;line-height:1.6;color:#333;margin:0 0 30px">Let me know if you have any questions or if there's anything else I can help with.</p><table cellpadding="0" cellspacing="0" style="margin:0 auto"><tr><td style="background:#1abc9c;border-radius:6px;padding:14px 36px"><a href="#" style="color:#ffffff;text-decoration:none;font-size:16px;font-weight:bold">{cta}</a></td></tr></table></td></tr><tr><td style="padding:20px 30px;background:#f8f9fa;text-align:center"><p style="font-size:13px;color:#999;margin:0">&copy; {brand}. All rights reserved.</p></td></tr></table></td></tr></table></body></html>""",
            "markdown": f"# Following Up\n\nHi {audience},\n\nI wanted to follow up on our previous conversation about {product}.\n\nLet me know if you have any questions.\n\n**{cta}**\n\n---\n*{brand} - All rights reserved.*",
        },
        "announcement": {
            "subject": f"Important Update from {brand}",
            "preview_text": f"News about {product} from {brand}",
            "html": f"""<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 20px"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden"><tr><td style="background:#2c3e50;padding:30px;text-align:center"><h1 style="color:#ffffff;margin:0;font-size:24px">Announcement from {brand}</h1></td></tr><tr><td style="padding:40px 30px"><p style="font-size:16px;line-height:1.6;color:#333;margin:0 0 20px">Hi {audience},</p><p style="font-size:16px;line-height:1.6;color:#333;margin:0 0 20px">We have some exciting news to share with you. {brand} is making important updates to {product} that will benefit you directly.</p><p style="font-size:16px;line-height:1.6;color:#333;margin:0 0 30px">Stay tuned for more details in the coming days.</p><table cellpadding="0" cellspacing="0" style="margin:0 auto"><tr><td style="background:#2c3e50;border-radius:6px;padding:14px 36px"><a href="#" style="color:#ffffff;text-decoration:none;font-size:16px;font-weight:bold">{cta}</a></td></tr></table></td></tr><tr><td style="padding:20px 30px;background:#f8f9fa;text-align:center"><p style="font-size:13px;color:#999;margin:0">&copy; {brand}. All rights reserved.</p></td></tr></table></td></tr></table></body></html>""",
            "markdown": f"# Announcement from {brand}\n\nHi {audience},\n\nWe have exciting news about {product}.\n\nStay tuned for more details.\n\n**{cta}**\n\n---\n*{brand} - All rights reserved.*",
        },
        "nurture": {
            "subject": f"Valuable insights from {brand}",
            "preview_text": f"Resources to help you succeed with {product}",
            "html": f"""<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 20px"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden"><tr><td style="background:#2980b9;padding:30px;text-align:center"><h1 style="color:#ffffff;margin:0;font-size:24px">Your Success Matters</h1></td></tr><tr><td style="padding:40px 30px"><p style="font-size:16px;line-height:1.6;color:#333;margin:0 0 20px">Hi {audience},</p><p style="font-size:16px;line-height:1.6;color:#333;margin:0 0 20px">At {brand}, we're committed to your success. That's why we've put together some valuable resources to help you get the most out of {product}.</p><h3 style="color:#333;margin:0 0 10px">Tips for Success</h3><ul style="font-size:16px;line-height:1.8;color:#333;margin:0 0 30px"><li>Start with clear goals in mind</li><li>Leverage our resources and support</li><li>Track your progress regularly</li></ul><table cellpadding="0" cellspacing="0" style="margin:0 auto"><tr><td style="background:#2980b9;border-radius:6px;padding:14px 36px"><a href="#" style="color:#ffffff;text-decoration:none;font-size:16px;font-weight:bold">{cta}</a></td></tr></table></td></tr><tr><td style="padding:20px 30px;background:#f8f9fa;text-align:center"><p style="font-size:13px;color:#999;margin:0">&copy; {brand}. All rights reserved.</p></td></tr></table></td></tr></table></body></html>""",
            "markdown": f"# Your Success Matters\n\nHi {audience},\n\nAt {brand}, we're committed to your success.\n\n## Tips for Success\n- Start with clear goals in mind\n- Leverage our resources and support\n- Track your progress regularly\n\n**{cta}**\n\n---\n*{brand} - All rights reserved.*",
        },
        "re-engagement": {
            "subject": f"We miss you at {brand}!",
            "preview_text": f"Come back and see what's new with {product}",
            "html": f"""<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 20px"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden"><tr><td style="background:#e67e22;padding:30px;text-align:center"><h1 style="color:#ffffff;margin:0;font-size:24px">We Miss You!</h1></td></tr><tr><td style="padding:40px 30px"><p style="font-size:16px;line-height:1.6;color:#333;margin:0 0 20px">Hi {audience},</p><p style="font-size:16px;line-height:1.6;color:#333;margin:0 0 20px">It's been a while since we've heard from you, and we wanted to reach out. A lot has changed at {brand}, and we think you'll love what's new.</p><p style="font-size:16px;line-height:1.6;color:#333;margin:0 0 30px">Come back and see what's new with {product}. We have some exciting updates waiting for you.</p><table cellpadding="0" cellspacing="0" style="margin:0 auto"><tr><td style="background:#e67e22;border-radius:6px;padding:14px 36px"><a href="#" style="color:#ffffff;text-decoration:none;font-size:16px;font-weight:bold">{cta}</a></td></tr></table></td></tr><tr><td style="padding:20px 30px;background:#f8f9fa;text-align:center"><p style="font-size:13px;color:#999;margin:0">&copy; {brand}. All rights reserved.</p></td></tr></table></td></tr></table></body></html>""",
            "markdown": f"# We Miss You!\n\nHi {audience},\n\nIt's been a while since we've heard from you.\n\nCome back and see what's new with {product}.\n\n**{cta}**\n\n---\n*{brand} - All rights reserved.*",
        },
        "abandoned-cart": {
            "subject": f"You left something behind at {brand}!",
            "preview_text": f"Complete your order for {product} before it's gone",
            "html": f"""<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 20px"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden"><tr><td style="background:#e74c3c;padding:30px;text-align:center"><h1 style="color:#ffffff;margin:0;font-size:24px">Don't Forget!</h1></td></tr><tr><td style="padding:40px 30px"><p style="font-size:16px;line-height:1.6;color:#333;margin:0 0 20px">Hi {audience},</p><p style="font-size:16px;line-height:1.6;color:#333;margin:0 0 20px">We noticed you left something in your cart. Your selection is still saved, but we can't guarantee it'll stay available for long.</p><p style="font-size:16px;line-height:1.6;color:#333;margin:0 0 30px">Complete your order today and enjoy {product} delivered right to your door.</p><table cellpadding="0" cellspacing="0" style="margin:0 auto"><tr><td style="background:#e74c3c;border-radius:6px;padding:14px 36px"><a href="#" style="color:#ffffff;text-decoration:none;font-size:16px;font-weight:bold">{cta}</a></td></tr></table></td></tr><tr><td style="padding:20px 30px;background:#f8f9fa;text-align:center"><p style="font-size:13px;color:#999;margin:0">&copy; {brand}. All rights reserved.</p></td></tr></table></td></tr></table></body></html>""",
            "markdown": f"# Don't Forget!\n\nHi {audience},\n\nWe noticed you left something in your cart. Your selection is still saved.\n\nComplete your order today.\n\n**{cta}**\n\n---\n*{brand} - All rights reserved.*",
        },
        "thank-you": {
            "subject": f"Thank You from {brand}!",
            "preview_text": "We appreciate your support",
            "html": f"""<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 20px"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden"><tr><td style="background:#27ae60;padding:40px 30px;text-align:center"><h1 style="color:#ffffff;margin:0;font-size:28px">Thank You!</h1></td></tr><tr><td style="padding:40px 30px"><p style="font-size:16px;line-height:1.6;color:#333;margin:0 0 20px">Hi {audience},</p><p style="font-size:16px;line-height:1.6;color:#333;margin:0 0 20px">We just wanted to take a moment to say thank you. Your support means the world to us.</p><p style="font-size:16px;line-height:1.6;color:#333;margin:0 0 20px">Because of customers like you, {brand} continues to grow and improve. We're committed to delivering the best {product} experience possible.</p><p style="font-size:16px;line-height:1.6;color:#333;margin:0 0 30px">If there's anything we can do better, please don't hesitate to reach out. We're always here to help.</p><table cellpadding="0" cellspacing="0" style="margin:0 auto"><tr><td style="background:#27ae60;border-radius:6px;padding:14px 36px"><a href="#" style="color:#ffffff;text-decoration:none;font-size:16px;font-weight:bold">{cta}</a></td></tr></table></td></tr><tr><td style="padding:20px 30px;background:#f8f9fa;text-align:center"><p style="font-size:13px;color:#999;margin:0">&copy; {brand}. All rights reserved.</p></td></tr></table></td></tr></table></body></html>""",
            "markdown": f"# Thank You!\n\nHi {audience},\n\nWe just wanted to take a moment to say thank you. Your support means the world to us.\n\nBecause of customers like you, {brand} continues to grow.\n\n**{cta}**\n\n---\n*{brand} - All rights reserved.*",
        },
        "event-invitation": {
            "subject": f"You're Invited - {brand} Event",
            "preview_text": f"Join us for an exclusive event from {brand}",
            "html": f"""<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 20px"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden"><tr><td style="background:#8e44ad;padding:40px 30px;text-align:center"><h1 style="color:#ffffff;margin:0;font-size:28px">You're Invited!</h1><p style="color:rgba(255,255,255,0.9);margin:10px 0 0;font-size:16px">Exclusive Event from {brand}</p></td></tr><tr><td style="padding:40px 30px"><p style="font-size:16px;line-height:1.6;color:#333;margin:0 0 20px">Hi {audience},</p><p style="font-size:16px;line-height:1.6;color:#333;margin:0 0 20px">We're thrilled to invite you to our upcoming event. This is an exclusive opportunity to connect with our team and learn about the latest in {product}.</p><p style="font-size:16px;line-height:1.6;color:#333;margin:0 0 30px">Spaces are limited, so reserve your spot today!</p><table cellpadding="0" cellspacing="0" style="margin:0 auto"><tr><td style="background:#8e44ad;border-radius:6px;padding:14px 36px"><a href="#" style="color:#ffffff;text-decoration:none;font-size:16px;font-weight:bold">{cta}</a></td></tr></table></td></tr><tr><td style="padding:20px 30px;background:#f8f9fa;text-align:center"><p style="font-size:13px;color:#999;margin:0">&copy; {brand}. All rights reserved.</p></td></tr></table></td></tr></table></body></html>""",
            "markdown": f"# You're Invited!\n\nHi {audience},\n\nWe're thrilled to invite you to our upcoming event.\n\nLearn about the latest in {product}.\n\nSpaces are limited!\n\n**{cta}**\n\n---\n*{brand} - All rights reserved.*",
        },
        "discount": {
            "subject": f"Exclusive Discount from {brand}!",
            "preview_text": f"Save big on {product} - limited time only",
            "html": f"""<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 20px"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden"><tr><td style="background:#f39c12;padding:40px 30px;text-align:center"><h1 style="color:#ffffff;margin:0;font-size:36px">SAVE NOW</h1><p style="color:rgba(255,255,255,0.9);margin:10px 0 0;font-size:18px">Exclusive Discount from {brand}</p></td></tr><tr><td style="padding:40px 30px;text-align:center"><p style="font-size:16px;line-height:1.6;color:#333;margin:0 0 20px">Hi {audience},</p><p style="font-size:16px;line-height:1.6;color:#333;margin:0 0 20px">We're offering an exclusive discount on {product} just for you. This is a limited-time offer, so don't miss out!</p><p style="font-size:20px;font-weight:bold;color:#f39c12;margin:0 0 30px">Use this offer before it expires</p><table cellpadding="0" cellspacing="0" style="margin:0 auto"><tr><td style="background:#f39c12;border-radius:6px;padding:14px 36px"><a href="#" style="color:#ffffff;text-decoration:none;font-size:16px;font-weight:bold">{cta}</a></td></tr></table></td></tr><tr><td style="padding:20px 30px;background:#f8f9fa;text-align:center"><p style="font-size:13px;color:#999;margin:0">&copy; {brand}. All rights reserved.</p></td></tr></table></td></tr></table></body></html>""",
            "markdown": f"# Exclusive Discount from {brand}!\n\nHi {audience},\n\nWe're offering an exclusive discount on {product} just for you.\n\nThis is a limited-time offer!\n\n**{cta}**\n\n---\n*{brand} - All rights reserved.*",
        },
    }

    template = type_templates.get(data.email_type, type_templates["promotional"])
    return template


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
        "promotional": "Create an urgency-driven promotional email with clear product benefits and a strong CTA. Use persuasive language and highlight discounts or offers.",
        "transactional": "Create a clear, concise transactional email (receipt, confirmation, notification). Keep it informative and professional.",
        "newsletter": "Create an informative newsletter with engaging sections, valuable content, and a clean layout. Balance information with readability.",
        "welcome": "Create a warm, welcoming email for new subscribers or users. Be friendly, set expectations, and guide next steps.",
        "product-launch": "Create an exciting product launch email that builds anticipation. Highlight key features, benefits, and include a strong launch CTA.",
        "cold-outreach": "Create a professional cold outreach email that personalizes the message, demonstrates value, and includes a low-friction CTA.",
        "follow-up": "Create a thoughtful follow-up email that adds value and gently nudges the recipient toward action.",
        "announcement": "Create a clear announcement email with the key news upfront, supporting details, and a clear next step.",
        "nurture": "Create a nurturing email that builds relationship and trust. Provide value through content, insights, or resources.",
        "re-engagement": "Create a re-engagement email that reminds the recipient of your value proposition and offers an incentive to return.",
    }
    tip = type_tips.get(data.email_type, "Create a professional, engaging email with clear structure.")
    prompt_parts.append(f"Email best practices: {tip}")

    prompt_parts.append(
        "\nReturn a JSON object with:\n"
        '- "subject": the email subject line (compelling, under 60 characters)\n'
        '- "preview_text": the preview/preheader text (under 100 characters)\n'
        '- "html_content": the full HTML email body with inline CSS styles (responsive, clean design)\n'
        '- "markdown_content": the markdown version of the email content\n'
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
                    "You are an expert email marketing copywriter. "
                    "Create high-converting, professional emails with clean HTML and inline CSS. "
                    "Ensure all HTML is responsive and uses table-based layout for email client compatibility. "
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

    try:
        prompt = (
            f"Email Type: {campaign['emailType']}\n"
            f"Subject: {campaign['subject']}\n"
            f"Brand: {campaign.get('brand') or 'Not specified'}\n"
            f"Audience: {campaign.get('audience') or 'Not specified'}\n"
            f"Tone: {campaign.get('tone') or 'Professional'}\n"
            f"Action: {action_text}\n\n"
            f"Current email content:\n{original_content}\n\n"
        )
        if data.context:
            prompt += f"Additional context: {data.context}\n\n"
        prompt += (
            "Return a JSON object with:\n"
            '- "subject": the updated subject line\n'
            '- "preview_text": the updated preview text\n'
            '- "html_content": the updated HTML email body with inline CSS\n'
            '- "markdown_content": the updated markdown version\n'
        )

        response = await engine.generate_json(
            prompt=prompt,
            system_instruction=(
                "You are an expert email marketing copywriter. "
                "Modify the email according to the requested action while keeping it professional and high-converting. "
                "Maintain responsive HTML with table-based layout and inline CSS. "
                "Return only valid JSON without any markdown formatting."
            ),
            operation=f"email_ai_{data.action}",
            user_id=user,
        )

        json_data = response.json_data or {} if response.success else {}
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
            "provider": response.provider or "none",
            "latencyMs": round(response.latency_ms or 0, 2),
            "createdAt": now,
        }
        _history.setdefault(data.campaign_id, []).append(history_entry)

        return EmailAIResponse(
            campaign_id=data.campaign_id,
            field="html_content",
            original=original_content[:500],
            updated=new_content[:500],
            action=data.action,
            provider=response.provider or "none",
            latency_ms=round(response.latency_ms or 0, 2),
        )
    except HTTPException:
        raise
    except Exception:
        return EmailAIResponse(
            campaign_id=data.campaign_id,
            field="html_content",
            original=original_content[:500],
            updated=original_content[:500],
            action=data.action,
            provider="none",
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
    data: EmailTemplateCreateRequest,
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
