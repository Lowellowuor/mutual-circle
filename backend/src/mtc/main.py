"""Mutual Circle API — main entrypoint."""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from mtc.config import settings
from mtc.db.main import close_pool, get_pool, health_check
from mtc.routes.public import router as public_router
from mtc.routes.requester import router as requester_router

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
    version="0.3.0",
    description="Anonymized resource-sharing network — R.U.T.H prototype backend",
    lifespan=lifespan,
)

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

app.include_router(public_router)
app.include_router(requester_router)


@app.get("/")
async def root():
    return {"service": "mutual-circle-api", "version": "0.3.0"}


@app.get("/health")
async def health():
    db = await health_check()
    return {"ok": True, "environment": settings.environment, "version": "0.3.0", **db}


@app.get("/ready")
async def ready():
    db = await health_check()
    return {"ready": db.get("db") == "connected", **db}