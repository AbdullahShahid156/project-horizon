
from pydantic import BaseModel, Field


class WorkspaceCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None


class WorkspaceUpdateRequest(BaseModel):
    name: str | None = None
    description: str | None = None
