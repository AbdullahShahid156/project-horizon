from typing import Any, Optional

from pydantic import BaseModel, Field


class WebsitePromptRequest(BaseModel):
    business_name: str
    business_description: str
    industry: str
    target_audience: str
    country: str
    language: str
    services: list[str]
    products: list[str] = []
    business_goals: str
    brand_personality: str
    brand_voice: str
    primary_color: str
    secondary_color: str
    typography_preference: str
    call_to_action: str
    competitors: list[str] = []
    website_style: str
    preferred_sections: list[str]


class WebsiteGenerateRequest(BaseModel):
    project_id: str
    name: str
    prompt: WebsitePromptRequest


class WebsiteUpdateRequest(BaseModel):
    content: dict[str, Any]
    change_summary: Optional[str] = None


class WebsiteRestoreRequest(BaseModel):
    version_number: int


class ProjectCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    workspace_id: str
    description: Optional[str] = None


class ProjectUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
