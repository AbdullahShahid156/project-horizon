import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from app.engine import get_ai_engine
from app.schemas.website import WebsiteGenerateRequest

router = APIRouter()

_websites_store: dict[str, dict] = {}


@router.post("/generate-website")
async def generate_website(request: WebsiteGenerateRequest):
    try:
        engine = get_ai_engine()

        prompt_text = engine.render_prompt(
            "website_generation",
            "website",
            business_name=request.prompt.business_name,
            business_description=request.prompt.business_description,
            industry=request.prompt.industry,
            target_audience=request.prompt.target_audience,
            country=request.prompt.country,
            language=request.prompt.language,
            services=", ".join(request.prompt.services),
            products=", ".join(request.prompt.products) if request.prompt.products else "None",
            business_goals=request.prompt.business_goals,
            brand_personality=request.prompt.brand_personality,
            brand_voice=request.prompt.brand_voice,
            primary_color=request.prompt.primary_color,
            secondary_color=request.prompt.secondary_color,
            typography=request.prompt.typography_preference,
            call_to_action=request.prompt.call_to_action,
            competitors=", ".join(request.prompt.competitors) if request.prompt.competitors else "None specified",
            website_style=request.prompt.website_style,
            preferred_sections=", ".join(request.prompt.preferred_sections),
        )

        ai_response = await engine.generate_json(
            prompt_text,
            operation="website_generation",
        )

        website_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        slug = request.name.lower().replace(" ", "-").replace(".", "")

        website = {
            "id": website_id,
            "projectId": request.project_id,
            "name": request.name,
            "slug": slug,
            "status": "draft",
            "currentVersion": 1,
            "generationPrompt": request.prompt.model_dump(),
            "aiResponse": (ai_response.json_data or ai_response.text) if ai_response.success else {},
            "createdAt": now,
            "updatedAt": now,
        }

        _websites_store[website_id] = website

        return website

    except HTTPException:
        raise
    except Exception:
        website_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        slug = request.name.lower().replace(" ", "-").replace(".", "")
        website = {
            "id": website_id, "projectId": request.project_id, "name": request.name,
            "slug": slug, "status": "draft", "currentVersion": 1,
            "generationPrompt": request.prompt.model_dump(), "aiResponse": {},
            "createdAt": now, "updatedAt": now,
        }
        _websites_store[website_id] = website
        return website


@router.post("/generate-website-preview")
async def generate_website_preview(request: WebsiteGenerateRequest):
    try:
        engine = get_ai_engine()

        prompt_text = engine.render_prompt(
            "website_generation",
            "website",
            business_name=request.prompt.business_name,
            business_description=request.prompt.business_description,
            industry=request.prompt.industry,
            target_audience=request.prompt.target_audience,
            country=request.prompt.country,
            language=request.prompt.language,
            services=", ".join(request.prompt.services),
            products=", ".join(request.prompt.products) if request.prompt.products else "None",
            business_goals=request.prompt.business_goals,
            brand_personality=request.prompt.brand_personality,
            brand_voice=request.prompt.brand_voice,
            primary_color=request.prompt.primary_color,
            secondary_color=request.prompt.secondary_color,
            typography=request.prompt.typography_preference,
            call_to_action=request.prompt.call_to_action,
            competitors=", ".join(request.prompt.competitors) if request.prompt.competitors else "None specified",
            website_style=request.prompt.website_style,
            preferred_sections=", ".join(request.prompt.preferred_sections),
        )

        ai_response = await engine.generate_json(
            prompt_text,
            operation="website_generation_preview",
        )

        return {"preview": (ai_response.json_data or ai_response.text) if ai_response.success else {}}

    except HTTPException:
        raise
    except Exception:
        return {"preview": {}}
