import json

from sqlmodel import Session

from app.clients.mock_client import MockEmbeddingClient
from app.core.config import settings
from app.models.case import Case, CaseEmbedding
from app.services.dictionary_service import get_dictionaries
from app.utils.text_builders import build_case_embedding_text


def generate_embedding_svc(case_id: int, session: Session) -> CaseEmbedding:
    case = session.get(Case, case_id)
    if not case:
        raise ValueError(f"Case {case_id} not found")
    dicts = get_dictionaries(session)
    text = build_case_embedding_text(case, dicts)
    client = MockEmbeddingClient(
        model=settings.qwen_embedding_model,
        dimensions=settings.qwen_embedding_dimensions,
    )
    vector = client.embed(text)
    emb = CaseEmbedding(
        case_id=case.id,
        embedding_text=text,
        embedding_json=json.dumps(vector),
        model_name=client.model,
        dimensions=client.dimensions,
    )
    session.add(emb)
    case.embedding_status = "ready"
    session.add(case)
    session.commit()
    session.refresh(emb)
    return emb
