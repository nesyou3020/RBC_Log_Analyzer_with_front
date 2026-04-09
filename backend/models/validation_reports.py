from datetime import datetime, timezone
from enum import Enum

from pydantic import Field

from backend.models.common import AppBaseModel, MongoDocument, PyObjectId


class CheckResult(str, Enum):
    PASS = "pass"
    FAILED = "failed"


class StepAttribute(AppBaseModel):
    name: str
    value: str | int | float | bool | None = None


class ScenarioStepResult(AppBaseModel):
    step_name: str
    result: CheckResult
    attributes: list[StepAttribute] = Field(default_factory=list)


class DetectionRow(AppBaseModel):
    index: int
    timestamp_start: datetime
    timestamp_end: datetime | None = None
    operational_scenario: str
    result: CheckResult

    steps: list[ScenarioStepResult] = Field(default_factory=list)
    event_xml: str | None = None


class ValidationReportInDB(MongoDocument):
    file_id: PyObjectId
    scenario_template_id: PyObjectId
    generated_by: PyObjectId
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    train_id: str | int | None = None
    rows: list[DetectionRow] = Field(default_factory=list)


class ValidationReportPublic(AppBaseModel):
    report_id: str
    file_id: str
    scenario_template_id: str
    generated_by: str
    generated_at: datetime

    train_id: str | int | None = None
    rows: list[DetectionRow]