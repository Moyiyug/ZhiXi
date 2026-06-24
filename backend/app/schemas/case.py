from datetime import datetime

from pydantic import BaseModel, Field


class CaseCreate(BaseModel):
    case_code: str | None = None
    title: str = Field(..., min_length=1)
    domain: str
    public_demands: list[str] = Field(default_factory=list)
    heat_level: int = Field(default=3, ge=1, le=5)
    response_speed: str | None = None
    effect_score: int | None = Field(default=None, ge=1, le=5)
    strategy_types: list[str] = Field(default_factory=list)
    event_description: str = ""
    strategy_text: str = ""
    vertical_subject: str | None = None
    carrier_target: str | None = None
    trigger_reason: str | None = None
    risk_tags: list[str] = Field(default_factory=list)
    notes: str | None = None


class CaseUpdate(BaseModel):
    title: str | None = None
    domain: str | None = None
    public_demands: list[str] | None = None
    heat_level: int | None = Field(default=None, ge=1, le=5)
    response_speed: str | None = None
    effect_score: int | None = Field(default=None, ge=1, le=5)
    strategy_types: list[str] | None = None
    event_description: str | None = None
    strategy_text: str | None = None
    vertical_subject: str | None = None
    carrier_target: str | None = None
    trigger_reason: str | None = None
    risk_tags: list[str] | None = None
    notes: str | None = None


class CaseResponse(BaseModel):
    id: int
    case_code: str | None
    title: str
    domain: str
    public_demands: list[str]
    heat_level: int
    response_speed: str | None
    effect_score: int | None
    strategy_types: list[str]
    event_description: str
    strategy_text: str
    vertical_subject: str | None
    carrier_target: str | None
    trigger_reason: str | None
    risk_tags: list[str]
    notes: str | None
    enabled: bool
    embedding_status: str
    created_at: datetime
    updated_at: datetime


class CaseListResponse(BaseModel):
    items: list[CaseResponse]
    total: int
    page: int
    page_size: int


class CaseSummary(BaseModel):
    id: int
    title: str
    domain: str
    heat_level: int
    effect_score: int | None
    enabled: bool
    embedding_status: str
