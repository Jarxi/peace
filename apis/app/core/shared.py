from __future__ import annotations

import json
import logging
import os
from functools import lru_cache
from json import JSONDecodeError
from typing import Any, Dict, List, Mapping, Optional, cast
from urllib.parse import parse_qs, urlparse

from supabase import Client, create_client

logger = logging.getLogger(__name__)


class ReporterAuthError(Exception):
    """Raised when the reporter authentication fails."""


@lru_cache
def get_supabase_client() -> Client:
    """Return a cached Supabase client using service role credentials."""
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
    return create_client(url, key)


def extract_host(value: str | None) -> Optional[str]:
    if not value:
        return None
    trimmed = value.strip()
    if not trimmed:
        return None
    try:
        if trimmed.startswith("http://") or trimmed.startswith("https://"):
            return urlparse(trimmed).netloc or None
        while trimmed.startswith('/'):
            trimmed = trimmed[1:]
        return trimmed.split('/')[0] or None
    except ValueError:
        return None


def normalize_allowed_domains(value: Any) -> List[str]:
    if not value:
        return []

    normalized: List[str] = []

    if isinstance(value, list):
        for item in value:
            if isinstance(item, str):
                host = extract_host(item) or item.strip()
                if host:
                    normalized.append(host)
            elif isinstance(item, Mapping):
                normalized.extend(normalize_allowed_domains(item))
    elif isinstance(value, str):
        candidate = value.strip()
        if not candidate:
            return normalized

        if candidate in {"[]", "{}", "null"}:
            return normalized

        try:
            parsed = json.loads(candidate)
        except JSONDecodeError:
            parsed = None

        if isinstance(parsed, list):
            normalized.extend(normalize_allowed_domains(parsed))
            return normalized
        if isinstance(parsed, Mapping):
            normalized.extend(normalize_allowed_domains(parsed.get("domains")))
            return normalized

        host = extract_host(candidate) or candidate
        if host:
            normalized.append(host)
    elif isinstance(value, Mapping):
        maybe_domains = value.get("domains")
        if isinstance(maybe_domains, list):
            normalized.extend(normalize_allowed_domains(maybe_domains))

    # Remove duplicates while preserving order
    seen = set()
    deduped: List[str] = []
    for host in normalized:
        if host not in seen:
            deduped.append(host)
            seen.add(host)

    return deduped


def detect_source(path: str | None, metadata: Any) -> str:
    referer = ""
    if isinstance(metadata, Mapping):
        raw_referer = metadata.get("referer")
        if isinstance(raw_referer, str):
            referer = raw_referer

    referer_lower = referer.lower()
    path_lower = (path or "").lower()

    if "gemini.google.com" in referer_lower:
        return "gemini"
    if "chatgpt" in referer_lower:
        return "chatgpt"
    if "gemini" in referer_lower:
        return "gemini"
    if "utm_source=chatgpt.com" in path_lower:
        return "chatgpt"
    if "copilot" in referer_lower:
        return "copilot"
    if "claude" in referer_lower:
        return "claude"
    if "perplexity" in referer_lower:
        return "perplexity"
    if "mistral" in referer_lower:
        return "mistral"
    if "openai" in referer_lower:
        return "chatgpt"
    if "google.com" in referer_lower:
        return "google"
    if "com.google" in referer_lower:
        return "google"
    if "facebook.com" in referer_lower:
        return "facebook"
    if "instagram.com" in referer_lower:
        return "instagram"
    if "youtube.com" in referer_lower:
        return "youtube"
    if "bing.com" in referer_lower:
        return "bing"
    if "pinterest" in referer_lower:
        return "pinterest"
    if "duckduckgo.com" in referer_lower:
        return "duckduckgo"
    if "reddit" in referer_lower:
        return "reddit"
    return "other"


def get_origin(headers: Mapping[str, str]) -> Optional[str]:
    origin = headers.get("origin")
    if origin:
        return origin
    referer = headers.get("referer")
    if not referer:
        return None
    try:
        parsed = urlparse(referer)
        if parsed.scheme and parsed.netloc:
            return f"{parsed.scheme}://{parsed.netloc}"
    except ValueError:
        return None
    return None


