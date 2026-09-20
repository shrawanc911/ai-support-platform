from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.health import router as health_router
from app.api.database_test import router as database_router
from app.api.organizations import router as organizations_router
from app.api.users import router as users_router
from app.api.tickets import router as tickets_router
from app.api.ticket_messages import router as ticket_messages_router
from app.api.auth import router as auth_router

app = FastAPI(
    title="AI Support Platform API",
    description="Backend API for an AI-powered customer support platform.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(database_router)
app.include_router(health_router)
app.include_router(organizations_router)
app.include_router(users_router)
app.include_router(tickets_router)
app.include_router(ticket_messages_router)
app.include_router(auth_router)