from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MONGO_URI: str ="mongodb://localhost:27017"
    MONGO_DB: str = "RBC_Log_Analyzer"
    TOKEN_EXPIRE_SECONDES : int = 60 *60 * 8 # 1 hour
    LLM_SERVICE_URL: str = "" #  to configure after
    LLM_TIMEOUT_SECONDS: int = 30


settings = Settings()