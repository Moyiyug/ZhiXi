from datetime import datetime

from sqlmodel import JSON, Column, Field, SQLModel


class BackgroundDictItem(SQLModel, table=True):
    __tablename__ = "background_dict_items"

    id: int | None = Field(default=None, primary_key=True)
    category: str = Field(index=True)  # public_demands, heat_levels, strategy_types, domain_labels, domain_relations
    key: str = Field(index=True)
    label: str = ""
    meaning: str = ""
    report_hint: str = ""
    speech_hint: str = ""
    risk_hint: str = ""
    extra_json: dict | None = Field(default=None, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)
