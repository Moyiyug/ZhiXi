from fastapi import APIRouter

from app.core.config import settings

router = APIRouter(tags=["health"])


@router.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "mock_mode": settings.app_mock_mode,
        "database": "ok",
    }
