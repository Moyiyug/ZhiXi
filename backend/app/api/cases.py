from fastapi import APIRouter, Depends, File, Query, UploadFile
from sqlmodel import Session

from app.db.session import get_session
from app.schemas.case import CaseCreate, CaseListResponse, CaseResponse, CaseUpdate
from app.schemas.common import ImportResult

router = APIRouter(prefix="/api", tags=["cases"])


@router.get("/cases")
def list_cases(
    q: str | None = Query(default=None),
    domain: str | None = Query(default=None),
    enabled: bool | None = Query(default=None),
    embedding_status: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    session: Session = Depends(get_session),
) -> CaseListResponse:
    from app.services.case_service import CaseService

    svc = CaseService(session)
    result = svc.list_cases(q=q, domain=domain, enabled=enabled,
                            embedding_status=embedding_status, page=page, page_size=page_size)
    return CaseListResponse(**result)


@router.post("/cases", status_code=201)
def create_case(body: CaseCreate, session: Session = Depends(get_session)) -> CaseResponse:
    from app.services.case_service import CaseService

    svc = CaseService(session)
    return svc.create(body)


@router.get("/cases/{case_id}")
def get_case(case_id: int, session: Session = Depends(get_session)) -> CaseResponse:
    from app.services.case_service import CaseService

    svc = CaseService(session)
    return svc.get(case_id)


@router.put("/cases/{case_id}")
def update_case(case_id: int, body: CaseUpdate, session: Session = Depends(get_session)) -> CaseResponse:
    from app.services.case_service import CaseService

    svc = CaseService(session)
    return svc.update(case_id, body)


@router.delete("/cases/{case_id}", status_code=204)
def delete_case(case_id: int, session: Session = Depends(get_session)) -> None:
    from app.services.case_service import CaseService

    svc = CaseService(session)
    svc.delete(case_id)


@router.post("/cases/import-csv")
def import_csv(file: UploadFile = File(...), session: Session = Depends(get_session)) -> ImportResult:
    from app.services.csv_import_service import import_csv_from_bytes

    content = file.file.read()
    result = import_csv_from_bytes(content, session)
    return ImportResult(**result)


@router.post("/cases/{case_id}/toggle")
def toggle_case(case_id: int, session: Session = Depends(get_session)) -> CaseResponse:
    from app.services.case_service import CaseService

    svc = CaseService(session)
    return svc.toggle(case_id)
