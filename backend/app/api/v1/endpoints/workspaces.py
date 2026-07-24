import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from app.core.security import Depends, get_current_user
from app.schemas.workspace import WorkspaceCreateRequest, WorkspaceUpdateRequest

router = APIRouter()

_workspace_store: dict[str, dict] = {}


@router.get("/{workspace_id}")
async def get_workspace(workspace_id: str, user: str = Depends(get_current_user)):
    if workspace_id not in _workspace_store or _workspace_store[workspace_id].get("deleted"):
        raise HTTPException(status_code=404, detail="Workspace not found")
    return _workspace_store[workspace_id]


@router.put("/{workspace_id}")
async def update_workspace(workspace_id: str, data: WorkspaceUpdateRequest, user: str = Depends(get_current_user)):
    if workspace_id not in _workspace_store or _workspace_store[workspace_id].get("deleted"):
        raise HTTPException(status_code=404, detail="Workspace not found")

    ws = _workspace_store[workspace_id]
    if data.name is not None:
        ws["name"] = data.name
        ws["slug"] = data.name.lower().replace(" ", "-").replace(".", "")
    if data.description is not None:
        ws["description"] = data.description
    ws["updatedAt"] = datetime.now(timezone.utc).isoformat()
    return ws


@router.delete("/{workspace_id}")
async def delete_workspace(workspace_id: str, user: str = Depends(get_current_user)):
    if workspace_id not in _workspace_store or _workspace_store[workspace_id].get("deleted"):
        raise HTTPException(status_code=404, detail="Workspace not found")
    _workspace_store[workspace_id]["deleted"] = True
    _workspace_store[workspace_id]["updatedAt"] = datetime.now(timezone.utc).isoformat()
    return {"detail": "Workspace deleted"}


@router.get("/org/{org_id}")
async def list_workspaces_by_org(org_id: str, user: str = Depends(get_current_user)):
    return [
        ws for ws in _workspace_store.values()
        if ws["organizationId"] == org_id and not ws.get("deleted")
    ]


@router.post("/org/{org_id}")
async def create_workspace(org_id: str, data: WorkspaceCreateRequest, user: str = Depends(get_current_user)):
    workspace_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    slug = data.name.lower().replace(" ", "-").replace(".", "")

    ws = {
        "id": workspace_id,
        "organizationId": org_id,
        "name": data.name,
        "slug": slug,
        "description": data.description,
        "createdAt": now,
        "updatedAt": now,
        "deleted": False,
    }
    _workspace_store[workspace_id] = ws
    return ws
