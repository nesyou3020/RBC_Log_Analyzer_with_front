from datetime import datetime, timezone
from enum import Enum

from pydantic import BaseModel, Field

from backend.models.common import AppBaseModel, MongoDocument
from backend.models.user import UserRole


class PasswordResetStatus(str, Enum):
    """Status of a password reset request."""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class PasswordResetRequestInDB(MongoDocument):
    """Password reset request document stored in MongoDB."""
    username: str = Field(..., min_length=3, max_length=50)
    role: UserRole
    new_password_hash: str
    status: PasswordResetStatus = PasswordResetStatus.PENDING
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    reviewed_at: datetime | None = None
    reviewed_by_user_id: str | None = None
    rejection_reason: str | None = None


class PasswordResetRequestPublic(AppBaseModel):
    """Password reset request returned to admin (without password hash)."""
    request_id: str
    username: str
    role: UserRole
    status: PasswordResetStatus
    created_at: datetime
    reviewed_at: datetime | None = None
    rejection_reason: str | None = None


class SubmitPasswordResetRequest(AppBaseModel):
    """What frontend sends to POST /api/auth/password-reset-requests"""
    username: str = Field(..., min_length=3, max_length=50)
    role: UserRole
    new_password: str = Field(..., min_length=8)


class ApprovePasswordResetRequest(AppBaseModel):
    """What admin sends to approve a reset request."""
    pass  # No additional data needed, just marks as approved


class RejectPasswordResetRequest(AppBaseModel):
    """What admin sends to reject a reset request."""
    reason: str = Field(default="", max_length=500)
