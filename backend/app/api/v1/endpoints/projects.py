import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from app.schemas.website import ProjectCreateRequest, ProjectUpdateRequest

router = APIRouter()

_projects: dict[str, dict] = {}


@router.get("/")
async def list_projects():
    return list(_projects.values())


@router.post("/")
async def create_project(request: ProjectCreateRequest):
    project_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    slug = request.name.lower().replace(" ", "-").replace(".", "")

    project = {
        "id": project_id,
        "workspaceId": request.workspace_id,
        "name": request.name,
        "slug": slug,
        "description": request.description,
        "status": "draft",
        "createdAt": now,
        "updatedAt": now,
        "websites": [],
    }
    _projects[project_id] = project
    return project


@router.get("/{project_id}")
async def get_project(project_id: str):
    if project_id not in _projects:
        raise HTTPException(status_code=404, detail="Project not found")
    return _projects[project_id]


@router.put("/{project_id}")
async def update_project(project_id: str, request: ProjectUpdateRequest):
    if project_id not in _projects:
        raise HTTPException(status_code=404, detail="Project not found")

    project = _projects[project_id]
    if request.name is not None:
        project["name"] = request.name
        project["slug"] = request.name.lower().replace(" ", "-").replace(".", "")
    if request.description is not None:
        project["description"] = request.description
    if request.status is not None:
        project["status"] = request.status
    project["updatedAt"] = datetime.now(timezone.utc).isoformat()
    return project


@router.delete("/{project_id}")
async def delete_project(project_id: str):
    if project_id not in _projects:
        raise HTTPException(status_code=404, detail="Project not found")
    del _projects[project_id]
    return {"detail": "Project deleted"}


@router.post("/{project_id}/duplicate")
async def duplicate_project(project_id: str):
    if project_id not in _projects:
        raise HTTPException(status_code=404, detail="Project not found")

    original = _projects[project_id]
    new_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    duplicate = {
        **original,
        "id": new_id,
        "name": f"{original['name']} (Copy)",
        "slug": f"{original['slug']}-copy",
        "status": "draft",
        "createdAt": now,
        "updatedAt": now,
        "websites": [],
    }
    _projects[new_id] = duplicate
    return duplicate
