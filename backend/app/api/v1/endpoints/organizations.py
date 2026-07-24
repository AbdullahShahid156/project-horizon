import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from app.core.security import Depends, get_current_user
from app.schemas.organization import (
    MemberInviteRequest,
    OrganizationCreateRequest,
    OrganizationUpdateRequest,
)

router = APIRouter()

_org_store: dict[str, dict] = {}
_membership_store: dict[str, dict] = {}

_dev_user_id = "dev-user"


@router.get("/")
async def list_organizations(user: str = Depends(get_current_user)):
    uid = user if user != "dev-user" else _dev_user_id
    org_ids = set()
    for m in _membership_store.values():
        if m["userId"] == uid and not m.get("deleted"):
            org_ids.add(m["organizationId"])
    result = []
    for oid in org_ids:
        if oid in _org_store and not _org_store[oid].get("deleted"):
            result.append(_org_store[oid])
    for org in _org_store.values():
        if org["ownerId"] == uid and org["id"] not in org_ids and not org.get("deleted"):
            result.append(org)
    return result


@router.post("/")
async def create_organization(data: OrganizationCreateRequest, user: str = Depends(get_current_user)):
    uid = user if user != "dev-user" else _dev_user_id
    org_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    org = {
        "id": org_id,
        "name": data.name,
        "slug": data.slug,
        "logoUrl": None,
        "plan": "free",
        "ownerId": uid,
        "createdAt": now,
        "updatedAt": now,
        "deleted": False,
    }
    _org_store[org_id] = org

    membership_id = str(uuid.uuid4())
    _membership_store[membership_id] = {
        "id": membership_id,
        "userId": uid,
        "organizationId": org_id,
        "role": "owner",
        "joinedAt": now,
        "deleted": False,
    }

    return org


@router.get("/{org_id}")
async def get_organization(org_id: str, user: str = Depends(get_current_user)):
    if org_id not in _org_store or _org_store[org_id].get("deleted"):
        raise HTTPException(status_code=404, detail="Organization not found")
    return _org_store[org_id]


@router.put("/{org_id}")
async def update_organization(org_id: str, data: OrganizationUpdateRequest, user: str = Depends(get_current_user)):
    if org_id not in _org_store or _org_store[org_id].get("deleted"):
        raise HTTPException(status_code=404, detail="Organization not found")

    org = _org_store[org_id]
    if data.name is not None:
        org["name"] = data.name
    if data.logo_url is not None:
        org["logoUrl"] = data.logo_url
    if data.plan is not None:
        org["plan"] = data.plan
    org["updatedAt"] = datetime.now(timezone.utc).isoformat()
    return org


@router.delete("/{org_id}")
async def delete_organization(org_id: str, user: str = Depends(get_current_user)):
    if org_id not in _org_store or _org_store[org_id].get("deleted"):
        raise HTTPException(status_code=404, detail="Organization not found")
    _org_store[org_id]["deleted"] = True
    _org_store[org_id]["updatedAt"] = datetime.now(timezone.utc).isoformat()
    return {"detail": "Organization deleted"}


@router.get("/{org_id}/members")
async def list_members(org_id: str, user: str = Depends(get_current_user)):
    if org_id not in _org_store or _org_store[org_id].get("deleted"):
        raise HTTPException(status_code=404, detail="Organization not found")
    return [
        m for m in _membership_store.values()
        if m["organizationId"] == org_id and not m.get("deleted")
    ]


@router.post("/{org_id}/invite")
async def invite_member(org_id: str, data: MemberInviteRequest, user: str = Depends(get_current_user)):
    if org_id not in _org_store or _org_store[org_id].get("deleted"):
        raise HTTPException(status_code=404, detail="Organization not found")

    for m in _membership_store.values():
        if m["organizationId"] == org_id and m.get("email") == data.email and not m.get("deleted"):
            raise HTTPException(status_code=400, detail="Member already invited")

    membership_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    membership = {
        "id": membership_id,
        "userId": f"invited-{data.email}",
        "organizationId": org_id,
        "email": data.email,
        "role": data.role,
        "joinedAt": now,
        "deleted": False,
    }
    _membership_store[membership_id] = membership
    return {"detail": f"Invitation sent to {data.email}"}


@router.delete("/{org_id}/members/{member_id}")
async def remove_member(org_id: str, member_id: str, user: str = Depends(get_current_user)):
    if org_id not in _org_store or _org_store[org_id].get("deleted"):
        raise HTTPException(status_code=404, detail="Organization not found")
    if member_id not in _membership_store:
        raise HTTPException(status_code=404, detail="Member not found")
    m = _membership_store[member_id]
    if m["organizationId"] != org_id:
        raise HTTPException(status_code=404, detail="Member not found in this organization")
    if m["role"] == "owner":
        raise HTTPException(status_code=400, detail="Cannot remove the owner")
    m["deleted"] = True
    return {"detail": "Member removed"}
