from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str
    APP_ENV: str

    DATABASE_URL: str

    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int

    AI_PROVIDER: str = "openrouter"

    OPENROUTER_API_KEY: str
    OPENROUTER_MODEL: str = "openrouter/free"

    REDIS_URL: str = "redis://localhost:6379/0"

    AI_MAX_ATTEMPTS: int = 3

    EMBEDDING_MODEL: str = "BAAI/bge-small-en-v1.5"
    EMBEDDING_DIMENSION: int = 384

    class Config:
        env_file = ".env"


settings = Settings()