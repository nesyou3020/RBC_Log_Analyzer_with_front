from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from backend.database import get_db
from backend.models.user import UserPublic, UserRole, CreateUserRequest, UpdateUserRoleRequest, UpdateUserActiveRequest
from backend.routers.deps import require_role

router = APIRouter()




def _oid(user_id: str) -> ObjectId:
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user_id")
    return ObjectId(user_id)


@router.get("", dependencies=[Depends(require_role(UserRole.VALIDATOR))])
async def list_users():
    db = get_db()
    items: list[dict] = []
    async for doc in db["users"].find({}).sort("created_at", -1):
        items.append(
            UserPublic(
                user_id=str(doc["_id"]),
                username=doc["username"],
                role=doc["role"],
                is_active=doc.get("is_active", True),
                created_at=doc["created_at"],
                last_login=doc.get("last_login"),
            ).model_dump()
        )
    return {"data": items}


@router.post("", dependencies=[Depends(require_role(UserRole.VALIDATOR))])
async def create_user(payload: CreateUserRequest):
    db = get_db()

    exists = await db["users"].find_one({"username": payload.username})
    if exists:
        raise HTTPException(status_code=409, detail="Username already exists")

    doc = {
        "username": payload.username,
        "password_hash": payload.password,  # SIMPLE (plaintext)
        "role": payload.role,
        "is_active": True,
        "created_at": datetime.now(timezone.utc),
        "last_login": None,
    }
    res = await db["users"].insert_one(doc)
    return {"data": {"user_id": str(res.inserted_id)}}


@router.patch("/{user_id}/role", dependencies=[Depends(require_role(UserRole.VALIDATOR))])
async def change_role(user_id: str, payload: UpdateUserRoleRequest):
    db = get_db()
    oid = _oid(user_id)

    if payload.role != UserRole.VALIDATOR:
        validators = await db["users"].count_documents({"role": UserRole.VALIDATOR, "is_active": True})
        target = await db["users"].find_one({"_id": oid})
        if target and target.get("role") == UserRole.VALIDATOR and validators <= 1:
            raise HTTPException(status_code=400, detail="Cannot remove role from the last active validator")

    res = await db["users"].update_one({"_id": oid}, {"$set": {"role": payload.role}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    return {"data": {"message": "Role updated"}}


@router.patch("/{user_id}/active", dependencies=[Depends(require_role(UserRole.VALIDATOR))])
async def set_active(user_id: str, payload: UpdateUserActiveRequest):
    db = get_db()
    oid = _oid(user_id)

    # safety: don't disable last validator
    if payload.is_active is False:
        validators = await db["users"].count_documents({"role": UserRole.VALIDATOR, "is_active": True})
        target = await db["users"].find_one({"_id": oid})
        if target and target.get("role") == UserRole.VALIDATOR and validators <= 1:
            raise HTTPException(status_code=400, detail="Cannot disable the last active validator")

    res = await db["users"].update_one({"_id": oid}, {"$set": {"is_active": payload.is_active}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    return {"data": {"message": "User updated"}}


@router.delete("/{user_id}", dependencies=[Depends(require_role(UserRole.VALIDATOR))])
async def delete_user(user_id: str):
    db = get_db()
    oid = _oid(user_id)

    target = await db["users"].find_one({"_id": oid})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    # safety: don't delete last active validator
    if target.get("role") == UserRole.VALIDATOR and target.get("is_active", True):
        validators = await db["users"].count_documents({"role": UserRole.VALIDATOR, "is_active": True})
        if validators <= 1:
            raise HTTPException(status_code=400, detail="Cannot delete the last active validator")

    await db["users"].delete_one({"_id": oid})
    return {"data": {"message": "User deleted"}}