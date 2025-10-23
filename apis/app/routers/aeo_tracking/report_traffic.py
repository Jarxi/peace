from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Mapping, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.concurrency import run_in_threadpool
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel
from supabase import Client

from app.core.shared import (
    ReporterAuthError,
    authenticate_reporter,
    detect_source,
    extract_host,
    get_origin,
    get_supabase_client,
)

router = APIRouter()
logger = logging.getLogger(__name__)


class ReportTrafficPayload(BaseModel):
    domain: Optional[str] = None
    path: Optional[str] = None
    type: Optional[str] = None
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


def _merge_sources(existing: Optional[str], new: str) -> str:
    normalized_new = (new or "").strip()
    existing_tokens: list[str] = []

    if existing:
        for raw in existing.split(","):
            token = raw.strip()
            if token:
                existing_tokens.append(token)

    ordered_candidates: list[str] = []
    if normalized_new:
        ordered_candidates.append(normalized_new)
    ordered_candidates.extend(existing_tokens)

    deduped: list[str] = []
    seen = set()
    for token in ordered_candidates:
        key = token.casefold()
        if not token or key in seen:
            continue
        deduped.append(token)
        seen.add(key)

    if not deduped:
        return ""

    has_non_other = any(token.casefold() != "other" for token in deduped)
    if has_non_other:
        deduped = [token for token in deduped if token.casefold() != "other"]

    if not deduped:
        return "other"

    return ", ".join(deduped)


@router.post("/report-traffic/v0", status_code=status.HTTP_202_ACCEPTED)
async def report_traffic(
    payload: ReportTrafficPayload,
    request: Request,
    supabase: Client = Depends(get_supabase_client),
) -> dict[str, str]:
    domain = (payload.domain or "").strip()
    if not domain:
        raise HTTPException(status_code=400, detail="domain is required")

    headers = {k.lower(): v for k, v in request.headers.items()}
    origin = get_origin(headers)

    source_header = headers.get("x-source-id")
    if not source_header:
        raise HTTPException(status_code=400, detail="Missing X-Source-Id header")

    origin_host = extract_host(origin)
    domain_host = extract_host(domain)
    if origin_host and domain_host and origin_host != domain_host:
        raise HTTPException(status_code=400, detail="domain does not match request origin")

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
    detected_source = detect_source(path, payload.metadata)
    merged_source = detected_source
    existing_rows: list[Mapping[str, Any]] = []
    select_error: Any = None
    current_source: Optional[str] = None

    occurred_at = datetime.now(timezone.utc)
    if payload.occurredAt:
        parsed = _parse_datetime(payload.occurredAt)
        if not parsed:
            raise HTTPException(status_code=400, detail="occurredAt must be a valid date")
        occurred_at = parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)

    raw_metadata = payload.metadata
    client_id: Optional[str] = None
    if isinstance(raw_metadata, Mapping):
        raw_client_id = raw_metadata.get("clientId") or raw_metadata.get("client_id")
        if isinstance(raw_client_id, str):
            candidate = raw_client_id.strip()
            if candidate:
                client_id = candidate
    metadata = jsonable_encoder(raw_metadata) if raw_metadata is not None else None

    filters = None
    if client_id:
        filters = {
            "platform_id": reporter["platform"],
            "store_id": reporter["id"],
            "client_id": client_id,
        }

        def _fetch_client_source() -> Any:
            return (
                supabase
                .table("vendor_client_source")
                .select("source")
                .match(filters)
                .limit(1)
                .execute()
            )

        fetch_result = await run_in_threadpool(_fetch_client_source)
        select_error = getattr(fetch_result, "error", None)
        if select_error:
            logger.error(
                "[report-traffic] Failed to load vendor_client_source for merge: %s",
                select_error,
            )
        else:
            data = getattr(fetch_result, "data", None)
            if isinstance(data, list):
                existing_rows = data
            if existing_rows:
                first_row = existing_rows[0] or {}
                raw_source = first_row.get("source")
                if isinstance(raw_source, str):
                    current_source = raw_source
            merged_source = _merge_sources(current_source, detected_source)

    primary_source = merged_source.split(",", 1)[0].strip() if merged_source else (detected_source or "")

    record = {
        "event_id": str(uuid.uuid4()),
        "store_platform": reporter["platform"],
        "store_id": reporter["id"],
        "domain": domain,
        "path": path,
        "type": (payload.type or "generic").strip() or "generic",
        "occurred_at": occurred_at.astimezone(timezone.utc).isoformat(),
        "metadata": metadata,
        "primary_source": primary_source,
    }

    if client_id and filters and not select_error:
        def _sync_client_source() -> Any:
            if existing_rows and current_source == merged_source:
                return None

            if existing_rows:
                return (
                    supabase
                    .table("vendor_client_source")
                    .update({"source": merged_source})
                    .match(filters)
                    .execute()
                )

            return (
                supabase
                .table("vendor_client_source")
                .insert({**filters, "source": merged_source})
                .execute()
            )

        sync_result = await run_in_threadpool(_sync_client_source)
        sync_error = getattr(sync_result, "error", None) if sync_result is not None else None
        if sync_error:
            logger.error(
                "[report-traffic] Failed to sync vendor_client_source: %s",
                sync_error,
            )

    def _insert() -> Any:
        return supabase.table("traffic_events").insert(record).execute()

    result = await run_in_threadpool(_insert)
    error = getattr(result, "error", None)
    if error:
        logger.error("[report-traffic] Supabase insert failed: %s", error)
        raise HTTPException(status_code=500, detail="Failed to log traffic event")

    return {"status": "accepted"}
