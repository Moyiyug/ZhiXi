from pydantic import BaseModel, Field

from app.schemas.event import CurrentEventProfile
from app.schemas.rag import RetrievedCaseItem


class EvaluationRequest(BaseModel):
    demo_event_id: str | None = None
    event_text: str | None = None
    top_k: int = Field(default=3, ge=1, le=10)
    focus_options: list[str] = Field(default_factory=list)


class EvaluationMetric(BaseModel):
    top_k: int
    average_final_score: float
    has_same_domain_hit: bool
    focus_options: list[str] = Field(default_factory=list)


class ManualScore(BaseModel):
    relevance: int | None = Field(default=None, ge=1, le=5)
    actionability: int | None = Field(default=None, ge=1, le=5)
    risk_control: int | None = Field(default=None, ge=1, le=5)
    expression_quality: int | None = Field(default=None, ge=1, le=5)


class EvaluationResponse(BaseModel):
    event_id: str
    profile: CurrentEventProfile
    results: list[RetrievedCaseItem]
    metrics: EvaluationMetric
    manual_score: ManualScore
