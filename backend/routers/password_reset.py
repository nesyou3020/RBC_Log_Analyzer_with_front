from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from backend.database import get_db
from backend.models.audit_logs import AuditAction, AuditResult
from backend.models.password_reset import (
    ApprovePasswordResetRequest,
    PasswordResetRequestInDB,
    PasswordResetRequestPublic,
    PasswordResetStatus,
    RejectPasswordResetRequest,
    SubmitPasswordResetRequest,
)
from backend.models.user import UserInDB, UserRole
from backend.routers.audit import write_audit
from backend.routers.deps import get_current_user
from backend.routers.auth import revoke_user_sessions

router = APIRouter()


@router.post("/password-reset-requests")
async def submit_password_reset_request(payload: SubmitPasswordResetRequest) -> dict:
    """
    User submits a password reset request.
    System verifies username + role exist in database.
    If valid, creates a pending request awaiting admin approval.
    """
    db = get_db()

    # Check if user with this username and role exists
    user_doc = await db["users"].find_one({"username": payload.username})
    
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User with this username and role not found",
        )

    user = UserInDB(**user_doc)
    
    # Verify role matches (compare enum values)
    if user.role.value != payload.role.value:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User with this username and role not found",
        )

    # Check if there's already a pending request for this user
    existing_request = await db["password_reset_requests"].find_one({
        "username": payload.username,
        "role": payload.role.value,
        "status": PasswordResetStatus.PENDING.value,
    })

    if existing_request:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A password reset request is already pending for this user",
        )

    # Keep parity with current login/users behavior where password_hash stores plaintext.
    new_password_hash = payload.new_password

    reset_request = PasswordResetRequestInDB(
        username=payload.username,
        role=payload.role,
        new_password_hash=new_password_hash,
        status=PasswordResetStatus.PENDING,
    )

    result = await db["password_reset_requests"].insert_one(
        reset_request.model_dump(by_alias=True, exclude={"id"})
    )

    return {
        "data": {
            "message": "Password reset request submitted successfully",
            "request_id": str(result.inserted_id),
        }
    }


@router.get("/password-reset-requests")
async def list_password_reset_requests(
    user: UserInDB = Depends(get_current_user),
) -> dict:
    """
    Admin (VALIDATOR) lists all password reset requests.
    Returns pending and recently reviewed requests.
    """
    if user.role != UserRole.VALIDATOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can view password reset requests",
        )

    db = get_db()

    # Get all requests, sorted by most recent first
    requests_cursor = db["password_reset_requests"].find({}).sort("created_at", -1)
    requests_docs = await requests_cursor.to_list(None)

    requests = [
        PasswordResetRequestPublic(
            request_id=str(doc["_id"]),
            username=doc["username"],
            role=doc["role"],
            status=doc["status"],
            created_at=doc["created_at"],
            reviewed_at=doc.get("reviewed_at"),
            rejection_reason=doc.get("rejection_reason"),
        )
        for doc in requests_docs
    ]

    return {"data": {"requests": [r.model_dump() for r in requests]}}


@router.post("/password-reset-requests/{request_id}/approve")
async def approve_password_reset_request(
    request_id: str,
    payload: ApprovePasswordResetRequest,
    user: UserInDB = Depends(get_current_user),
) -> dict:
    """
    Admin (VALIDATOR) approves a password reset request.
    Updates the corresponding user's password.
    """
    if user.role != UserRole.VALIDATOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can approve password reset requests",
        )

    db = get_db()

    try:
        request_oid = ObjectId(request_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid request ID",
        )

    # Get the reset request
    reset_doc = await db["password_reset_requests"].find_one({"_id": request_oid})

    if not reset_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Password reset request not found",
        )

    reset_request = PasswordResetRequestInDB(**reset_doc)

    if reset_request.status != PasswordResetStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Request is already {reset_request.status}",
        )

    # Update the user's password
    target_user_doc = await db["users"].find_one({"username": reset_request.username})

    if not target_user_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target user not found",
        )

    target_user = UserInDB(**target_user_doc)

    # Update user password using ObjectId from Mongo document.
    password_update = await db["users"].update_one(
        {"_id": target_user_doc["_id"]},
        {"$set": {"password_hash": reset_request.new_password_hash}},
    )

    if password_update.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target user not found",
        )

    await revoke_user_sessions(db, ObjectId(str(target_user.id)))

    # Mark reset request as approved
    await db["password_reset_requests"].update_one(
        {"_id": request_oid},
        {
            "$set": {
                "status": PasswordResetStatus.APPROVED.value,
                "reviewed_at": datetime.now(timezone.utc),
                "reviewed_by_user_id": str(user.id),
            }
        },
    )

    # Audit log
    await write_audit(
        user=user,
        action=AuditAction.USER_UPDATED,
        result=AuditResult.SUCCESS,
        meta={
            "target_user_id": str(target_user.id),
            "reason": "password_reset_approved",
        },
    )

    return {"data": {"message": "Password reset request approved. User password updated."}}


@router.post("/password-reset-requests/{request_id}/reject")
async def reject_password_reset_request(
    request_id: str,
    payload: RejectPasswordResetRequest,
    user: UserInDB = Depends(get_current_user),
) -> dict:
    """
    Admin (VALIDATOR) rejects a password reset request.
    """
    if user.role != UserRole.VALIDATOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can reject password reset requests",
        )

    db = get_db()

    try:
        request_oid = ObjectId(request_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid request ID",
        )

    # Get the reset request
    reset_doc = await db["password_reset_requests"].find_one({"_id": request_oid})

    if not reset_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Password reset request not found",
        )

    reset_request = PasswordResetRequestInDB(**reset_doc)

    if reset_request.status != PasswordResetStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Request is already {reset_request.status}",
        )

    # Mark reset request as rejected
    await db["password_reset_requests"].update_one(
        {"_id": request_oid},
        {
            "$set": {
                "status": PasswordResetStatus.REJECTED.value,
                "reviewed_at": datetime.now(timezone.utc),
                "reviewed_by_user_id": str(user.id),
                "rejection_reason": payload.reason or "Rejected by admin",
            }
        },
    )

    # Audit log
    await write_audit(
        user=user,
        action=AuditAction.USER_UPDATED,
        result=AuditResult.SUCCESS,
        meta={
            "username": reset_request.username,
            "reason": "password_reset_rejected",
        },
    )

    return {"data": {"message": "Password reset request rejected."}}
