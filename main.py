import asyncio
import subprocess

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.database import close_client, create_indexes, get_db
from backend.routers import auth, dashboard, events, imports, scenarios, users, password_reset
from backend.services.init_admin import ensure_default_admin

app = FastAPI(title="ETCS Log Parser API")
 

@app.on_event("startup")
async def _startup():
    subprocess.run([r"cmd.exe", "/c", "start-mongodb.bat"], check=False)

    # Wait a bit (better: do a real ping check; see below)
    await asyncio.sleep(3)
    await ensure_default_admin()
    await create_indexes(get_db())


# CORS (adjust origins to your frontend URL)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # to specifcy the fronend url later
    allow_credentials=True,
    allow_methods=["*"], # later must specify to eonly ["GET", "POST", "PUT", "DELETE", patch]
    allow_headers=["*"], 
)

# Routers
app.include_router(imports.router, prefix="/imports", tags=["imports"])
app.include_router(events.router, prefix="/events", tags=["events"])
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
app.include_router(scenarios.router, prefix="/scenarios", tags=["scenarios"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(password_reset.router, prefix="/auth", tags=["password-reset"])

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.on_event("shutdown")
async def _shutdown():
    await close_client()