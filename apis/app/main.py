from __future__ import annotations

import logging
import os

from fastapi import FastAPI, Response, status
from fastapi.middleware.cors import CORSMiddleware

from app.core.shared import get_supabase_client
from app.routers import router as api_router

logger = logging.getLogger(__name__)

app = FastAPI(title="Mountain Freedom API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["POST", "OPTIONS"],
    allow_headers=["Authorization", "X-Source-Id", "Content-Type"],
    max_age=600,
)

app.include_router(api_router)


@app.on_event("startup")
def validate_supabase_settings() -> None:
    """Ensure Supabase credentials are present at startup."""
    try:
        get_supabase_client()
    except Exception as exc:  # pragma: no cover - startup guard
        logger.error("Supabase configuration invalid", exc_info=exc)
        raise


@app.options("/{full_path:path}")
def options_any(full_path: str) -> Response:
    """Handle CORS preflight requests."""
    return Response(status_code=status.HTTP_204_NO_CONTENT)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 4000)),
        reload=os.environ.get("RELOAD", "false").lower() == "true",
    )
