from fastapi import FastAPI

from app.api.health import router as health_router
from app.api.database_test import router as database_router
from app.api.organizations import router as organizations_router
from app.api.users import router as users_router
from app.api.tickets import router as tickets_router

app = FastAPI(
    title="AI Support Platform API",
    description="Backend API for an AI-powered customer support platform.",
    version="0.1.0",
)

app.include_router(database_router)
app.include_router(health_router)
app.include_router(organizations_router)
app.include_router(users_router)
app.include_router(tickets_router)