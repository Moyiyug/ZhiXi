from sqlmodel import Session, func, select

from app.core.config import settings
from app.models.case import Case
from app.schemas.event import CurrentEventProfile
from app.schemas.rag import EvidencePackResponse
from app.services.dictionary_service import get_dictionaries
from app.services.retrieval_service import RetrievalService
from app.utils.case_evidence import build_case_feature_stats


class EvidencePackService:
    def __init__(self, session: Session):
        self.session = session

    def build(self, event_text: str, profile: CurrentEventProfile,
              top_k: int = 3) -> EvidencePackResponse:
        svc = RetrievalService(self.session)
        retrieve_result = svc.retrieve(event_text, profile, top_k)
        dicts = get_dictionaries(self.session)
        retrieved_cases = retrieve_result["results"]

        hints: dict = {
            "public_demands": [i for i in dicts.get("public_demands", [])
                             if i["key"] in profile.public_demands],
            "strategy_types": dicts.get("strategy_types", []),
            "heat_levels": dicts.get("heat_levels", []),
        }
        scores = [round(c.final_score, 4) for c in retrieved_cases]
        enabled_case_rows = self.session.exec(select(Case).where(Case.enabled)).all()
        context_metrics = {
            "case_library": {
                "total_cases": self.session.exec(select(func.count()).select_from(Case)).one(),
                "enabled_cases": self.session.exec(
                    select(func.count()).select_from(Case).where(Case.enabled)
                ).one(),
                "embedding_ready_cases": self.session.exec(
                    select(func.count()).select_from(Case).where(Case.embedding_status == "ready")
                ).one(),
            },
            "retrieval": {
                **retrieve_result.get("diagnostics", {}),
                "score_weights": {
                    "semantic": settings.weight_semantic,
                    "demand": settings.weight_demand,
                    "heat": settings.weight_heat,
                    "domain": settings.weight_domain,
                    "effect": settings.weight_effect,
                },
                "final_scores": scores,
                "average_final_score": round(sum(scores) / len(scores), 4) if scores else 0.0,
                "same_domain_hits": sum(1 for c in retrieved_cases if c.domain == profile.domain),
            },
            "case_feature_stats": build_case_feature_stats(enabled_case_rows),
        }

        return EvidencePackResponse(
            current_event=profile,
            query_text=retrieve_result["query_text"],
            retrieved_cases=retrieved_cases,
            dictionary_hints=hints,
            context_metrics=context_metrics,
            limitations=[
                "当前案例库为课程项目小样本案例库。",
                "检索结果仅表示参考匹配度，不代表真实策略有效性。",
                "报告不得虚构全网传播数据、热搜排名或真实处置结论。",
            ],
        )
