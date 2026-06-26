import json
import re
import time
from datetime import UTC, datetime

from sqlmodel import Session

from app.clients.model_clients import get_chat_client
from app.core.config import settings
from app.core.errors import NotFoundError
from app.core.logging import logger
from app.models.report import Report, ReportSegment
from app.models.retrieval import LLMCallLog
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

    def list_reports(self, page: int = 1, page_size: int = 5) -> list[ReportResponse]:
        from sqlmodel import select
        stmt = (select(Report)
                .order_by(Report.created_at.desc())
                .offset((page - 1) * page_size)
                .limit(page_size))
        reports = self.session.exec(stmt).all()
        return [self._to_response(r) for r in reports]

    def generate_all_segments(self, report_id: int) -> None:
        report = self.session.get(Report, report_id)
        if not report:
            raise NotFoundError("Report not found", "REPORT_NOT_FOUND")
        report.status = "generating"
        self.session.add(report)
        self.session.commit()
        evidence_pack = json.loads(report.evidence_pack_json)
        all_ready = True
        for seg_key in ["analysis_and_cases", "strategy_and_speech", "disclaimer"]:
            segment = self._generate_segment(report_id, seg_key, evidence_pack)
            if segment.generation_status != "ready":
                all_ready = False
        report.status = "ready" if all_ready else "failed"
        self.session.add(report)
        self.session.commit()

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
        source_material = self._build_report_source_material(evidence_pack)
        prompt = seg_info["prompt"].format(source_material=source_material)
        use_mock = settings.app_mock_mode or not settings.has_llm_key
        client = get_chat_client()
        model_name = "mock-llm" if use_mock else settings.deepseek_model_fast
        logger.debug(f"Using chat client model={model_name}")
        t0 = time.perf_counter()
        call_status = "ok"
        try:
            content = self._strip_segment_title(
                client.chat(
                    prompt,
                    model=model_name,
                    max_tokens=seg_info.get("max_tokens", 1600),
                    max_continuations=seg_info.get("max_continuations", 0),
                ),
                seg_info["title"],
            )
            if self._looks_truncated(content):
                raise ValueError("LLM response appears truncated")
            segment.content_md = content
            segment.model_name = model_name
            segment.generation_status = "ready"
        except Exception as e:
            logger.error(f"Segment generation failed: {e}")
            segment.generation_status = "failed"
            call_status = "error"
            content = ""
        duration_ms = int((time.perf_counter() - t0) * 1000)

        # Log the LLM call
        log = LLMCallLog(
            call_type=f"report_segment:{segment_key}",
            model_name=model_name,
            prompt_preview=prompt[:500],
            response_preview=content[:500] if content else "",
            duration_ms=duration_ms,
            status=call_status,
            created_at=datetime.now(UTC),
        )
        self.session.add(log)
        self.session.add(segment)
        self.session.commit()
        self.session.refresh(segment)
        return segment

    @classmethod
    def _build_report_source_material(cls, evidence_pack: dict) -> str:
        current = evidence_pack.get("current_event") or {}
        retrieved_cases = evidence_pack.get("retrieved_cases") or []
        dictionary_hints = evidence_pack.get("dictionary_hints") or {}
        context_metrics = evidence_pack.get("context_metrics") or {}
        case_library = context_metrics.get("case_library") or {}
        retrieval = context_metrics.get("retrieval") or {}
        routing = retrieval.get("routing") or {}
        feature_stats = context_metrics.get("case_feature_stats") or {}
        limitations = evidence_pack.get("limitations") or []

        lines = [
            "【当前事件评估画像】",
            f"- 摘要：{cls._clip(current.get('event_summary'), 260)}",
            f"- 领域：{cls._text(current.get('domain'))}；热度等级：{cls._text(current.get('heat_level'))}；置信度：{cls._format_decimal(current.get('confidence'))}",
            f"- 公众诉求：{cls._join_items(current.get('public_demands'))}",
            f"- 传播平台线索：{cls._join_items(current.get('platforms'))}",
            f"- 风险关键词：{cls._join_items(current.get('risk_keywords'))}",
            f"- 初步策略方向：{cls._join_items(current.get('inferred_strategy_direction'))}",
            f"- 检索查询文本：{cls._clip(evidence_pack.get('query_text'), 320)}",
            "",
            "【检索与评分概况】",
            f"- 案例库：总量 {case_library.get('total_cases', 0)}；可检索 {case_library.get('enabled_cases', 0)}；已向量化 {case_library.get('embedding_ready_cases', 0)}。",
            f"- 双层检索：第一层路由池 {retrieval.get('route_pool_count', retrieval.get('candidate_count', 0))}/{retrieval.get('candidate_count', 0)}；第二层 Top-N {retrieval.get('top_n', 0)}；Top-K {retrieval.get('top_k', len(retrieved_cases))}；同领域命中 {retrieval.get('same_domain_hits', 0)}。",
            f"- 平均匹配度：{cls._format_score(retrieval.get('average_final_score'))}；最终分：{cls._join_items([cls._format_score(v) for v in retrieval.get('final_scores', [])])}",
        ]

        weights = retrieval.get("score_weights") or {}
        if weights:
            lines.append(
                "- 权重："
                f"语义 {cls._format_weight(weights.get('semantic'))}；"
                f"诉求 {cls._format_weight(weights.get('demand'))}；"
                f"热度 {cls._format_weight(weights.get('heat'))}；"
                f"领域 {cls._format_weight(weights.get('domain'))}；"
                f"效果 {cls._format_weight(weights.get('effect'))}。"
            )

        route_lines = cls._build_routing_lines(routing)
        if route_lines:
            lines.extend(["", "【第一层路由诊断】", *route_lines])

        stats_lines = cls._build_feature_stat_lines(feature_stats)
        if stats_lines:
            lines.extend(["", "【案例库结构化指标】", *stats_lines])

        lines.extend(["", "【RAG 参考案例压缩材料】"])
        if retrieved_cases:
            for index, case in enumerate(retrieved_cases, start=1):
                fragments = case.get("evidence_fragments") or {}
                score_line = (
                    f"语义 {cls._format_score(case.get('semantic_score'))}；"
                    f"诉求 {cls._format_score(case.get('demand_score'))}；"
                    f"热度 {cls._format_score(case.get('heat_score'))}；"
                    f"领域 {cls._format_score(case.get('domain_score'))}；"
                    f"效果 {cls._format_score(case.get('effect_score'))}"
                )
                lines.extend([
                    f"{index}. {cls._text(case.get('title'))}（领域：{cls._text(case.get('domain'))}；热度：{cls._text(case.get('heat_level'))}；综合匹配：{cls._format_score(case.get('final_score'))}；路由分：{cls._format_score(case.get('route_score'))}）",
                    f"   - 推荐理由：{cls._clip(case.get('explanation'), 220)}",
                    f"   - 路由依据：{cls._clip(case.get('route_reason'), 180)}；命中维度：{cls._join_items(case.get('route_dimensions'))}",
                    f"   - 事件摘录：{cls._clip(case.get('event_description'), 240)}",
                    f"   - 事件演化：{cls._clip(fragments.get('evolution_path'), 260)}",
                    f"   - 传播与影响：{cls._clip(fragments.get('propagation_chain'), 220)}；{cls._clip(fragments.get('impact_scope'), 220)}",
                    f"   - 可借鉴策略：{cls._clip(fragments.get('response_actions') or case.get('strategy_text'), 340)}",
                    f"   - 历史反馈：{cls._clip(fragments.get('outcome_feedback'), 240)}",
                    f"   - 可执行检查点：{cls._join_items(fragments.get('action_checkpoints'))}",
                    f"   - 本事件改写提示：{cls._clip(case.get('actionability_hint'), 240)}",
                    f"   - 分数拆解：{score_line}。",
                ])
        else:
            lines.append("- 未检索到可引用案例；报告必须明确样本不足，不得伪造案例依据。")

        hint_lines = cls._build_dictionary_hint_lines(dictionary_hints, current)
        if hint_lines:
            lines.extend(["", "【字典与处置提示】", *hint_lines])

        if limitations:
            lines.extend(["", "【使用限制】"])
            lines.extend([f"- {cls._clip(item, 180)}" for item in limitations])

        lines.extend([
            "",
            "【写作要求】",
            "- 以上内容已经是系统压缩后的报告素材。请阅读、归纳和润色，不要直接粘贴原始字段或 JSON。",
            "- 建议必须落到具体动作、责任主体、交付物和时间节奏；不要只写原则。",
        ])
        return "\n".join(lines)

    @classmethod
    def _build_dictionary_hint_lines(cls, dictionary_hints: dict, current: dict) -> list[str]:
        lines: list[str] = []

        for item in dictionary_hints.get("public_demands") or []:
            label = item.get("label") or item.get("key")
            hint = item.get("report_hint") or item.get("meaning")
            if label or hint:
                lines.append(f"- 公众诉求「{cls._text(label)}」：{cls._clip(hint, 180)}")

        heat_level = str(current.get("heat_level") or "")
        heat_items = [
            item for item in dictionary_hints.get("heat_levels") or []
            if str(item.get("key")) == heat_level
        ]
        for item in heat_items:
            label = item.get("label") or item.get("key")
            hint = item.get("report_hint") or item.get("meaning")
            lines.append(f"- 热度「{cls._text(label)}」：{cls._clip(hint, 180)}")

        strategy_direction = set(current.get("inferred_strategy_direction") or [])
        strategy_items = [
            item for item in dictionary_hints.get("strategy_types") or []
            if not strategy_direction or item.get("key") in strategy_direction or item.get("label") in strategy_direction
        ][:5]
        for item in strategy_items:
            label = item.get("label") or item.get("key")
            hint = item.get("report_hint") or item.get("meaning")
            lines.append(f"- 策略「{cls._text(label)}」：{cls._clip(hint, 180)}")

        return lines

    @classmethod
    def _build_routing_lines(cls, routing: dict) -> list[str]:
        if not routing:
            return []
        profile_route = routing.get("profile_route") or {}
        lines = [
            "- 路由输入："
            f"领域 {cls._text(profile_route.get('domain'))}；"
            f"热度 {cls._text(profile_route.get('heat_level'))}；"
            f"诉求 {cls._join_items(profile_route.get('public_demands'))}；"
            f"平台 {cls._join_items(profile_route.get('platforms'))}。"
        ]
        route_scores = routing.get("top_route_scores") or []
        if route_scores:
            compact_scores = []
            for item in route_scores[:5]:
                compact_scores.append(
                    f"{cls._clip(item.get('title'), 32)}"
                    f"({cls._format_score(item.get('route_score'))}，"
                    f"{cls._join_items(item.get('dimensions'))})"
                )
            lines.append(f"- 路由候选：{cls._join_items(compact_scores)}")
        threshold = routing.get("route_threshold")
        if threshold is not None:
            lines.append(f"- 路由阈值：{cls._format_score(threshold)}；低于阈值时由全局召回兜底。")
        return lines

    @classmethod
    def _build_feature_stat_lines(cls, feature_stats: dict) -> list[str]:
        if not feature_stats:
            return []
        heat = feature_stats.get("heat") or {}
        effect = feature_stats.get("effect_score") or {}
        lines = [
            f"- 热度分布：样本 {heat.get('count', 0)}；均值 {cls._format_decimal(heat.get('mean'))}；方差 {cls._format_decimal(heat.get('variance'))}；区间 {cls._text(heat.get('min'))}-{cls._text(heat.get('max'))}。",
            f"- 效果评分：样本 {effect.get('count', 0)}；均值 {cls._format_decimal(effect.get('mean'))}；方差 {cls._format_decimal(effect.get('variance'))}。",
        ]
        compact_maps = [
            ("领域分布", feature_stats.get("domain_distribution")),
            ("主要公众诉求", feature_stats.get("top_public_demands")),
            ("主要策略类型", feature_stats.get("top_strategy_types")),
            ("响应速度分布", feature_stats.get("response_speed_distribution")),
        ]
        for label, values in compact_maps:
            text = cls._format_count_map(values)
            if text:
                lines.append(f"- {label}：{text}")
        return lines

    @staticmethod
    def _format_count_map(values: object) -> str:
        if not isinstance(values, dict) or not values:
            return ""
        parts = [f"{key} {value}" for key, value in list(values.items())[:6]]
        return "；".join(parts)

    @staticmethod
    def _clip(value: object, limit: int = 240) -> str:
        text = ReportGenerationService._text(value)
        text = re.sub(r"\s+", " ", text).strip()
        if len(text) <= limit:
            return text
        return f"{text[:limit].rstrip()}…"

    @staticmethod
    def _text(value: object) -> str:
        if value is None or value == "":
            return "未提供"
        return str(value)

    @staticmethod
    def _join_items(value: object) -> str:
        if not value:
            return "未提供"
        if isinstance(value, list):
            return "、".join(str(item) for item in value if item) or "未提供"
        return str(value)

    @staticmethod
    def _format_decimal(value: object) -> str:
        try:
            return f"{float(value):.2f}"
        except (TypeError, ValueError):
            return "未提供"

    @staticmethod
    def _format_score(value: object) -> str:
        try:
            number = float(value)
        except (TypeError, ValueError):
            return "未提供"
        if 0 <= number <= 1:
            return f"{number * 100:.0f}%"
        return f"{number:.2f}"

    @staticmethod
    def _format_weight(value: object) -> str:
        try:
            return f"{float(value):.2f}"
        except (TypeError, ValueError):
            return "未提供"

    @staticmethod
    def _strip_segment_title(content: str, title: str) -> str:
        lines = content.strip().splitlines()
        if not lines:
            return ""
        first = re.sub(r"^\s{0,3}#{1,6}\s*", "", lines[0]).strip()
        first = re.sub(r"^[*_`]+|[*_`]+$", "", first).strip()
        first = first.rstrip("：:")
        if first == title:
            return "\n".join(lines[1:]).strip()
        return content.strip()

    @staticmethod
    def _looks_truncated(content: str) -> bool:
        text = content.strip()
        if not text:
            return True
        if text.endswith(("“", "‘", "：", ":", "、", "，", ",", "-", "—")):
            return True
        if text.count("“") > text.count("”") or text.count("‘") > text.count("’"):
            return True

        last_line = text.splitlines()[-1].strip()
        normalized = re.sub(r"^[\-*]\s*", "", last_line)
        normalized = re.sub(r"[*_`]+", "", normalized).strip(" ：:")
        dangling_labels = {
            "责任主体",
            "具体动作",
            "交付物",
            "回应话术",
            "避免事项",
            "判断依据",
            "可参考点",
            "不确定性",
        }
        return normalized in dangling_labels

    def get_report(self, report_id: int) -> ReportResponse:
        report = self.session.get(Report, report_id)
        if not report:
            raise NotFoundError("Report not found", "REPORT_NOT_FOUND")
        return self._to_response(report)

    def delete_report(self, report_id: int) -> None:
        report = self.session.get(Report, report_id)
        if not report:
            raise NotFoundError("Report not found", "REPORT_NOT_FOUND")
        from sqlmodel import select
        stmt = select(ReportSegment).where(ReportSegment.report_id == report_id)
        for segment in self.session.exec(stmt).all():
            self.session.delete(segment)
        self.session.delete(report)
        self.session.commit()

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
        # Ensure report status reflects generation outcome
        if segment.generation_status == "ready":
            # Check if all segments are ready
            from sqlmodel import select
            stmt = (select(ReportSegment)
                    .where(ReportSegment.report_id == report_id))
            all_segs = self.session.exec(stmt).all()
            if all(s.generation_status == "ready" for s in all_segs):
                report.status = "ready"
        self.session.add(report)
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
