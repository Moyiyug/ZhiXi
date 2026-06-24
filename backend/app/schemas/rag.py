from pydantic import BaseModel, Field

from app.schemas.event import CurrentEventProfile


class RetrieveRequest(BaseModel):
    event_text: str = Field(..., min_length=50, max_length=800)
    profile: CurrentEventProfile
    top_k: int = Field(default=3, ge=1, le=10)


class RetrievedCaseItem(BaseModel):
    case_id: int
    title: str
    domain: str
    event_description: str
    strategy_text: str
    semantic_score: float
    demand_score: float
    heat_score: float
    domain_score: float
    effect_score: float
    final_score: float
    explanation: str


class RetrieveResponse(BaseModel):
    query_text: str
    results: list[RetrievedCaseItem]


class EvidencePackResponse(BaseModel):
    current_event: CurrentEventProfile
    query_text: str
    retrieved_cases: list[RetrievedCaseItem]
    dictionary_hints: dict
    limitations: list[str]
