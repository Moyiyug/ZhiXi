from sqlmodel import Session

from app.schemas.event import CurrentEventProfile
from app.schemas.rag import EvidencePackResponse
from app.services.dictionary_service import get_dictionaries
from app.services.retrieval_service import RetrievalService


class EvidencePackService:
    def __init__(self, session: Session):
        self.session = session

    def build(self, event_text: str, profile: CurrentEventProfile,
              top_k: int = 3) -> EvidencePackResponse:
        svc = RetrievalService(self.session)
        retrieve_result = svc.retrieve(event_text, profile, top_k)
        dicts = get_dictionaries(self.session)

        hints: dict = {
            "public_demands": [i for i in dicts.get("public_demands", [])
                             if i["key"] in profile.public_demands],
            "strategy_types": dicts.get("strategy_types", []),
            "heat_levels": dicts.get("heat_levels", []),
        }

        return EvidencePackResponse(
            current_event=profile,
            query_text=retrieve_result["query_text"],
            retrieved_cases=retrieve_result["results"],
            dictionary_hints=hints,
            limitations=[
                "当前案例库为课程项目小样本案例库。",
                "检索结果仅表示参考匹配度，不代表真实策略有效性。",
                "报告不得虚构全网传播数据、热搜排名或真实处置结论。",
            ],
        )
