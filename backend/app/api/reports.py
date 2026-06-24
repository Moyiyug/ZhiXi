from fastapi import APIRouter, Depends
from fastapi.responses import PlainTextResponse
from sqlmodel import Session

from app.db.session import get_session
from app.schemas.report import ReportCreateRequest, ReportResponse

router = APIRouter(prefix="/api", tags=["reports"])


@router.post("/reports", status_code=201)
def create_report(body: ReportCreateRequest, session: Session = Depends(get_session)) -> ReportResponse:
    from app.services.report_generation_service import ReportGenerationService

    svc = ReportGenerationService(session)
    report = svc.create_report(body.input_event_text, body.profile, body.evidence_pack)
    if body.generate_now:
        svc.generate_all_segments(report.id)
        session.refresh(report)
    return svc._to_response(report)


@router.get("/reports/{report_id}")
def get_report(report_id: int, session: Session = Depends(get_session)) -> ReportResponse:
    from app.services.report_generation_service import ReportGenerationService

    svc = ReportGenerationService(session)
    return svc.get_report(report_id)


@router.post("/reports/{report_id}/segments/{segment_key}/regenerate")
def regenerate_segment(report_id: int, segment_key: str, session: Session = Depends(get_session)) -> ReportResponse:
    from app.services.report_generation_service import ReportGenerationService

    svc = ReportGenerationService(session)
    return svc.regenerate_segment(report_id, segment_key)


@router.get("/reports/{report_id}/export.md")
def export_report_md(report_id: int, session: Session = Depends(get_session)) -> PlainTextResponse:
    from app.services.report_generation_service import ReportGenerationService

    svc = ReportGenerationService(session)
    md = svc.export_markdown(report_id)
    return PlainTextResponse(content=md, media_type="text/markdown")
