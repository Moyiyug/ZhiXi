from pydantic import BaseModel, Field


class ManualHints(BaseModel):
    domain: str | None = None
    heat_level: int | None = Field(default=None, ge=1, le=5)
    public_demands: list[str] | None = None


class ProfileRequest(BaseModel):
    event_text: str = Field(..., min_length=50, max_length=800)
    manual_hints: ManualHints | None = None


class CurrentEventProfile(BaseModel):
    event_summary: str
    domain: str
    public_demands: list[str]
    heat_level: int = Field(ge=1, le=5)
    risk_keywords: list[str]
    platforms: list[str] = []
    inferred_strategy_direction: list[str] = []
    confidence: float = Field(ge=0.0, le=1.0)
    profile_source: str  # 'llm' | 'rule' | 'manual' | 'mixed'
