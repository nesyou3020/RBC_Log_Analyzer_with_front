from datetime import datetime, timezone
from enum import Enum

from pydantic import BaseModel, Field

from backend.models.common import AppBaseModel, MongoDocument


class UserRole(str, Enum): #This defines the only valid roles in system.
    VALIDATOR = "validator"
    ENGINEER = "engineer"


class LoginRequest(AppBaseModel): # schema send  by frontend when logging
    """What the frontend sends to POST /api/auth/login."""
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=3)


class UserInDB(MongoDocument): 
    """Full user document as stored in MongoDB (includes password_hash)."""
    username: str = Field(..., min_length=3, max_length=50)
    password_hash: str
    role: UserRole
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_login: datetime | None = None


class UserPublic(AppBaseModel): # what is returned to frontend when want to show user data
    """User info returned by the API — NO password_hash."""
    user_id: str
    username: str
    role: UserRole
    is_active: bool
    created_at: datetime
    last_login: datetime | None = None


class LoginResponse(BaseModel): # what is returned to frontend after successful login
    """Returned after successful login."""
    token: str
    user_id: str
    username: str
    role: UserRole


class CreateUserRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=3)
    role: UserRole = UserRole.ENGINEER


class UpdateUserRoleRequest(BaseModel):
    role: UserRole


class UpdateUserActiveRequest(BaseModel):
    is_active: bool


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=3)
    new_password: str = Field(..., min_length=8)