from datetime import datetime

from sqlmodel import Field, SQLModel


class Case(SQLModel, table=True):
    __tablename__ = "cases"

    id: int | None = Field(default=None, primary_key=True)
    case_code: str | None = Field(default=None, index=True)
    title: str = Field(index=True)
    domain: str = Field(index=True)
    public_demands_json: str = Field(default="[]")
    heat_level: int = Field(default=3, index=True)
    response_speed: str | None = None
    effect_score: int | None = Field(default=None)
    strategy_types_json: str = Field(default="[]")
    event_description: str = Field(default="")
    strategy_text: str = Field(default="")
    vertical_subject: str | None = None
    carrier_target: str | None = None
    trigger_reason: str | None = None
    risk_tags_json: str = Field(default="[]")
    notes: str | None = None
    enabled: bool = Field(default=True, index=True)
    embedding_status: str = Field(default="none", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class CaseEmbedding(SQLModel, table=True):
    __tablename__ = "case_embeddings"

    id: int | None = Field(default=None, primary_key=True)
    case_id: int = Field(index=True, foreign_key="cases.id")
    embedding_text: str = Field(default="")
    embedding_json: str = Field(default="[]")  # JSON list[float]
    model_name: str = Field(default="")
    dimensions: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
