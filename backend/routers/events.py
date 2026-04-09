
from typing import Any, Literal

import gzip
import json

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query

from backend.database import get_db
from backend.models.user import UserInDB, UserRole
from backend.routers.deps import get_current_user

router = APIRouter()

Mode = Literal["with_24_136", "without_24_136"]


async def _require_visible_import(db, file_id: str, user: UserInDB) -> ObjectId:
    """
    - Validates file_id
    - Ensures the import exists in log_imports
    - Enforces visibility (validator sees all, engineer sees only their own)
    Returns ObjectId(file_id) for further use.
    """
    if not ObjectId.is_valid(file_id):
        raise HTTPException(status_code=400, detail="Invalid file_id")

    file_oid = ObjectId(file_id)

    log_import = await db["log_imports"].find_one({"file_id": file_id})
    if not log_import:
        raise HTTPException(status_code=404, detail="Import not found")

    if user.role != UserRole.VALIDATOR and str(log_import.get("user_id")) != str(user.id):
        raise HTTPException(status_code=403, detail="Not allowed")

    return file_oid


async def _get_parsed_or_404(db, file_id: str) -> dict[str, Any]:
    parsed = await db["parsed_events"].find_one({"file_id": file_id})
    if not parsed:
        raise HTTPException(status_code=404, detail="Parsed events not found")
    return parsed


@router.get("/trains")
async def list_trains(
    file_id: str = Query(..., description="GridFS file id (ObjectId string)"),
    user: UserInDB = Depends(get_current_user),
):
    """
    GET /events/trains?file_id=...
    Returns list of train_ids available for that imported file.
    """
    db = get_db()
    await _require_visible_import(db, file_id, user)
    parsed = await _get_parsed_or_404(db, file_id)

    return {"data": {"file_id": file_id, "train_ids": parsed.get("train_ids", [])}}


@router.get("")
async def list_events(
    file_id: str = Query(..., description="GridFS file id (ObjectId string)"),
    mode: Mode = Query("without_24_136"),
    train_id: str | None = Query(None, description="peer_etcs_id"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    user: UserInDB = Depends(get_current_user),
):
    db = get_db()
    await _require_visible_import(db, file_id, user)
    parsed = await _get_parsed_or_404(db, file_id)

    rows_key = "rows_without_24_136" if mode == "without_24_136" else "rows_all"
    rows: list[dict[str, Any]] = parsed.get(rows_key) or []

    if train_id is not None:
        # Convert both to string for comparison (row train_id can be int or string)
        rows = [r for r in rows if str(r.get("train_id")) == train_id]

    total = len(rows)
    start = (page - 1) * page_size
    end = start + page_size
    items = rows[start:end]

    # Fill in raw from compressed events if raw is empty (for large files)
    events_compressed = parsed.get("events_compressed")
    if events_compressed and any(not row.get("raw") for row in items):
        try:
            events_json = gzip.decompress(bytes(events_compressed)).decode("utf-8")
            all_events = json.loads(events_json)
            
            # Map raw by index: items have "index" (1-based), events_compressed also 1-based
            raw_map = {ev.get("index"): ev for ev in all_events if isinstance(ev, dict)}
            for item in items:
                idx = item.get("index")
                if idx and not item.get("raw") and idx in raw_map:
                    item["raw"] = raw_map[idx]
        except Exception:
            # If decompression fails, leave empty raw fields
            pass

    return {
        "data": {
            "file_id": file_id,
            "mode": mode,
            "items": items,
            "page": page,
            "page_size": page_size,
            "total": total,
        }
    }


@router.get("/raw")
async def get_raw_events(
    file_id: str = Query(..., description="GridFS file id (ObjectId string)"),
    page: int = Query(1, ge=1),
    page_size: int = Query(200, ge=1, le=2000),
    user: UserInDB = Depends(get_current_user),
):
    db = get_db()
    await _require_visible_import(db, file_id, user)
    parsed = await _get_parsed_or_404(db, file_id)

    events_compressed = parsed.get("events_compressed")
    if events_compressed:
        try:
            events_json = gzip.decompress(bytes(events_compressed)).decode("utf-8")
            events = json.loads(events_json)
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Failed to decode raw events: {exc}")
    else:
        # Fallback for legacy or missing compressed data: use raw field from parsed rows
        rows = parsed.get("rows_all", [])
        events = [row.get("raw", {}) for row in rows]

    total = len(events)
    start = (page - 1) * page_size
    end = start + page_size
    items = events[start:end]

    return {
        "data": {
            "file_id": file_id,
            "items": items,
            "page": page,
            "page_size": page_size,
            "total": total,
        }
    }  