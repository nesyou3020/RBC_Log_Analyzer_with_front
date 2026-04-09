from typing import Any

from bson import ObjectId
from pydantic import BaseModel, Field


class PyObjectId(str):
    """Convert MongoDB ObjectId <-> JSON string."""

    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, _=None):
        if isinstance(v, ObjectId):
            return str(v)
        if ObjectId.is_valid(v):
            return str(v)
        raise ValueError("Invalid ObjectId")


class AppBaseModel(BaseModel):
    model_config = {"populate_by_name": True}
    id: PyObjectId | None = Field(default=None, alias="_id")


class MongoDocument(AppBaseModel):
    """Base class for MongoDB documents (includes _id alias)."""
    pass


class ResponseMeta(AppBaseModel):
    page: int
    page_size: int
    total: int


class DataResponse(AppBaseModel):
    data: Any


class ListResponse(AppBaseModel):
    data: list[Any]
    meta: ResponseMeta


class ErrorResponse(AppBaseModel):
    error: str
    detail: str