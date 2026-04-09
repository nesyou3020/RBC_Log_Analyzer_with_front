from datetime import datetime, timezone
from typing import Any

from bson import Binary
from pydantic import BaseModel, Field

from backend.models.common import AppBaseModel, MongoDocument, PyObjectId


class MessageRow(BaseModel):
    index: int | None = None

    timestamp: datetime | None = None

    direction_symbol: str | None = None  
    train_id: str | int | None = None

    message_code: str | None = None  # exmp "M136"
    message_name: str | None = None

    raw: dict[str, Any] = Field(default_factory=dict)


class ParsedEventsFileInDB(MongoDocument):
    """
    One document per imported XML file.
    """
    model_config = {"arbitrary_types_allowed": True}
    
    file_id: PyObjectId  # GridFS ObjectId
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    train_ids: list[str | int] = Field(default_factory=list)

    rows_all: list[MessageRow] = Field(default_factory=list)
    rows_without_24_136: list[MessageRow] = Field(default_factory=list)

    events_compressed: Binary | None = None


class ParsedEventsFilePublic(AppBaseModel):
    file_id: str
    created_at: datetime
    train_ids: list[str | int]