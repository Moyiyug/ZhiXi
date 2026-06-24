import json

from sqlmodel import Session, select

from app.clients.mock_client import MockEmbeddingClient
from app.core.config import settings
from app.core.logging import logger
from app.models.case import Case, CaseEmbedding
from app.schemas.event import CurrentEventProfile
from app.services.dictionary_service import get_dictionaries, get_domain_relations
from app.services.rerank_service import RerankService
from app.utils.text_builders import build_query_text
from app.utils.vectors import cosine_similarity


class RetrievalService:
    def __init__(self, session: Session):
        self.session = session

    def retrieve(self, event_text: str, profile: CurrentEventProfile, top_k: int = 3) -> dict:
        dicts = get_dictionaries(self.session)
        query_text = build_query_text(event_text, profile, dicts)
        use_mock = settings.app_mock_mode or not settings.has_embedding_key
        if use_mock:
            client = MockEmbeddingClient(
                model="mock-embedding",
                dimensions=settings.qwen_embedding_dimensions,
            )
            logger.debug("Using MockEmbeddingClient for query embedding")
        else:
            client = MockEmbeddingClient(
                model=settings.qwen_embedding_model,
                dimensions=settings.qwen_embedding_dimensions,
            )
            logger.info(
                f"Would use real embedding client "
                f"(model={settings.qwen_embedding_model}) — falling back to mock"
            )
        query_vec = client.embed(query_text)

        stmt = (
            select(Case, CaseEmbedding)
            .join(CaseEmbedding, Case.id == CaseEmbedding.case_id)
            .where(Case.enabled)
            .where(Case.embedding_status == "ready")
        )
        rows = self.session.exec(stmt).all()
        candidates = []
        for case, emb in rows:
            case_vec = json.loads(emb.embedding_json)
            sim = cosine_similarity(query_vec, case_vec)
            candidates.append((case, sim))

        candidates.sort(key=lambda x: x[1], reverse=True)
        top_n = candidates[: settings.retrieval_top_n]

        domain_relations = get_domain_relations(self.session)
        reranker = RerankService()
        results = reranker.rerank(top_n, profile, dicts, domain_relations, top_k)
        return {"query_text": query_text, "results": results}
