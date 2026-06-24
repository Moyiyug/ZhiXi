
from sqlmodel import Session, select

from app.models.evaluation import DemoEvent
from app.services.profile_service import ProfileService
from app.services.retrieval_service import RetrievalService


class EvaluationService:
    def __init__(self, session: Session):
        self.session = session

    def run_demo(self, demo_event_id: str | None = None,
                 event_text: str | None = None, top_k: int = 3) -> dict:
        if demo_event_id:
            stmt = select(DemoEvent).where(DemoEvent.demo_event_id == demo_event_id)
            demo = self.session.exec(stmt).first()
            if not demo:
                return {"error": f"Demo event '{demo_event_id}' not found"}
            event_text = demo.event_text
            event_id = demo.demo_event_id
        elif event_text:
            event_id = "custom"
        else:
            return {"error": "Provide demo_event_id or event_text"}

        profile_svc = ProfileService(self.session)
        profile = profile_svc.generate_profile(event_text)
        retrieve_svc = RetrievalService(self.session)
        results_data = retrieve_svc.retrieve(event_text, profile, top_k)
        results = results_data["results"]
        avg_score = sum(r.final_score for r in results) / len(results) if results else 0.0
        return {
            "event_id": event_id,
            "profile": profile.model_dump(),
            "results": [r.model_dump() for r in results],
            "metrics": {
                "top_k": top_k,
                "average_final_score": round(avg_score, 4),
                "has_same_domain_hit": any(r.domain == profile.domain for r in results),
            },
            "manual_score": {
                "relevance": None,
                "actionability": None,
                "risk_control": None,
                "expression_quality": None,
            },
        }
