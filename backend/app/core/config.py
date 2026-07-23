from typing import List

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "BuilderWeb API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "https://localhost:3000",
    ]

    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/builderweb"
    SECRET_KEY: str = "your-secret-key-here"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    DISABLE_AUTH: bool = True

    # AI Provider settings
    AI_PROVIDER: str = "gemini"
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.0-flash"
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4"
    CLAUDE_API_KEY: str = ""
    CLAUDE_MODEL: str = "claude-3-opus-20240229"

    # Hugging Face (free image generation)
    HF_API_KEY: str = ""
    HF_IMAGE_MODEL: str = "stabilityai/stable-diffusion-xl-base-1.0"

    # AI Engine settings
    AI_DEFAULT_TEMPERATURE: float = 0.7
    AI_DEFAULT_MAX_TOKENS: int = 4096
    AI_CACHE_TTL: int = 3600
    AI_CACHE_MAX_SIZE: int = 1000
    AI_RATE_LIMIT_PER_MINUTE: int = 30
    AI_MAX_CONCURRENT_JOBS: int = 3
    AI_REQUEST_TIMEOUT: float = 60.0

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
