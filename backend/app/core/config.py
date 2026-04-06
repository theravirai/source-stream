from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "source-stream"
    API_V1_STR: str = "/api/v1"
    LOG_LEVEL: str = "INFO"
    
    # AI/Vector Keys (Optional on setup, required later)
    GROQ_API_KEY: str | None = None
    GEMINI_API_KEY: str | None = None
    QDRANT_URL: str | None = None
    QDRANT_API_KEY: str | None = None
    QDRANT_COLLECTION: str = "source_stream"
    
    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()
