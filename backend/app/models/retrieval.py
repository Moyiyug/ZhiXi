from datetime import datetime

from sqlmodel import Field, SQLModel


class RetrievalRun(SQLModel, table=True):
    __tablename__ = "retrieval_runs"

    id: int | None = Field(default=None, primary_key=True)
    query_text: str = ""
    profile_json: str = Field(default="{}")
    top_n: int = Field(default=10)
    top_k: int = Field(default=3)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class LLMCallLog(SQLModel, table=True):
    __tablename__ = "llm_call_logs"

    id: int | None = Field(default=None, primary_key=True)
    call_type: str = Field(index=True)
    model_name: str = ""
    prompt_preview: str = ""
    response_preview: str = ""
    duration_ms: int | None = None
    status: str = Field(default="ok")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class AppSetting(SQLModel, table=True):
    __tablename__ = "app_settings"

    id: int | None = Field(default=None, primary_key=True)
    key: str = Field(unique=True, index=True)
    value: str = ""
    updated_at: datetime = Field(default_factory=datetime.utcnow)
