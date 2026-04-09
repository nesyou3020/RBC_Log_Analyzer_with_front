from datetime import datetime, timezone

from bson import ObjectId
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from backend.database import get_db
from backend.models.session import SessionInDB
from backend.models.user import UserInDB, UserRole

bearer_scheme = HTTPBearer(auto_error=False)


def _as_utc_aware(dt: datetime) -> datetime:
    # If Mongo returns naive datetime, assume it's UTC and make it aware.
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


async def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> UserInDB:
    if creds is None or not creds.credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing Bearer token")

    token = creds.credentials.strip()
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    db = get_db()

    session_doc = await db["sessions"].find_one({"token": token})
    if not session_doc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session")

    session = SessionInDB(**session_doc)

    now = datetime.now(timezone.utc)
    expires_at = _as_utc_aware(session.expires_at)

    if expires_at <= now:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired")

    user_doc = await db["users"].find_one({"_id": ObjectId(str(session.user_id))})
    if not user_doc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    user = UserInDB(**user_doc)
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User disabled")

    return user


def require_role(*roles: UserRole):
    async def _check(user: UserInDB = Depends(get_current_user)) -> UserInDB:
        if user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient role")
        return user

    return _check