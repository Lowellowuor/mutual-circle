"""Mutual Circle API — main entrypoint."""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from mtc.config import settings
from mtc.db.main import close_pool, get_pool, health_check
from mtc.routes.admin import router as admin_router
from mtc.routes.audit import router as audit_router
from mtc.routes.campaigns import router as campaigns_router
from mtc.routes.donors import router as donors_router
from mtc.routes.enrolment import router as enrolment_router
from mtc.routes.fulfilment import router as fulfilment_router
from mtc.routes.partner import router as partner_router
from mtc.routes.pledges import router as pledges_router
from mtc.routes.helplines import router as helplines_router
from mtc.routes.ledger_public import router as ledger_public_router
from mtc.routes.notifications import router as notifications_router
from mtc.routes.opportunities import router as opportunities_router
from mtc.routes.partners import router as partners_router
from mtc.routes.public import router as public_router
from mtc.routes.requester import router as requester_router
from mtc.routes.staff import router as staff_router
from mtc.routes.stats import router as stats_router

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
    version="0.6.0",
    description="Anonymized resource-sharing network - R.U.T.H prototype backend",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^(https://lowellowuor\.github\.io|http://(localhost|127\.0\.0\.1)(:\d+)?)$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(public_router)
app.include_router(requester_router)
app.include_router(staff_router)
app.include_router(fulfilment_router)
app.include_router(audit_router)
app.include_router(partner_router)
app.include_router(enrolment_router)
app.include_router(campaigns_router)
app.include_router(donors_router)
app.include_router(pledges_router)
app.include_router(admin_router)
app.include_router(opportunities_router)
app.include_router(helplines_router)
app.include_router(stats_router)
app.include_router(notifications_router)
app.include_router(ledger_public_router)
app.include_router(partners_router)


@app.get("/")
async def root():
    return {"service": "mutual-circle-api", "version": "0.6.0"}


@app.get("/health")
async def health():
    db = await health_check()
    return {"ok": True, "environment": settings.environment, "version": "0.6.0", **db}


@app.get("/ready")
async def ready():
    db = await health_check()
    return {"ready": db.get("db") == "connected", **db}