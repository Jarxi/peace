from fastapi import APIRouter

from .aeo_tracking import router as aeo_tracking_router

router = APIRouter()
router.include_router(aeo_tracking_router)

__all__ = ["router"]
