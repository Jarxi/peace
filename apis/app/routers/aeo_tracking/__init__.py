from fastapi import APIRouter

from . import report_crawl, report_traffic

router = APIRouter()
router.include_router(report_crawl.router)
router.include_router(report_traffic.router)

__all__ = ["router"]
