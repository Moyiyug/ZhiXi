from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.db.session import get_session
from app.schemas.rag import EvidencePackResponse, RetrieveRequest, RetrieveResponse

router = APIRouter(prefix="/api", tags=["rag"])


@router.post("/rag/retrieve")
def retrieve(body: RetrieveRequest, session: Session = Depends(get_session)) -> RetrieveResponse:
    from app.services.retrieval_service import RetrievalService

    svc = RetrievalService(session)
    results = svc.retrieve(body.event_text, body.profile, body.top_k)
    return RetrieveResponse(
        query_text=results["query_text"],
        results=results["results"],
    )


@router.post("/rag/evidence-pack")
def build_evidence_pack(body: RetrieveRequest, session: Session = Depends(get_session)) -> EvidencePackResponse:
    from app.services.evidence_pack_service import EvidencePackService

    svc = EvidencePackService(session)
    return svc.build(body.event_text, body.profile, body.top_k)
