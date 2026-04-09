from datetime import datetime, timezone
from enum import Enum
from typing import Any

from pydantic import Field

from backend.models.common import AppBaseModel, MongoDocument, PyObjectId


class FilterSource(str, Enum):
    MANUAL = "manual"
    LLM = "llm"


class FilterInDB(MongoDocument):
    created_by: PyObjectId
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    source: FilterSource = FilterSource.MANUAL
    
    llm_original_query: str | None = None
    llm_confidence: float | None = Field(default=None, ge=0, le=1)

    filter: dict[str, Any] = Field(default_factory=dict)
 
    
    prompt_history: list[dict[str, Any]] | None = None

    # to check  exact the shape of the filter 
    history: list[dict[str, Any]] = Field(default_factory=list)



class FilterPublic(AppBaseModel):
    filter_id: str
    created_by: str
    created_at: datetime
    source: FilterSource
    llm_original_query: str | None
    llm_confidence: float | None
    filter: dict[str, Any]
    prompt_history: list[str] | None