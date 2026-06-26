import json

from sqlmodel import Session, select

from app.clients.model_clients import get_embedding_client
from app.core.errors import NotFoundError
from app.models.case import Case, CaseEmbedding
from app.services.dictionary_service import get_dictionaries
from app.utils.text_builders import build_case_embedding_text


def generate_embedding_svc(case_id: int, session: Session) -> CaseEmbedding:
    case = session.get(Case, case_id)
    if not case:
        raise NotFoundError("Case not found", "CASE_NOT_FOUND")

    # Mark as pending before generating
    case.embedding_status = "pending"
    session.add(case)
    session.commit()

    dicts = get_dictionaries(session)
    text = build_case_embedding_text(case, dicts)
    client = get_embedding_client()
    try:
        vector = client.embed(text)
        for old_embedding in session.exec(select(CaseEmbedding).where(CaseEmbedding.case_id == case.id)).all():
            session.delete(old_embedding)
        emb = CaseEmbedding(
            case_id=case.id,
            embedding_text=text,
            embedding_json=json.dumps(vector),
            model_name=client.model,
            dimensions=client.dimensions,
        )
        session.add(emb)
        case.embedding_status = "ready"
    except Exception:
        case.embedding_status = "failed"
        session.add(case)
        session.commit()
        raise
    session.add(case)
    session.commit()
    session.refresh(emb)
    return emb
