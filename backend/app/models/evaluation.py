from datetime import datetime

from sqlmodel import Field, SQLModel


class DemoEvent(SQLModel, table=True):
    __tablename__ = "demo_events"

    id: int | None = Field(default=None, primary_key=True)
    demo_event_id: str = Field(unique=True, index=True)
    title: str = ""
    event_text: str = ""
    expected_domain: str | None = None
    expected_demands_json: str = Field(default="[]")
    expected_heat: int | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
