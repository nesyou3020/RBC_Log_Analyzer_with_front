import hashlib
import io
from datetime import datetime, timezone

from bson import ObjectId
from backend.database import get_db, get_gridfs
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from pymongo.errors import PyMongoError

from backend.models.audit_logs import AuditAction, AuditResult
from backend.models.log_import import (FileMeta, LogImportInDB,
                                       LogImportPublic, ProcessingStatus)
from backend.models.parsed_events import ParsedEventsFileInDB
from backend.models.user import UserInDB, UserRole
from backend.routers.audit import write_audit
from backend.routers.deps import get_current_user
from backend.services.xml_parser import parse_events_xml

router = APIRouter()


def next_version(prev: str | None) -> str:
    if not prev or not prev.startswith("v") or not prev[1:].isdigit():
        return "v1"
    return f"v{int(prev[1:]) + 1}"


def oid(s: str, name: str) -> ObjectId:
    if not ObjectId.is_valid(s):
        raise HTTPException(status_code=400, detail=f"Invalid {name}")
    return ObjectId(s)


@router.post("")
async def create_import(
    file: UploadFile = File(...),
    user: UserInDB = Depends(get_current_user),
):
    if not file.filename or not file.filename.lower().endswith(".xml"):
        raise HTTPException(status_code=400, detail="Only .xml files are allowed")

    db = get_db()
    fs = get_gridfs()

    await file.seek(0)
    xml_bytes = await file.read()
    if not xml_bytes:
        raise HTTPException(status_code=400, detail="Empty file")

    file_hash = hashlib.sha256(xml_bytes).hexdigest()
    file_size = len(xml_bytes)

    user_oid = oid(str(user.id), "user_id")
    created_by_username = user.username

    last = await db["log_imports"].find_one(
        {
            "user_id": str(user_oid),
            "$or": [{"file.file_name": file.filename}, {"file.file_hash": file_hash}],
        },
        sort=[("uploaded_at", -1)],
    )

    version = next_version(last.get("version") if last else None)
    uploaded_at = datetime.now(timezone.utc)


    file_id: ObjectId = await fs.upload_from_stream(
        file.filename,
        io.BytesIO(xml_bytes),  # Convert bytes to file-like object ; now we can use file_obj.read() / .seek() if we want

        metadata={
            "uploaded_by": str(user.id),
            "sha256": file_hash,
            "version": version,
            "content_type": file.content_type or "application/xml",
        },
    )

    meta = FileMeta(
        file_name=file.filename,
        file_path=f"gridfs://{file_id}",
        file_size=file_size,
        file_hash=file_hash,
    )

    # Store import log (file_id is ObjectId; user_id is ObjectId)
    await db["log_imports"].insert_one(
        LogImportInDB(
            file_id=str(file_id),          # <-- FIX: store as string
            user_id=user_oid,
            uploaded_at=uploaded_at,
            version=version,
            file=meta,
            error_message=None,
        ).model_dump(by_alias=True, exclude={"id"})
    )

    try:
            parsed = parse_events_xml(xml_bytes, store_full_events=True)
            file_id_str = str(file_id)

            await db["parsed_events"].replace_one(
                {"file_id": file_id_str},
                ParsedEventsFileInDB(
                    file_id=file_id_str,
                    train_ids=parsed["train_ids"],
                    rows_all=parsed["rows_all"],
                    rows_without_24_136=parsed["rows_without_24_136"],
                    events_compressed=parsed["events_compressed"],
                ).model_dump(by_alias=True, exclude={"id"}),
                upsert=True,
            )

            await write_audit(
                user=user,
                action=AuditAction.IMPORT_FILE,
                result=AuditResult.SUCCESS,
                meta={"file_id": file_id},
            )

    except Exception as e:
        await write_audit(
            user=user,
            action=AuditAction.IMPORT_FILE,
            result=AuditResult.FAILURE,
            meta={
                "file_name": file.filename,
                "error": str(e),
            },
        )

    return {
        "data": LogImportPublic(
            file_id=str(file_id),
            user_id=str(user_oid),
            created_by_username=created_by_username,
            uploaded_at=uploaded_at,
            version=version,
            error_message=None,
            file=meta,
        ).model_dump()
    }


