import json

from sqlmodel import Session

from app.clients.mock_client import MockLLMClient
from app.core.config import settings
from app.core.errors import NotFoundError
from app.core.logging import logger
from app.models.report import Report, ReportSegment
from app.prompts.report_segments import SEGMENT_KEY_MAP
from app.schemas.event import CurrentEventProfile
from app.schemas.rag import EvidencePackResponse
from app.schemas.report import ReportResponse, ReportSegmentResponse


class ReportGenerationService:
    def __init__(self, session: Session):
        self.session = session

    def create_report(self, input_event_text: str, profile: CurrentEventProfile,
                      evidence_pack: EvidencePackResponse) -> Report:
        report = Report(
            input_event_text=input_event_text,
            profile_json=profile.model_dump_json(),
            evidence_pack_json=evidence_pack.model_dump_json(),
            status="draft",
        )
        self.session.add(report)
        self.session.commit()
        self.session.refresh(report)
        for seg_key, seg_info in SEGMENT_KEY_MAP.items():
            segment = ReportSegment(
                report_id=report.id,
                segment_key=seg_key,
                title=seg_info["title"],
                content_md="",
                generation_status="pending",
            )
            self.session.add(segment)
        self.session.commit()
        return report

    def generate_all_segments(self, report_id: int) -> None:
        report = self.session.get(Report, report_id)
        if not report:
            raise NotFoundError("Report not found", "REPORT_NOT_FOUND")
        evidence_pack = json.loads(report.evidence_pack_json)
        for seg_key in ["analysis_and_cases", "strategy_and_speech", "disclaimer"]:
            self._generate_segment(report_id, seg_key, evidence_pack)

    def _generate_segment(self, report_id: int, segment_key: str,
                          evidence_pack: dict) -> ReportSegment:
        from sqlmodel import select
        stmt = (select(ReportSegment)
                .where(ReportSegment.report_id == report_id)
                .where(ReportSegment.segment_key == segment_key))
        segment = self.session.exec(stmt).first()
        if not segment:
            raise NotFoundError("Segment not found", "SEGMENT_NOT_FOUND")
        segment.generation_status = "generating"
        self.session.add(segment)
        self.session.commit()
        seg_info = SEGMENT_KEY_MAP.get(segment_key)
        prompt = seg_info["prompt"].format(evidence_pack=json.dumps(evidence_pack, ensure_ascii=False, indent=2))
        use_mock = settings.app_mock_mode or not settings.has_llm_key
        if use_mock:
            client = MockLLMClient()
            model_name = "mock-llm"
            logger.debug("Using MockLLMClient for segment generation")
        else:
            client = MockLLMClient()
            model_name = settings.deepseek_model_fast
            logger.info(f"Would use real LLM client (model={model_name}) — falling back to mock")
        try:
            content = client.chat(prompt, model=model_name)
            segment.content_md = content
            segment.model_name = model_name
            segment.generation_status = "ready"
        except Exception as e:
            logger.error(f"Segment generation failed: {e}")
            segment.generation_status = "failed"
        self.session.add(segment)
        self.session.commit()
        self.session.refresh(segment)
        return segment

    def get_report(self, report_id: int) -> ReportResponse:
        report = self.session.get(Report, report_id)
        if not report:
            raise NotFoundError("Report not found", "REPORT_NOT_FOUND")
        return self._to_response(report)

    def regenerate_segment(self, report_id: int, segment_key: str) -> ReportResponse:
        valid_keys = {"analysis_and_cases", "strategy_and_speech", "disclaimer"}
        if segment_key not in valid_keys:
            raise NotFoundError("Invalid segment key", "INVALID_SEGMENT_KEY")
        report = self.session.get(Report, report_id)
        if not report:
            raise NotFoundError("Report not found", "REPORT_NOT_FOUND")
        evidence_pack = json.loads(report.evidence_pack_json)
        segment = self._generate_segment(report_id, segment_key, evidence_pack)
        segment.regenerated_count += 1
        self.session.add(segment)
        self.session.commit()
        report = self.session.get(Report, report_id)
        return self._to_response(report)

    def export_markdown(self, report_id: int) -> str:
        report = self.session.get(Report, report_id)
        if not report:
            raise NotFoundError("Report not found", "REPORT_NOT_FOUND")
        from sqlmodel import select
        stmt = (select(ReportSegment)
                .where(ReportSegment.report_id == report_id)
                .order_by(ReportSegment.id))
        segments = self.session.exec(stmt).all()
        lines = []
        for seg in segments:
            lines.append(f"## {seg.title}")
            lines.append("")
            lines.append(seg.content_md)
            lines.append("")
        return "\n".join(lines)

    def _to_response(self, report: Report) -> ReportResponse:
        from sqlmodel import select
        stmt = (select(ReportSegment)
                .where(ReportSegment.report_id == report.id)
                .order_by(ReportSegment.id))
        segments = self.session.exec(stmt).all()
        return ReportResponse(
            id=report.id,
            input_event_text=report.input_event_text,
            profile=CurrentEventProfile.model_validate(json.loads(report.profile_json)),
            evidence_pack=EvidencePackResponse.model_validate(json.loads(report.evidence_pack_json)),
            status=report.status,
            segments=[ReportSegmentResponse(
                id=s.id,
                report_id=s.report_id,
                segment_key=s.segment_key,
                title=s.title,
                content_md=s.content_md,
                model_name=s.model_name,
                generation_status=s.generation_status,
                regenerated_count=s.regenerated_count,
                created_at=s.created_at,
                updated_at=s.updated_at,
            ) for s in segments],
            created_at=report.created_at,
            updated_at=report.updated_at,
        )
