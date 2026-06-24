from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.db.session import get_session

router = APIRouter(prefix="/api", tags=["embeddings"])


@router.post("/cases/{case_id}/embedding")
def generate_embedding(case_id: int, session: Session = Depends(get_session)) -> dict:
    from app.services.embedding_service import generate_embedding_svc

    generate_embedding_svc(case_id, session)
    return {"case_id": case_id, "status": "ready"}


@router.post("/cases/rebuild-embeddings")
def rebuild_embeddings(session: Session = Depends(get_session)) -> dict:
    from sqlmodel import select

    from app.models.case import Case
    from app.services.embedding_service import generate_embedding_svc

    stmt = select(Case).where(Case.enabled).where(Case.embedding_status != "ready")
    cases = session.exec(stmt).all()
    for c in cases:
        generate_embedding_svc(c.id, session)
    return {"rebuilt": len(cases)}
