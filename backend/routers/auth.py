import secrets
from datetime import datetime, timedelta, timezone

from bson import ObjectId
from backend.config import settings
from backend.database import get_db
from fastapi import APIRouter, Depends, Header, HTTPException, status
from backend.models.audit_logs import AuditAction, AuditResult
from backend.models.session import SessionInDB
from backend.models.user import ChangePasswordRequest, LoginRequest, LoginResponse, UserInDB
from backend.routers.audit import write_audit
from backend.routers.deps import get_current_user

router = APIRouter()


def verify_password(plain_password: str, stored_password_hash: str) -> bool:
    return secrets.compare_digest(plain_password, stored_password_hash)


async def revoke_user_sessions(db, user_oid: ObjectId) -> None:
    await db["sessions"].delete_many({"user_id": {"$in": [user_oid, str(user_oid)]}})


@router.post("/login")
async def login(payload: LoginRequest) -> dict:
    db = get_db()

    user_doc = await db["users"].find_one({"username": payload.username})
    if not user_doc:

        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    user = UserInDB(**user_doc)

    if not user.is_active:
        await write_audit(
            user=user,
            action=AuditAction.LOGIN,
            result=AuditResult.FAILURE,
            meta={"reason": "user_disabled"},
        )
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User disabled")

    if not verify_password(payload.password, user.password_hash):
        await write_audit(
            user=user,
            action=AuditAction.LOGIN,
            result=AuditResult.FAILURE,
            meta={"reason": "invalid_credentials"},
        )
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=settings.TOKEN_EXPIRE_SECONDES)

    session = SessionInDB(token=token, user_id=user.id, expires_at=expires_at)
    await db["sessions"].insert_one(session.model_dump(by_alias=True, exclude={"id"}))

    await db["users"].update_one(
        {"_id": user.id},
        {"$set": {"last_login": datetime.now(timezone.utc)}},
    )

    await write_audit(
        user=user,
        action=AuditAction.LOGIN,
        result=AuditResult.SUCCESS,
        meta={},
    )

    data = LoginResponse(
        token=token,
        user_id=str(user.id),
        username=user.username,
        role=user.role,
    )
    return {"data": data.model_dump()}

@router.post("/logout")
async def logout(
    authorization: str | None = Header(default=None),
    user: UserInDB = Depends(get_current_user),
) -> dict:
    """
    Logout by deleting the session associated with the provided Bearer token."""
    if not authorization or not authorization.startswith("Bearer "):
        await write_audit(
            user=user,
            action=AuditAction.LOGOUT,
            result=AuditResult.FAILURE,
            meta={"reason": "missing_bearer_token"},
        )
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing Bearer token")

    token = authorization.removeprefix("Bearer ").strip()
    if not token:
        await write_audit(
            user=user,
            action=AuditAction.LOGOUT,
            result=AuditResult.FAILURE,
            meta={"reason": "invalid_token"},
        )
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    db = get_db()
    await db["sessions"].delete_one({"token": token})

    await write_audit(
        user=user,
        action=AuditAction.LOGOUT,
        result=AuditResult.SUCCESS,
        meta={},
    )

    return {"data": {"message": "Logged out successfully."}}


@router.post("/change-password")
async def change_password(
    payload: ChangePasswordRequest,
    user: UserInDB = Depends(get_current_user),
) -> dict:
    db = get_db()

    if not verify_password(payload.current_password, user.password_hash):
        await write_audit(
            user=user,
            action=AuditAction.USER_UPDATED,
            result=AuditResult.FAILURE,
            meta={"reason": "invalid_current_password"},
        )
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")

    if secrets.compare_digest(payload.current_password, payload.new_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="New password must be different")

    user_oid = ObjectId(str(user.id)) if ObjectId.is_valid(str(user.id)) else None
    if user_oid is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Invalid user id")

    update_result = await db["users"].update_one(
        {"_id": user_oid},
        {"$set": {"password_hash": payload.new_password}},
    )

    if update_result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    await revoke_user_sessions(db, user_oid)

    await write_audit(
        user=user,
        action=AuditAction.USER_UPDATED,
        result=AuditResult.SUCCESS,
        meta={"reason": "password_changed"},
    )

    return {"data": {"message": "Password updated successfully"}}