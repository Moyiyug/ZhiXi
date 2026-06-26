from pydantic import BaseModel, Field

from app.schemas.event import CurrentEventProfile


class RetrieveRequest(BaseModel):
    event_text: str = Field(..., min_length=50, max_length=800)
    profile: CurrentEventProfile
    top_k: int = Field(default=3, ge=1, le=10)


class CaseEvidenceFragments(BaseModel):
    event_overview: str = ""
    evolution_path: str = ""
    propagation_chain: str = ""
    impact_scope: str = ""
    response_actions: str = ""
    outcome_feedback: str = ""
    action_checkpoints: list[str] = Field(default_factory=list)


class RetrievedCaseItem(BaseModel):
    case_id: int
    title: str
    domain: str
    heat_level: int | None = None
    response_speed: str | None = None
    effect_score_raw: int | None = None
    public_demands: list[str] = Field(default_factory=list)
    strategy_types: list[str] = Field(default_factory=list)
    risk_tags: list[str] = Field(default_factory=list)
    vertical_subject: str | None = None
    carrier_target: str | None = None
    trigger_reason: str | None = None
    event_description: str
    strategy_text: str
    route_score: float = 0.0
    route_dimensions: list[str] = Field(default_factory=list)
    route_reason: str = ""
    semantic_score: float
    demand_score: float
    heat_score: float
    domain_score: float
    effect_score: float
    final_score: float
    explanation: str
    evidence_fragments: CaseEvidenceFragments = Field(default_factory=CaseEvidenceFragments)
    actionability_hint: str = ""


class RetrieveResponse(BaseModel):
    query_text: str
    results: list[RetrievedCaseItem]


class EvidencePackResponse(BaseModel):
    current_event: CurrentEventProfile
    query_text: str
    retrieved_cases: list[RetrievedCaseItem]
    dictionary_hints: dict
    context_metrics: dict = Field(default_factory=dict)
    limitations: list[str]
