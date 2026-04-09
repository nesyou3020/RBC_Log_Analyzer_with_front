from datetime import datetime, timezone

from backend.database import get_db
from backend.models.user import UserInDB, UserRole


async def ensure_default_admin() -> None:
    
    db = get_db()
    users_count = await db["users"].count_documents({})
    if users_count > 0:
        return

    admin = UserInDB(
        username="admin",
        password_hash="admin",  
        role=UserRole.VALIDATOR,
        is_active=True,
        created_at=datetime.now(timezone.utc),
    )
    await db["users"].insert_one(admin.model_dump(by_alias=True, exclude={"id"}))