def authLegacy(
    source_header: str,
    domain_host: Optional[str],
    client: Client,
) -> Dict[str, str]:
    platform, store_id = _parse_source_header(source_header, ":")
    try:
        response = (
            client
            .table("event_report_sources")
            .select("status, allowed_domains")
            .eq("store_platform", platform)
            .eq("store_id", store_id)
            .execute()
        )
    except Exception as exc:  # pragma: no cover - network failure logging
        logger.error("[auth] Failed to fetch event_report_sources", exc_info=exc)
        raise ReporterAuthError("Unable to validate reporter") from exc

    data = getattr(response, "data", None) or []
    if not data:
        raise ReporterAuthError("Reporter not registered")

    record = data[0]
    status = str(record.get("status", "")).lower()
    if status != "active":
        raise ReporterAuthError("Reporter is not active")

    if domain_host:
        allowed = normalize_allowed_domains(record.get("allowed_domains"))
        if allowed:
            matches = any(
                domain_host == allowed_host or domain_host.endswith(f".{allowed_host}")
                for allowed_host in allowed
            )
            if not matches:
                raise ReporterAuthError("Domain not permitted for reporter")

    return {"platform": platform, "id": store_id}


def shopifyAuth(
    platform: str,
    store_id: str,
    domain_host: Optional[str],
    client: Client,
) -> Dict[str, str]:
    normalized_platform = platform.strip().lower()
    try:
        response = (
            client
            .table("vendor_store_claim_state")
            .select("store_info")
            .eq("platform_id", normalized_platform)
            .eq("store_id", store_id)
            .limit(1)
            .execute()
        )
    except Exception as exc:  # pragma: no cover - network failure logging
        logger.error("[auth] Failed to fetch vendor_store_claim_state", exc_info=exc)
        raise ReporterAuthError("Unable to validate reporter") from exc

    data = getattr(response, "data", None) or []
    if not data:
        raise ReporterAuthError("Shopify reporter not registered")

    raw_store_info = data[0].get("store_info")
    store_info: Mapping[str, Any] | None
    if isinstance(raw_store_info, Mapping):
        store_info = cast(Mapping[str, Any], raw_store_info)
    elif isinstance(raw_store_info, str):
        try:
            decoded = json.loads(raw_store_info)
        except JSONDecodeError:
            store_info = None
        else:
            store_info = decoded if isinstance(decoded, Mapping) else None
    else:
        store_info = None

    if not store_info:
        raise ReporterAuthError("Store information unavailable for Shopify reporter")

    allowed_hosts: List[str] = []

    def add_allowed_host(value: Optional[str]) -> None:
        if not value:
            return
        host = extract_host(value)
        if host and host not in allowed_hosts:
            allowed_hosts.append(host)

    primary_domain = store_info.get("primaryDomain")
    if isinstance(primary_domain, Mapping):
        primary_host = primary_domain.get("host")
        if isinstance(primary_host, str):
            add_allowed_host(primary_host)
        primary_url = primary_domain.get("url")
        if isinstance(primary_url, str):
            add_allowed_host(primary_url)

    myshopify_domain = store_info.get("myshopifyDomain")
    if isinstance(myshopify_domain, str):
        add_allowed_host(myshopify_domain)

    if not allowed_hosts:
        raise ReporterAuthError("No allowed domains configured for Shopify reporter")

    if domain_host:
        matches = any(
            domain_host == allowed_host or domain_host.endswith(f".{allowed_host}")
            for allowed_host in allowed_hosts
        )
        if not matches:
            raise ReporterAuthError("Domain not permitted for reporter")

    return {"platform": platform, "id": store_id}


def authenticate_by_platform(
    source_header: str,
    domain_host: Optional[str],
    client: Client,
) -> Dict[str, str]:
    platform, store_id = _parse_source_header(source_header, ";")
    match platform.lower():
        case "shopify":
            return shopifyAuth(platform, store_id, domain_host, client)
        case _:
            raise ReporterAuthError("Reporter authentication not supported for platform")


def _parse_source_header(source_header: str, separator: str) -> tuple[str, str]:
    if not source_header:
        raise ValueError("Missing X-Source-Id header")
    trimmed = source_header.strip()
    platform, sep, store_id = trimmed.partition(separator)
    if not sep or not platform or not store_id:
        raise ValueError("Malformed X-Source-Id header")
    return platform, store_id


def authenticate_reporter(
    source_header: str,
    domain_host: Optional[str],
    client: Client,
) -> Dict[str, str]:
    legacy_error: Optional[ReporterAuthError] = None
    try:
        return authLegacy(source_header, domain_host, client)
    except ReporterAuthError as exc:
        legacy_error = exc

    try:
        return authenticate_by_platform(source_header, domain_host, client)
    except ReporterAuthError as exc:
        raise legacy_error or exc


__all__ = [
    "ReporterAuthError",
    "authenticate_reporter",
    "detect_source",
    "extract_host",
    "get_origin",
    "get_supabase_client",
]
