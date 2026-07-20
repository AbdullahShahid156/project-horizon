import uuid
from datetime import datetime, timezone

from pydantic import BaseModel, Field


class OrganizationCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=255)


class OrganizationUpdateRequest(BaseModel):
    name: str | None = None
    logo_url: str | None = None
    plan: str | None = None


class MemberInviteRequest(BaseModel):
    email: str
    role: str = "member"


class MemberRoleUpdateRequest(BaseModel):
    role: str
