from datetime import datetime, timezone

from pydantic import BaseModel, Field

from backend.models.common import  MongoDocument, PyObjectId


class SessionInDB(MongoDocument):
    token: str = Field(..., min_length=32)
    user_id: PyObjectId
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime


class SessionPublic(BaseModel):
    session_id: str
    user_id: str
    created_at: datetime
    expires_at: datetime