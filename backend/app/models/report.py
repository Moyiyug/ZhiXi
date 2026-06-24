from datetime import datetime

from sqlmodel import Field, SQLModel


class Report(SQLModel, table=True):
    __tablename__ = "reports"

    id: int | None = Field(default=None, primary_key=True)
    input_event_text: str = ""
    profile_json: str = Field(default="{}")
    evidence_pack_json: str = Field(default="{}")
    status: str = Field(default="draft", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ReportSegment(SQLModel, table=True):
    __tablename__ = "report_segments"

    id: int | None = Field(default=None, primary_key=True)
    report_id: int = Field(index=True, foreign_key="reports.id")
    segment_key: str = Field(index=True)
    title: str = ""
    content_md: str = ""
    model_name: str | None = None
    generation_status: str = Field(default="pending")
    regenerated_count: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
