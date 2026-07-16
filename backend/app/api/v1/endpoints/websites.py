import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from app.schemas.website import WebsiteUpdateRequest, WebsiteRestoreRequest

router = APIRouter()

_websites: dict[str, dict] = {}
_versions: dict[str, list[dict]] = {}


@router.get("/project/{project_id}")
async def list_websites(project_id: str):
    return [w for w in _websites.values() if w["projectId"] == project_id]


@router.get("/{website_id}")
async def get_website(website_id: str):
    if website_id not in _websites:
        raise HTTPException(status_code=404, detail="Website not found")
    return _websites[website_id]


@router.put("/{website_id}")
async def update_website(website_id: str, request: WebsiteUpdateRequest):
    if website_id not in _websites:
        raise HTTPException(status_code=404, detail="Website not found")

    website = _websites[website_id]
    website["aiResponse"] = request.content
    website["updatedAt"] = datetime.now(timezone.utc).isoformat()

    new_version = website["currentVersion"] + 1
    website["currentVersion"] = new_version

    version_entry = {
        "id": str(uuid.uuid4()),
        "websiteId": website_id,
        "versionNumber": new_version,
        "content": request.content,
        "changeSummary": request.change_summary,
        "isAutoSave": False,
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }

    if website_id not in _versions:
        _versions[website_id] = []
    _versions[website_id].append(version_entry)

    return website


@router.get("/{website_id}/versions")
async def list_versions(website_id: str):
    return _versions.get(website_id, [])


@router.post("/{website_id}/versions")
async def create_version(website_id: str, request: WebsiteUpdateRequest):
    if website_id not in _websites:
        raise HTTPException(status_code=404, detail="Website not found")

    website = _websites[website_id]
    website["aiResponse"] = request.content
    website["updatedAt"] = datetime.now(timezone.utc).isoformat()

    new_version = website["currentVersion"] + 1
    website["currentVersion"] = new_version

    version_entry = {
        "id": str(uuid.uuid4()),
        "websiteId": website_id,
        "versionNumber": new_version,
        "content": request.content,
        "changeSummary": request.change_summary,
        "isAutoSave": False,
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }

    if website_id not in _versions:
        _versions[website_id] = []
    _versions[website_id].append(version_entry)

    return version_entry


@router.post("/{website_id}/auto-save")
async def auto_save(website_id: str, request: WebsiteUpdateRequest):
    if website_id not in _websites:
        raise HTTPException(status_code=404, detail="Website not found")

    website = _websites[website_id]
    website["aiResponse"] = request.content
    website["updatedAt"] = datetime.now(timezone.utc).isoformat()

    version_entry = {
        "id": str(uuid.uuid4()),
        "websiteId": website_id,
        "versionNumber": website["currentVersion"],
        "content": request.content,
        "changeSummary": "Auto-save",
        "isAutoSave": True,
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }

    if website_id not in _versions:
        _versions[website_id] = []
    _versions[website_id].append(version_entry)

    return {"status": "saved"}


@router.post("/{website_id}/restore")
async def restore_version(website_id: str, request: WebsiteRestoreRequest):
    if website_id not in _websites:
        raise HTTPException(status_code=404, detail="Website not found")

    versions = _versions.get(website_id, [])
    target = None
    for v in versions:
        if v["versionNumber"] == request.version_number:
            target = v
            break

    if not target:
        raise HTTPException(status_code=404, detail="Version not found")

    website = _websites[website_id]
    website["aiResponse"] = target["content"]
    website["updatedAt"] = datetime.now(timezone.utc).isoformat()

    new_version = website["currentVersion"] + 1
    website["currentVersion"] = new_version

    restore_entry = {
        "id": str(uuid.uuid4()),
        "websiteId": website_id,
        "versionNumber": new_version,
        "content": target["content"],
        "changeSummary": f"Restored from version {request.version_number}",
        "isAutoSave": False,
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }
    _versions[website_id].append(restore_entry)

    return website
