from datetime import datetime, timezone
from enum import Enum
from typing import Any

from pydantic import Field

from backend.models.common import AppBaseModel, MongoDocument, PyObjectId


class AuditResult(str, Enum):
    SUCCESS = "success"
    FAILURE = "failure"


class AuditAction(str, Enum):
    # File import lifecycle
    IMPORT_FILE = "import_file"
    REMOVE_FILE = "remove_file"
    DOWNLOAD_FILE = "download_file"  

    # Auth
    LOGIN = "login"
    LOGOUT = "logout"

    # Filters
    RUN_FILTER = "run_filter"
    SAVE_FILTER = "save_filter"

    # Scenarios
    RUN_DETECTION_SCENARIO = "run_detection_scenario"
    VALIDATE_SCENARIO = "validate_scenario"

    # Users
    USER_UPDATED = "user_updated"


class AuditMeta(AppBaseModel):
    # Optional fields depending on action
    file_id: PyObjectId | None = None
    file_name: str | None = None
    target_user_id: str | None = None
    username: str | None = None
    reason: str | None = None




class AuditLogInDB(MongoDocument):
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    user_id: PyObjectId

    action: AuditAction
    result: AuditResult

    meta: AuditMeta = Field(default_factory=AuditMeta)


class AuditLogPublic(AppBaseModel):
    audit_id: str
    timestamp: datetime
    user_id: str

    action: AuditAction
    result: AuditResult

    meta: dict