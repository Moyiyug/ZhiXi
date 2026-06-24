from fastapi import APIRouter, Depends
from sqlmodel import Session, func, select

from app.core.config import settings
from app.db.session import get_session
from app.models.case import Case
from app.models.report import Report

router = APIRouter(prefix="/api", tags=["dashboard"])


@router.get("/dashboard/summary")
def get_summary(session: Session = Depends(get_session)) -> dict:
    case_total = session.exec(select(func.count()).select_from(Case)).one()
    case_enabled = session.exec(
        select(func.count()).select_from(Case).where(Case.enabled)
    ).one()
    embedding_ready = session.exec(
        select(func.count()).select_from(Case).where(Case.embedding_status == "ready")
    ).one()
    report_total = session.exec(select(func.count()).select_from(Report)).one()
    return {
        "case_total": case_total,
        "case_enabled": case_enabled,
        "embedding_ready": embedding_ready,
        "report_total": report_total,
        "mock_mode": settings.app_mock_mode,
    }
