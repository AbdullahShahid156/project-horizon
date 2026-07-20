import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, UploadFile, File

from app.core.security import get_current_user, Depends

router = APIRouter()

_user_store: dict[str, dict] = {
    "dev-user": {
        "id": "dev-user",
        "email": "dev@builderweb.com",
        "firstName": "Dev",
        "lastName": "User",
        "imageUrl": None,
        "timezone": "UTC",
        "language": "en",
        "password": None,
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "updatedAt": datetime.now(timezone.utc).isoformat(),
    }
}


from pydantic import BaseModel


class ProfileUpdateRequest(BaseModel):
    firstName: str | None = None
    lastName: str | None = None
    email: str | None = None
    timezone: str | None = None
    language: str | None = None


class ChangePasswordRequest(BaseModel):
    currentPassword: str
    newPassword: str


@router.get("/me")
async def get_current_user_info(user: str = Depends(get_current_user)):
    uid = user if user != "dev-user" else "dev-user"
    if uid not in _user_store:
        _user_store[uid] = {
            "id": uid,
            "email": "dev@builderweb.com",
            "firstName": "Dev",
            "lastName": "User",
            "imageUrl": None,
            "timezone": "UTC",
            "language": "en",
            "hashed_password": None,
            "createdAt": datetime.now(timezone.utc).isoformat(),
            "updatedAt": datetime.now(timezone.utc).isoformat(),
        }
    u = _user_store[uid]
    return {
        "id": u["id"],
        "email": u["email"],
        "firstName": u.get("firstName"),
        "lastName": u.get("lastName"),
        "imageUrl": u.get("imageUrl"),
        "timezone": u.get("timezone", "UTC"),
        "language": u.get("language", "en"),
        "createdAt": u["createdAt"],
        "updatedAt": u["updatedAt"],
    }


@router.put("/me")
async def update_profile(data: ProfileUpdateRequest, user: str = Depends(get_current_user)):
    uid = user if user != "dev-user" else "dev-user"
    if uid not in _user_store:
        raise HTTPException(status_code=404, detail="User not found")

    u = _user_store[uid]
    if data.firstName is not None:
        u["firstName"] = data.firstName
    if data.lastName is not None:
        u["lastName"] = data.lastName
    if data.email is not None:
        u["email"] = data.email
    if data.timezone is not None:
        u["timezone"] = data.timezone
    if data.language is not None:
        u["language"] = data.language
    u["updatedAt"] = datetime.now(timezone.utc).isoformat()

    return {
        "id": u["id"],
        "email": u["email"],
        "firstName": u.get("firstName"),
        "lastName": u.get("lastName"),
        "imageUrl": u.get("imageUrl"),
        "timezone": u.get("timezone", "UTC"),
        "language": u.get("language", "en"),
        "createdAt": u["createdAt"],
        "updatedAt": u["updatedAt"],
    }


@router.post("/me/change-password")
async def change_password(data: ChangePasswordRequest, user: str = Depends(get_current_user)):
    uid = user if user != "dev-user" else "dev-user"
    if uid not in _user_store:
        raise HTTPException(status_code=404, detail="User not found")

    u = _user_store[uid]
    if u.get("password"):
        if data.currentPassword != u["password"]:
            raise HTTPException(status_code=400, detail="Current password is incorrect")

    u["password"] = data.newPassword
    u["updatedAt"] = datetime.now(timezone.utc).isoformat()
    return {"detail": "Password changed successfully"}


@router.post("/me/avatar")
async def upload_avatar(file: UploadFile = File(...), user: str = Depends(get_current_user)):
    uid = user if user != "dev-user" else "dev-user"
    if uid not in _user_store:
        raise HTTPException(status_code=404, detail="User not found")

    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Max 5MB.")

    u = _user_store[uid]
    u["imageUrl"] = f"data:{file.content_type};base64,avatar-stored"
    u["updatedAt"] = datetime.now(timezone.utc).isoformat()

    return {
        "id": u["id"],
        "email": u["email"],
        "firstName": u.get("firstName"),
        "lastName": u.get("lastName"),
        "imageUrl": u["imageUrl"],
        "timezone": u.get("timezone", "UTC"),
        "language": u.get("language", "en"),
        "createdAt": u["createdAt"],
        "updatedAt": u["updatedAt"],
    }
