from datetime import datetime
from typing import Any

from bson import ObjectId
from fastapi import APIRouter, Depends

from backend.database import get_db
from backend.models.user import UserInDB, UserRole
from backend.routers.deps import get_current_user

router = APIRouter()


async def _username_map(db) -> dict[str, str]:
    users_cursor = db["users"].find({}, {"username": 1})
    mapping: dict[str, str] = {}
    async for user_doc in users_cursor:
        mapping[str(user_doc.get("_id"))] = user_doc.get("username") or "Unknown"
    return mapping


@router.get("/summary")
async def dashboard_summary(user: UserInDB = Depends(get_current_user)) -> dict:
    db = get_db()
    usernames = await _username_map(db)

    files_uploaded = await db["log_imports"].count_documents({})
    reports_generated = await db["validation_reports"].count_documents({})
    scenarios_created = await db["scenario_templates"].count_documents({})
    users_active = await db["users"].count_documents({"is_active": True})
    pending_password_reset_count = await db["password_reset_requests"].count_documents({"status": "pending"})

    recent_files: list[dict[str, Any]] = []
    async for doc in db["log_imports"].find({}).sort("uploaded_at", -1).limit(3):
        user_id = str(doc.get("user_id"))
        recent_files.append(
            {
                "file_id": str(doc.get("file_id")),
                "file_name": (doc.get("file") or {}).get("file_name", "Unknown"),
                "uploaded_at": doc.get("uploaded_at"),
                "username": usernames.get(user_id, "Unknown"),
            }
        )

    recent_activity: list[dict[str, Any]] = []
    async for doc in db["audit_logs"].find({}).sort("timestamp", -1).limit(4):
        user_id = str(doc.get("user_id"))
        meta = doc.get("meta") or {}
        recent_activity.append(
            {
                "audit_id": str(doc.get("_id")),
                "timestamp": doc.get("timestamp"),
                "username": usernames.get(user_id, "Unknown"),
                "action": doc.get("action"),
                "meta": meta,
            }
        )

    pending_resets: list[dict[str, Any]] = []
    async for doc in db["password_reset_requests"].find({"status": "pending"}).sort("created_at", -1).limit(3):
        pending_resets.append(
            {
                "request_id": str(doc.get("_id")),
                "username": doc.get("username"),
                "role": doc.get("role"),
                "created_at": doc.get("created_at"),
            }
        )

    return {
        "data": {
            "stats": {
                "files_uploaded": files_uploaded,
                "reports_generated": reports_generated,
                "scenarios_created": scenarios_created,
                "users_active": users_active,
            },
            "pending_password_resets": pending_resets,
            "pending_password_reset_count": pending_password_reset_count,
            "recent_files": recent_files,
            "recent_activity": recent_activity,
            "is_validator": user.role == UserRole.VALIDATOR,
        }
    }
