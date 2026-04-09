from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from backend.database import get_db
from backend.models.scenario_template import ScenarioTemplateInDB, ScenarioTemplatePublic
from backend.models.user import UserInDB, UserRole
from backend.routers.deps import get_current_user
from backend.services.os_parsed import ScenarioExcelParseError, parse_scenario_template_excel

router = APIRouter()


async def get_username_by_id(db, user_id: ObjectId | str | None) -> str | None:
    if not user_id:
        return None

    lookup_id = ObjectId(str(user_id)) if ObjectId.is_valid(str(user_id)) else None
    if lookup_id is None:
        return None

    user_doc = await db["users"].find_one({"_id": lookup_id}, {"username": 1})
    return user_doc.get("username") if user_doc else None


def oid(s: str, name: str) -> ObjectId:
    if not ObjectId.is_valid(s):
        raise HTTPException(status_code=400, detail=f"Invalid {name}")
    return ObjectId(s)


@router.post("")
async def create_template(payload: dict, user: UserInDB = Depends(get_current_user)):
    db = get_db()

    doc = ScenarioTemplateInDB(
        name=payload.get("name") or "",
        description=payload.get("description"),
        created_by=str(user.id),
        operational_scenarios=payload.get("operational_scenarios") or [],
        created_at=datetime.now(timezone.utc),
    )

    res = await db["scenario_templates"].insert_one(doc.model_dump(by_alias=True, exclude={"id"}))
    return {"data": {"template_id": str(res.inserted_id)}}


@router.post("/upload-excel")
async def upload_template_excel(
    name: str,
    description: str | None = None,
    file: UploadFile = File(...),
    user: UserInDB = Depends(get_current_user),
):
    db = get_db()

    if not file.filename or not file.filename.lower().endswith((".xlsx", ".xlsm")):
        raise HTTPException(status_code=400, detail="Only .xlsx/.xlsm files are allowed")

    content = await file.read()
    try:
        operational_scenarios = parse_scenario_template_excel(content)
    except ScenarioExcelParseError as e:
        raise HTTPException(status_code=400, detail=str(e))

    doc = ScenarioTemplateInDB(
        name=name,
        description=description,
        created_by=str(user.id),
        operational_scenarios=operational_scenarios,
    )

    res = await db["scenario_templates"].insert_one(doc.model_dump(by_alias=True, exclude={"id"}))
    return {
        "data": ScenarioTemplatePublic(
            template_id=str(res.inserted_id),
            name=doc.name,
            description=doc.description,
            created_by=str(doc.created_by),
            created_by_username=user.username,
            created_at=doc.created_at,
            operational_scenarios=doc.operational_scenarios,
        ).model_dump()
    }


@router.post("/preview-excel")
async def preview_template_excel(
    name: str,
    description: str | None = None,
    file: UploadFile = File(...),
    user: UserInDB = Depends(get_current_user),
):
    if not file.filename or not file.filename.lower().endswith((".xlsx", ".xlsm")):
        raise HTTPException(status_code=400, detail="Only .xlsx/.xlsm files are allowed")

    content = await file.read()
    try:
        operational_scenarios = parse_scenario_template_excel(content)
    except ScenarioExcelParseError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {
        "data": ScenarioTemplatePublic(
            template_id="",
            name=name,
            description=description,
            created_by=str(user.id),
            created_at=datetime.now(timezone.utc),
            operational_scenarios=operational_scenarios,
        ).model_dump()
    }


@router.get("")
async def list_templates(user: UserInDB = Depends(get_current_user)):
    db = get_db()
    q = {} if user.role == UserRole.VALIDATOR else {"created_by": str(user.id)}

    items = []
    async for doc in db["scenario_templates"].find(q).sort("created_at", -1):
        created_by_id = doc.get("created_by")
        items.append(
            ScenarioTemplatePublic(
                template_id=str(doc.get("_id")),
                name=doc.get("name"),
                description=doc.get("description"),
                created_by=str(created_by_id),
                created_by_username=await get_username_by_id(db, created_by_id),
                created_at=doc.get("created_at"),
                operational_scenarios=doc.get("operational_scenarios") or [],
            ).model_dump()
        )
    return {"data": items}


@router.get("/{template_id}")
async def get_template(template_id: str, user: UserInDB = Depends(get_current_user)):
    db = get_db()
    tpl = await db["scenario_templates"].find_one({"_id": oid(template_id, "template_id")})
    if not tpl:
        raise HTTPException(status_code=404, detail="Template not found")

    if user.role != UserRole.VALIDATOR and str(tpl.get("created_by")) != str(user.id):
        raise HTTPException(status_code=403, detail="Not allowed")

    return {
        "data": ScenarioTemplatePublic(
            template_id=str(tpl.get("_id")),
            name=tpl.get("name"),
            description=tpl.get("description"),
            created_by=str(tpl.get("created_by")),
            created_by_username=await get_username_by_id(db, tpl.get("created_by")),
            created_at=tpl.get("created_at"),
            operational_scenarios=tpl.get("operational_scenarios") or [],
        ).model_dump()
    }


@router.delete("/{template_id}")
async def delete_template(template_id: str, user: UserInDB = Depends(get_current_user)):
    db = get_db()
    if user.role != UserRole.VALIDATOR:
        raise HTTPException(status_code=403, detail="Not allowed")

    res = await db["scenario_templates"].delete_one({"_id": oid(template_id, "template_id")})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    return {"data": {"message": "Deleted", "template_id": template_id}}