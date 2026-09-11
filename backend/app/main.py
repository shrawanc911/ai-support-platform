from fastapi import FastAPI

from app.api.health import router as health_router

app = FastAPI(
    title="AI Support Platform API",
    description="Backend API for an AI-powered customer support platform.",
    version="0.1.0",
)

app.include_router(health_router)