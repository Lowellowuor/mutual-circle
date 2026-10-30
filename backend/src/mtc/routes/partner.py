"""Partner till — public redemption endpoint (rate-limited by IP in production)."""
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

import asyncpg

from mtc.db.main import get_conn
from mtc.vouchers.redeem import redeem_voucher

router = APIRouter(prefix="/partner", tags=["partner"])


class RedeemBody(BaseModel):
    pin: str = Field(..., min_length=4, max_length=4)
    partner_name: str = Field(..., min_length=1, max_length=80)
    amount_pence: int = Field(..., gt=0, le=10_000_000)


@router.post("/redeem")
async def redeem(body: RedeemBody, conn: asyncpg.Connection = Depends(get_conn)):
    return await redeem_voucher(
        conn, pin=body.pin, partner_name=body.partner_name, amount_pence=body.amount_pence,
    )