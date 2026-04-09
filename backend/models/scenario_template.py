from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Literal

from pydantic import BaseModel, Field

from backend.models.common import AppBaseModel, MongoDocument, PyObjectId


class ScenarioStep(BaseModel):
    """
    One step cell in Excel:
    - step_type="event": dict like {'type': 'stp...', 'NumV': '1', ...}
    - step_type="eoe": marks end of operational scenario (EOE)
    """
    step_type: Literal["event", "eoe"]
    data: dict[str, Any] = Field(default_factory=dict)


class OperationalScenario(BaseModel):
 
    index: int = Field(..., ge=1)
    name: str = Field(..., min_length=1)
    steps: list[dict[str, Any]] = Field(default_factory=list)

class ScenarioTemplateInDB(MongoDocument):
    name: str = Field(..., min_length=1)  # unique name of the template
    description: str | None = None
    created_by: PyObjectId
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    operational_scenarios: list[OperationalScenario] = Field(default_factory=list)


class ScenarioTemplatePublic(BaseModel):
    template_id: str
    name: str
    description: str | None = None
    created_by: str
    created_by_username: str | None = None
    created_at: datetime

    operational_scenarios: list[OperationalScenario] = Field(default_factory=list)