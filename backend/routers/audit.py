
from datetime import datetime, timezone
from typing import Any

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query

from backend.database import get_db
from backend.models.audit_logs import AuditAction, AuditLogInDB, AuditResult
from backend.models.user import UserInDB, UserRole
from backend.routers.deps import get_current_user

router = APIRouter()


async def write_audit(
    *,
    user: UserInDB,
    action: AuditAction,
    result: AuditResult,
    meta: dict[str, Any] | None = None,
) -> None:
    """
    Minimal helper to store an audit log entry.
    - Stores user_id as ObjectId
    - meta can include file_id, file_name, scenario_id,
    """
    db = get_db()

    user_oid = ObjectId(str(user.id)) if ObjectId.is_valid(str(user.id)) else None
    if user_oid is None:
        # should never happen if your users are stored correctly
        raise HTTPException(status_code=500, detail="Invalid user id")

    doc = AuditLogInDB(
        timestamp=datetime.now(timezone.utc),
        user_id=user_oid,
        action=action,
        result=result,
        meta=meta or {},
    )

    await db["audit_logs"].insert_one(doc.model_dump(by_alias=True, exclude={"id"}))


@router.get("")
async def list_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    action: AuditAction | None = Query(None),
    result: AuditResult | None = Query(None),
    user: UserInDB = Depends(get_current_user),
):
    """
    GET /audit
    - validator: all logs
    - engineer: only their logs
    """
    db = get_db()

    q: dict[str, Any] = {}
    if user.role != UserRole.VALIDATOR:
        q["user_id"] = ObjectId(str(user.id))

    if action is not None:
        q["action"] = action
    if result is not None:
        q["result"] = result

    total = await db["audit_logs"].count_documents(q)
    skip = (page - 1) * page_size

    raw_docs: list[dict[str, Any]] = []
    cursor = db["audit_logs"].find(q).sort("timestamp", -1).skip(skip).limit(page_size)
    async for doc in cursor:
        raw_docs.append(doc)

    user_id_set = {
        doc.get("user_id")
        for doc in raw_docs
        if isinstance(doc.get("user_id"), ObjectId)
    }
    usernames_by_id: dict[str, str] = {}
    if user_id_set:
        users_cursor = db["users"].find(
            {"_id": {"$in": list(user_id_set)}},
            {"username": 1},
        )
        async for user_doc in users_cursor:
            usernames_by_id[str(user_doc.get("_id"))] = user_doc.get("username") or "Unknown"

    items: list[dict[str, Any]] = []
    for doc in raw_docs:
        user_id = str(doc.get("user_id"))
        items.append(
            {
                "audit_id": str(doc.get("_id")),
                "timestamp": doc.get("timestamp"),
                "user_id": user_id,
                "username": usernames_by_id.get(user_id, "Unknown"),
                "action": doc.get("action"),
                "result": doc.get("result"),
                "meta": doc.get("meta") or {},
            }
        )

    return {
        "data": items,
        "meta": {"page": page, "page_size": page_size, "total": total},
    }