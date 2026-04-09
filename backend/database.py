from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase, AsyncIOMotorGridFSBucket
from pymongo import IndexModel

from backend.config import settings 


# _client (global, starts as None)
#     │
#     ▼
# get_client()          ← creates connection ONLY if _client is None
#     │
#     ▼
# get_db()              ← gets the specific database from client
#     │
#     ├──────────────────────────────────┐
#     ▼                                  ▼
# get_gridfs()                    create_indexes(db)
# (file storage)                  (performance setup)
    
# close_client()        ← cleanup on app shutdown





_client : AsyncIOMotorClient | None = None

# The single underscore _ prefix is a Python convention meaning:

# "This variable is private / internal — it's not meant to be used directly from outside this file"

def get_client()-> AsyncIOMotorClient :
    global _client 
    if _client is None:
        _client = AsyncIOMotorClient(settings.MONGO_URI)
    return _client

def get_db()-> AsyncIOMotorDatabase :
    return get_client()[settings.MONGO_DB]

def get_gridfs()-> AsyncIOMotorGridFSBucket :

    return AsyncIOMotorGridFSBucket(get_db())

async def close_client()-> None :
    global _client
    if _client is not None:
        _client.close()
        _client = None

# to chek after if we need to create others indexes 

async def create_indexes(db: AsyncIOMotorDatabase)-> None :
    # Create indexes for the "logs" collection
    await db["users"].create_indexes([
        IndexModel("username", unique=True),          
    ])

    await db ["log_imports"].create_indexes([    # ok
        IndexModel("user_id", unique = False),
        IndexModel("file.file_name")
    ])

    await db["sessions"].create_indexes([     # ok
        IndexModel("token", unique=True),
        IndexModel("expires_at", expireAfterSeconds=0),  # TTL index for expired sessions
    ])

    await db ["parsed_events"].create_indexes([
        IndexModel("file_id", unique=True)
     ])

    await db ["filters"].create_indexes([
        IndexModel("created_by"),
        IndexModel("source")
    ])

    await db ["audit_logs"].create_indexes([
        IndexModel("user_id"),
        IndexModel("timestamp")
    ])
    
    await db ["validation_reports"].create_indexes([
        IndexModel("file_id"),
        IndexModel("created_by")
    ])

    await db["scenario_templates"].create_index("created_by") 
    