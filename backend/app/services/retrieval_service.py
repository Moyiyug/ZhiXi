import json
from datetime import UTC, datetime

from sqlmodel import Session, select

from app.clients.model_clients import get_embedding_client
from app.core.config import settings
from app.core.logging import logger
from app.models.case import Case, CaseEmbedding
from app.models.retrieval import RetrievalRun
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
        client = get_embedding_client()
        logger.debug(f"Using embedding client model={client.model}")
        query_vec = client.embed(query_text)
        domain_relations = get_domain_relations(self.session)
        reranker = RerankService()

        stmt = (
            select(Case, CaseEmbedding)
            .join(CaseEmbedding, Case.id == CaseEmbedding.case_id)
            .where(Case.enabled)
            .where(Case.embedding_status == "ready")
        )
        rows = self.session.exec(stmt).all()
        routed_rows = []
        for case, emb in rows:
            route_score, route_dimensions, route_reason = reranker.route_match(
                case, profile, domain_relations
            )
            routed_rows.append({
                "case": case,
                "embedding": emb,
                "route_score": route_score,
                "route_dimensions": route_dimensions,
                "route_reason": route_reason,
            })

        routed_rows.sort(key=lambda item: item["route_score"], reverse=True)
        route_pool_size = min(
            len(routed_rows),
            max(settings.retrieval_top_n * 3, top_k * 5, settings.retrieval_top_n),
        )
        strong_route_rows = [
            item for item in routed_rows
            if item["route_score"] >= 0.35 and "全局兜底" not in item["route_dimensions"]
        ]
        selected_rows = strong_route_rows[:route_pool_size]
        selected_ids = {item["case"].id for item in selected_rows}
        if len(selected_rows) < min(settings.retrieval_top_n, len(routed_rows)):
            for item in routed_rows:
                if item["case"].id in selected_ids:
                    continue
                selected_rows.append(item)
                selected_ids.add(item["case"].id)
                if len(selected_rows) >= route_pool_size:
                    break

        candidates = []
        for item in selected_rows:
            case = item["case"]
            emb = item["embedding"]
            case_vec = json.loads(emb.embedding_json)
            sim = cosine_similarity(query_vec, case_vec)
            candidates.append({
                "case": case,
                "semantic_score": sim,
                "route_score": item["route_score"],
                "route_dimensions": item["route_dimensions"],
                "route_reason": item["route_reason"],
            })

        candidates.sort(key=lambda x: x["semantic_score"], reverse=True)
        top_n = candidates[: settings.retrieval_top_n]

        results = reranker.rerank(top_n, profile, dicts, domain_relations, top_k)

        # Log retrieval run
        run = RetrievalRun(
            query_text=query_text,
            profile_json=profile.model_dump_json(),
            top_n=settings.retrieval_top_n,
            top_k=top_k,
            created_at=datetime.now(UTC),
        )
        self.session.add(run)
        self.session.commit()

        return {
            "query_text": query_text,
            "results": results,
            "diagnostics": {
                "candidate_count": len(rows),
                "routed_candidate_count": len(routed_rows),
                "route_pool_count": len(selected_rows),
                "top_n": len(top_n),
                "top_k": top_k,
                "retrieval_top_n_config": settings.retrieval_top_n,
                "routing": {
                    "enabled": True,
                    "profile_route": {
                        "domain": profile.domain,
                        "heat_level": profile.heat_level,
                        "public_demands": profile.public_demands,
                        "platforms": profile.platforms,
                        "risk_keywords": profile.risk_keywords[:6],
                    },
                    "route_threshold": 0.35,
                    "top_route_scores": [
                        {
                            "case_id": item["case"].id,
                            "title": item["case"].title,
                            "route_score": item["route_score"],
                            "dimensions": item["route_dimensions"],
                        }
                        for item in routed_rows[:5]
                    ],
                },
            },
        }
