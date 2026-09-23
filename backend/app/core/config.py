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

    class Config:
        env_file = ".env"


settings = Settings()