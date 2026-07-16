from typing import Any, Optional

from pydantic import BaseModel


class LandingPagePromptRequest(BaseModel):
    project_id: str
    business_name: str
    product_name: str
    description: str
    industry: str
    target_audience: str
    primary_goal: str
    brand_voice: str
    language: str
    country: str
    primary_cta: str
    secondary_cta: str
    color_palette: dict[str, str]
    typography: str
    sections_required: list[str]


class LandingPageGenerateRequest(BaseModel):
    project_id: str
    name: str
    prompt: LandingPagePromptRequest


class LandingPageUpdateRequest(BaseModel):
    content: dict[str, Any]
    change_summary: Optional[str] = None


class LandingPageRestoreRequest(BaseModel):
    version_number: int


class CopyImproveRequest(BaseModel):
    text: str
    action: str
    tone: Optional[str] = None
    context: Optional[str] = None


class CopyImproveResponse(BaseModel):
    original: str
    improved: str


class LandingPageCreateRequest(BaseModel):
    project_id: str
    name: str
    prompt: Optional[dict[str, Any]] = None
    content: Optional[dict[str, Any]] = None
    seo: Optional[dict[str, Any]] = None
