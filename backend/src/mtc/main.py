"""Mutual Circle API — main entrypoint."""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

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


_REQUIRED_SECRETS = ("JWT_SECRET", "LEDGER_HMAC_KEY", "TOKEN_HMAC_KEY_CURRENT")


def _validate_secrets() -> None:
    """Fail-fast on missing or weak secrets in production.

    Development keeps working with empty values -- safe locally, and
    useful for testing without real credentials. Production refuses to
    start if any security-critical secret is empty or shorter than 32
    characters. An empty JWT_SECRET in production means forgeable staff
    tokens; an empty TOKEN_HMAC_KEY_CURRENT means requester tokens are
    computable from a phone number; an empty LEDGER_HMAC_KEY means the
    tamper-evident ledger is not tamper-evident.
    """
    values = {
        "JWT_SECRET": settings.jwt_secret,
        "LEDGER_HMAC_KEY": settings.ledger_hmac_key,
        "TOKEN_HMAC_KEY_CURRENT": settings.token_hmac_key_current,
    }
    missing = [
        name for name in _REQUIRED_SECRETS
        if not values[name] or len(values[name]) < 32
    ]

    if settings.environment == "production":
        if missing:
            raise RuntimeError(
                "Cannot start in production without strong values for: "
                + ", ".join(missing)
                + ". Each must be at least 32 characters. "
                + "Set them in .env before deploying."
            )
    elif missing:
        logger.warning(
            "Running in %s mode with weak or empty secrets: %s. "
            "Fine for local development. Production will refuse to start.",
            settings.environment,
            ", ".join(missing),
        )


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting in %s mode", settings.environment)
    _validate_secrets()
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

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Normalize every HTTPException into {ok: false, reason, status}.

    Every ``raise HTTPException(...)`` in the codebase now returns a
    consistent JSON envelope instead of FastAPI's default ``{"detail": ...}``.
    HTTP status codes preserved so clients can still branch on 4xx/5xx.
    """
    reason = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content={"ok": False, "reason": reason, "status": exc.status_code},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Same envelope for FastAPI's automatic 422 validation errors.

    FastAPI's default is ``{"detail": [{"loc": [...], "msg": "...", "type": "..."}]}``.
    We surface a human-readable ``reason`` (first error's msg) plus the full
    ``errors`` array for clients that want to render field-specific feedback.
    """
    errors = exc.errors()
    first = errors[0] if errors else {"msg": "Validation failed"}
    reason = first.get("msg", "Validation failed")
    return JSONResponse(
        status_code=422,
        content={"ok": False, "reason": reason, "status": 422, "errors": errors},
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