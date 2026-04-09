from datetime import datetime, timezone
from enum import Enum

from pydantic import BaseModel, Field

from backend.models.common import AppBaseModel, MongoDocument, PyObjectId


class ProcessingStatus(str, Enum):
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class FileMeta(BaseModel):
    file_name: str = Field(..., min_length=1)
    file_path: str = Field(..., min_length=1)
    file_size: int = Field(..., ge=0)
    file_hash: str = Field(..., min_length=1)




class LogImportInDB(MongoDocument):
    file_id: PyObjectId                 
    user_id: PyObjectId              
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    error_message: str | None = None
    version: str | None = None
    file: FileMeta


class LogImportPublic(BaseModel):
    file_id: str
    user_id: str
    created_by_username: str | None = None
    uploaded_at: datetime
    error_message: str | None = None
    version: str | None = None
    file: FileMeta
