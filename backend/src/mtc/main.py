"""Mutual Circle API — main entrypoint.

Endpoints in Day 1:
  GET /          — service identity
  GET /health    — liveness + DB state
  GET /ready     — readiness (fails if DB not connected)

The app boots even if the database is unreachable, so that CI and staging
environments can run without a database. /ready is the honest signal.
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from mtc.config import settings
from mtc.db.main import close_pool, get_pool, health_check

logging.basicConfig(level=settings.log_level.upper())
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting in %s mode", settings.environment)
    try:
        await get_pool()
    except Exception as exc:
        logger.warning("Database not connected at startup: %s", exc)
    yield
    await close_pool()
    logger.info("Shutdown complete")


app = FastAPI(
    title="Mutual Circle API",
    version="0.1.0",
    description="Anonymized resource-sharing network — R.U.T.H prototype backend",
    lifespan=lifespan,
)

# CORS: allow local frontend dev and the deployed GitHub Pages frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://lowellowuor.github.io",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"service": "mutual-circle-api", "version": "0.1.0"}


@app.get("/health")
async def health():
    db = await health_check()
    return {
        "ok": True,
        "environment": settings.environment,
        "version": "0.1.0",
        **db,
    }


@app.get("/ready")
async def ready():
    db = await health_check()
    return {
        "ready": db.get("db") == "connected",
        **db,
    }