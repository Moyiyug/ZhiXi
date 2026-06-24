from pydantic import BaseModel


class DictItemResponse(BaseModel):
    key: str
    label: str
    meaning: str = ""
    report_hint: str = ""
    speech_hint: str = ""
    risk_hint: str = ""
    domain_relations: dict[str, float] | None = None


class DictionaryResponse(BaseModel):
    public_demands: list[DictItemResponse] = []
    heat_levels: list[DictItemResponse] = []
    strategy_types: list[DictItemResponse] = []
    domain_labels: list[DictItemResponse] = []
    domain_relations: list[DictItemResponse] = []