@router.get("")
async def list_imports(user: UserInDB = Depends(get_current_user)):
    db = get_db()
    q = {} if user.role == UserRole.VALIDATOR else {"user_id": str(user.id)}

    items = []
    async for doc in db["log_imports"].find(q).sort("uploaded_at", -1):
        creator_doc = await db["users"].find_one({"_id": ObjectId(str(doc.get("user_id")))}) if doc.get("user_id") else None
        items.append(
            LogImportPublic(
                file_id=str(doc.get("file_id")),
                user_id=str(doc.get("user_id")),
                created_by_username=(creator_doc or {}).get("username") if creator_doc else None,
                uploaded_at=doc.get("uploaded_at"),
                version=doc.get("version"),
                error_message=doc.get("error_message"),
                file=doc.get("file"),
            ).model_dump()
        )
    return {"data": items}


@router.get("/{file_id}/download")
async def download_import(file_id: str, user: UserInDB = Depends(get_current_user)):
    db = get_db()
    fs = get_gridfs()

    if not ObjectId.is_valid(file_id):
        raise HTTPException(status_code=400, detail="Invalid file_id")

    log_import = await db["log_imports"].find_one({"file_id": file_id})
    if not log_import:
        raise HTTPException(status_code=404, detail="File not found")

    if user.role != UserRole.VALIDATOR and str(log_import.get("user_id")) != str(user.id):
        raise HTTPException(status_code=403, detail="Not allowed")

    try:
        grid_out = await fs.open_download_stream(ObjectId(file_id))
    except Exception:
        raise HTTPException(status_code=404, detail="File not found in storage")

    await write_audit(
        user=user,
        action=AuditAction.DOWNLOAD_FILE,
        result=AuditResult.SUCCESS,
        meta={"file_id": file_id, "file_name": grid_out.filename},
    )
    return StreamingResponse(
        grid_out,
        media_type="application/xml",
        headers={"Content-Disposition": f'attachment; filename="{grid_out.filename}"'},
    )



@router.delete("/{file_id}")
async def delete_import(file_id: str, user: UserInDB = Depends(get_current_user)):
    if not ObjectId.is_valid(file_id):
        raise HTTPException(status_code=400, detail="Invalid file_id")

    db = get_db()
    fs = get_gridfs()

    log_import = await db["log_imports"].find_one({"file_id": file_id})
    if not log_import:
        raise HTTPException(status_code=404, detail="Import not found")

    if user.role != UserRole.VALIDATOR and str(log_import.get("user_id")) != str(user.id):
        raise HTTPException(status_code=403, detail="Not allowed")
    file_name = log_import.get("file_name")  # ← Get filename

    parsed_res = await db["parsed_events"].delete_one({"file_id": file_id})
    import_res = await db["log_imports"].delete_one({"file_id": file_id})

    gridfs_deleted = False
    try:
        await fs.delete(ObjectId(file_id))
        gridfs_deleted = True
    except PyMongoError:
        gridfs_deleted = False

    await write_audit(
        user=user,
        action=AuditAction.REMOVE_FILE,
        result=AuditResult.SUCCESS,
        meta={
            "file_id": file_id,
            "file_name": file_name,  # ← Include filename
            "deleted": {
                "parsed_events": parsed_res.deleted_count,
                "log_imports": import_res.deleted_count,
                "gridfs": gridfs_deleted,
            },
        },
    )

    return {
        "data": {
            "message": "Delete attempted",
            "file_id": file_id,
            "deleted": {
                "parsed_events": parsed_res.deleted_count,
                "log_imports": import_res.deleted_count,
                "gridfs": gridfs_deleted,
            },
        }
    }