from fastapi import APIRouter

from app.core.ai import LANDING_PAGE_TEMPLATES

router = APIRouter()


@router.get("/")
async def list_templates():
    return LANDING_PAGE_TEMPLATES


@router.get("/{template_slug}")
async def get_template(template_slug: str):
    for t in LANDING_PAGE_TEMPLATES:
        if t["slug"] == template_slug:
            return t
    from fastapi import HTTPException
    raise HTTPException(status_code=404, detail="Template not found")
