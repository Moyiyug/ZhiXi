from datetime import datetime

from pydantic import BaseModel

from app.schemas.event import CurrentEventProfile
from app.schemas.rag import EvidencePackResponse


class ReportCreateRequest(BaseModel):
    input_event_text: str
    profile: CurrentEventProfile
    evidence_pack: EvidencePackResponse
    generate_now: bool = True


class ReportSegmentResponse(BaseModel):
    id: int
    report_id: int
    segment_key: str  # analysis_and_cases | strategy_and_speech | disclaimer
    title: str
    content_md: str
    model_name: str | None
    generation_status: str  # pending | generating | ready | failed
    regenerated_count: int
    created_at: datetime
    updated_at: datetime


class ReportResponse(BaseModel):
    id: int
    input_event_text: str
    profile: CurrentEventProfile
    evidence_pack: EvidencePackResponse
    status: str
    segments: list[ReportSegmentResponse]
    created_at: datetime
    updated_at: datetime
