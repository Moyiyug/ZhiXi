from fastapi import APIRouter, Body, Depends
from sqlmodel import Session

from app.db.session import get_session

router = APIRouter(prefix="/api", tags=["evaluation"])


@router.post("/evaluation/run-demo")
def run_demo_evaluation(
    demo_event_id: str = Body(default=None, embed=True),
    event_text: str = Body(default=None, embed=True),
    top_k: int = Body(default=3, embed=True),
    focus_options: list[str] | None = Body(default=None, embed=True),
    session: Session = Depends(get_session),
) -> dict:
    from app.services.evaluation_service import EvaluationService

    svc = EvaluationService(session)
    return svc.run_demo(
        demo_event_id=demo_event_id,
        event_text=event_text,
        top_k=top_k,
        focus_options=focus_options,
    )
