import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from app.core.email import (
    build_acceptance_notification_email,
    build_invitation_email,
    send_email,
)
from app.core.security import Depends, get_current_user
from app.schemas.organization import (
    AcceptInviteRequest,
    MemberInviteRequest,
    MemberRoleUpdateRequest,
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


@router.get("/invitations/{member_id}")
async def get_invitation(member_id: str):
    if member_id not in _membership_store:
        raise HTTPException(status_code=404, detail="Invitation not found")
    m = _membership_store[member_id]
    if m.get("deleted"):
        raise HTTPException(status_code=404, detail="Invitation not found")
    org = _org_store.get(m["organizationId"])
    return {
        "id": m["id"],
        "email": m["email"],
        "role": m["role"],
        "status": m["status"],
        "invitedAt": m.get("invitedAt"),
        "organizationId": m["organizationId"],
        "organizationName": org["name"] if org else "Unknown Organization",
    }


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

    org = _org_store[org_id]
    membership_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    membership = {
        "id": membership_id,
        "userId": f"invited-{data.email}",
        "organizationId": org_id,
        "email": data.email,
        "role": data.role,
        "status": "pending",
        "invitedAt": now,
        "joinedAt": None,
        "deleted": False,
    }
    _membership_store[membership_id] = membership

    accept_url = f"http://localhost:3000/accept-invite/{membership_id}"
    subject, html = build_invitation_email(
        org_name=org["name"],
        invitee_email=data.email,
        sender_name=user,
        accept_url=accept_url,
    )
    email_result = await send_email(to=data.email, subject=subject, html=html)

    return {
        "detail": f"Invitation sent to {data.email}",
        "membership": membership,
        "email_status": email_result.get("status", "unknown"),
    }


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


@router.post("/{org_id}/members/{member_id}/accept")
async def accept_invitation(
    org_id: str, member_id: str, data: AcceptInviteRequest, user: str = Depends(get_current_user)
):
    if org_id not in _org_store or _org_store[org_id].get("deleted"):
        raise HTTPException(status_code=404, detail="Organization not found")
    if member_id not in _membership_store:
        raise HTTPException(status_code=404, detail="Invitation not found")
    m = _membership_store[member_id]
    if m["organizationId"] != org_id:
        raise HTTPException(status_code=404, detail="Invitation not found in this organization")
    if m["status"] != "pending":
        raise HTTPException(status_code=400, detail="Invitation already accepted or declined")
    if m["email"] != data.email:
        raise HTTPException(status_code=403, detail="Only the invited person can accept this invitation")

    m["userId"] = f"user-{data.email}"
    m["status"] = "accepted"
    m["joinedAt"] = datetime.now(timezone.utc).isoformat()

    # Notify inviter
    org = _org_store[org_id]
    subject, html = build_acceptance_notification_email(
        org_name=org["name"],
        invitee_email=data.email,
        inviter_name=user,
    )
    await send_email(to=user, subject=subject, html=html)

    return {"detail": "Invitation accepted", "member": m}


@router.put("/{org_id}/members/{member_id}/role")
async def update_member_role(
    org_id: str, member_id: str, data: MemberRoleUpdateRequest, user: str = Depends(get_current_user)
):
    if org_id not in _org_store or _org_store[org_id].get("deleted"):
        raise HTTPException(status_code=404, detail="Organization not found")
    if member_id not in _membership_store:
        raise HTTPException(status_code=404, detail="Member not found")
    m = _membership_store[member_id]
    if m["organizationId"] != org_id:
        raise HTTPException(status_code=404, detail="Member not found in this organization")
    if m["role"] == "owner":
        raise HTTPException(status_code=400, detail="Cannot change owner role")
    if data.role not in ("admin", "member", "viewer"):
        raise HTTPException(status_code=400, detail="Invalid role")
    m["role"] = data.role
    return {"detail": f"Role updated to {data.role}", "member": m}


@router.get("/{org_id}/stats")
async def org_stats(org_id: str, user: str = Depends(get_current_user)):
    if org_id not in _org_store or _org_store[org_id].get("deleted"):
        raise HTTPException(status_code=404, detail="Organization not found")
    members = [m for m in _membership_store.values() if m["organizationId"] == org_id and not m.get("deleted")]
    return {
        "total_members": len(members),
        "roles": {
            "owner": sum(1 for m in members if m["role"] == "owner"),
            "admin": sum(1 for m in members if m["role"] == "admin"),
            "member": sum(1 for m in members if m["role"] == "member"),
            "viewer": sum(1 for m in members if m["role"] == "viewer"),
        },
    }
