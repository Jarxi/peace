from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.concurrency import run_in_threadpool
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel
from supabase import Client

from app.core.shared import (
    ReporterAuthError,
    authenticate_reporter,
    extract_host,
    get_supabase_client,
)

router = APIRouter()
logger = logging.getLogger(__name__)


class ReportCrawlPayload(BaseModel):
    domain: Optional[str] = None
    path: Optional[str] = None
    userAgent: Optional[str] = None
    ip: Optional[str] = None
    metadata: Optional[Any] = None
    occurredAt: Optional[str] = None


def _parse_datetime(raw: str) -> Optional[datetime]:
    value = raw.strip()
    if not value:
        return None
    normalized = value
    if value.endswith("Z"):
        normalized = value[:-1] + "+00:00"
    try:
        return datetime.fromisoformat(normalized)
    except ValueError:
        return None


@router.post("/report-crawl/v0", status_code=status.HTTP_202_ACCEPTED)
async def report_crawl(
    payload: ReportCrawlPayload,
    request: Request,
    supabase: Client = Depends(get_supabase_client),
) -> dict[str, str]:
    domain = (payload.domain or "").strip()
    if not domain:
        raise HTTPException(status_code=400, detail="domain is required")

    source_header = request.headers.get("x-source-id")
    if not source_header:
        raise HTTPException(status_code=400, detail="Missing X-Source-Id header")

    domain_host = extract_host(domain)

    try:
        reporter = await run_in_threadpool(
            authenticate_reporter,
            source_header,
            domain_host,
            supabase,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except ReporterAuthError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc

    path = (payload.path or "/").strip() or "/"
    user_agent = (payload.userAgent or request.headers.get("user-agent") or "").strip()
    if not user_agent:
        raise HTTPException(status_code=400, detail="userAgent is required")

    ip = (payload.ip or "").strip() or None
    metadata = jsonable_encoder(payload.metadata) if payload.metadata is not None else None

    occurred_at = datetime.now(timezone.utc)
    if payload.occurredAt:
        parsed = _parse_datetime(payload.occurredAt)
        if not parsed:
            raise HTTPException(status_code=400, detail="occurredAt must be a valid date")
        occurred_at = parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)

    record = {
        "event_id": str(uuid.uuid4()),
        "path": path,
        "domain": domain,
        "user_agent": user_agent,
        "ip": ip,
        "metadata": metadata,
        "store_platform": reporter["platform"],
        "store_id": reporter["id"],
        "occurred_at": occurred_at.astimezone(timezone.utc).isoformat(),
    }

    def _insert() -> Any:
        return supabase.table("crawler_events").insert(record).execute()

    result = await run_in_threadpool(_insert)
    error = getattr(result, "error", None)
    if error:
        logger.error("[report-crawl] Supabase insert failed: %s", error)
        raise HTTPException(status_code=500, detail="Failed to log crawler event")

    return {"status": "accepted"}
