import json
import re
from collections import Counter

from app.schemas.rag import CaseEvidenceFragments


HEAT_SCOPE_LABELS = {
    1: "低位可控，主要适合常规记录和轻量回应",
    2: "有限圈层关注，适合准备基础口径并观察后续变化",
    3: "特定圈层扩散，适合发布阶段性说明避免继续发酵",
    4: "多平台或高关注扩散，适合快速明确事实边界和处理节奏",
    5: "高热集中讨论，适合启动多主体协同和持续公开进展",
}


def parse_json_list(raw: str | None) -> list[str]:
    if not raw:
        return []
    try:
        value = json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        return []
    if not isinstance(value, list):
        return []
    return [str(item).strip() for item in value if str(item).strip()]


def compact_text(value: object, limit: int = 220) -> str:
    text = "" if value is None else str(value)
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) <= limit:
        return text
    return f"{text[:limit].rstrip()}..."


def build_case_evidence_fragments(case) -> CaseEvidenceFragments:
    demands = parse_json_list(case.public_demands_json)
    strategies = parse_json_list(case.strategy_types_json)
    risk_tags = parse_json_list(case.risk_tags_json)
    heat_scope = HEAT_SCOPE_LABELS.get(case.heat_level, "热度未标注，需谨慎参考")

    trigger = case.trigger_reason or _infer_trigger_reason(case.event_description)
    carrier = case.carrier_target or _infer_carrier(case.event_description)
    subject = case.vertical_subject or "未标注"
    demand_text = "、".join(demands) if demands else "未标注"
    strategy_text = "、".join(strategies) if strategies else "未标注"
    risk_text = "、".join(risk_tags) if risk_tags else "未标注"
    response_speed = case.response_speed or "未标注"
    effect = f"{case.effect_score}/5" if case.effect_score is not None else "未标注"

    overview = compact_text(case.event_description, 260) or (
        f"{case.title}，所属{case.domain}，热度{case.heat_level}级。"
    )
    evolution_path = (
        f"触发点：{trigger or '材料未明确'}；公众诉求：{demand_text}；"
        f"热度等级：{case.heat_level}级，{heat_scope}。"
    )
    propagation_chain = (
        f"传播载体/关注对象：{carrier or '材料未明确'}；"
        f"相关风险标签：{risk_text}。"
    )
    impact_scope = (
        f"领域：{case.domain}；涉及主体：{subject}；"
        f"按历史热度和标签判断，影响范围参考为：{heat_scope}。"
    )
    response_actions = compact_text(case.strategy_text, 320) or "案例未提供完整处置动作。"
    outcome_feedback = (
        f"响应速度：{response_speed}；历史效果评分：{effect}；"
        "该反馈只能说明历史样本表现，不代表同策略在当前事件中必然复现。"
    )

    return CaseEvidenceFragments(
        event_overview=overview,
        evolution_path=evolution_path,
        propagation_chain=propagation_chain,
        impact_scope=impact_scope,
        response_actions=response_actions,
        outcome_feedback=outcome_feedback,
        action_checkpoints=build_action_checkpoints(demands, strategies),
    )


def build_action_checkpoints(demands: list[str], strategies: list[str]) -> list[str]:
    checkpoints: list[str] = []
    joined = " ".join([*demands, *strategies])
    if "信息公开" in joined:
        checkpoints.append("明确已核查事实、待核查事项、下一次更新时间")
    if "问责" in joined:
        checkpoints.append("同步责任边界、调查流程和结果公开节点")
    if "道歉" in joined:
        checkpoints.append("用具体事实和改进动作支撑致歉表态")
    if "整改" in joined or "行动补救" in joined:
        checkpoints.append("给出整改清单、责任主体、验收标准和反馈渠道")
    if "转移引导" in joined:
        checkpoints.append("只在回应核心问题后补充正向信息，避免被解读为回避")
    if not checkpoints:
        checkpoints.append("先确认事实边界，再发布阶段性说明和后续动作")
    return checkpoints


def build_case_feature_stats(cases) -> dict:
    cases = list(cases)
    heat_values = [case.heat_level for case in cases if case.heat_level is not None]
    effect_values = [case.effect_score for case in cases if case.effect_score is not None]
    domain_counts = Counter(case.domain or "未标注" for case in cases)
    response_counts = Counter(case.response_speed or "未标注" for case in cases)
    demand_counts: Counter[str] = Counter()
    strategy_counts: Counter[str] = Counter()
    risk_counts: Counter[str] = Counter()
    for case in cases:
        demand_counts.update(parse_json_list(case.public_demands_json))
        strategy_counts.update(parse_json_list(case.strategy_types_json))
        risk_counts.update(parse_json_list(case.risk_tags_json))

    return {
        "enabled_case_count": len(cases),
        "heat": _numeric_stats(heat_values),
        "effect_score": _numeric_stats(effect_values),
        "domain_distribution": dict(domain_counts.most_common()),
        "response_speed_distribution": dict(response_counts.most_common(6)),
        "top_public_demands": dict(demand_counts.most_common(6)),
        "top_strategy_types": dict(strategy_counts.most_common(6)),
        "top_risk_tags": dict(risk_counts.most_common(8)),
    }


def _numeric_stats(values: list[int]) -> dict:
    if not values:
        return {"count": 0, "mean": None, "variance": None, "min": None, "max": None}
    mean = sum(values) / len(values)
    variance = sum((value - mean) ** 2 for value in values) / len(values)
    return {
        "count": len(values),
        "mean": round(mean, 3),
        "variance": round(variance, 3),
        "min": min(values),
        "max": max(values),
    }


def _infer_trigger_reason(event_description: str | None) -> str:
    text = compact_text(event_description, 80)
    if not text:
        return ""
    for marker in ["因", "由于", "被曝", "曝光", "发现", "质疑"]:
        if marker in text:
            return text
    return text


def _infer_carrier(event_description: str | None) -> str:
    text = event_description or ""
    carriers = []
    for name in ["微博", "抖音", "小红书", "B站", "微信", "社交平台", "媒体", "校内群"]:
        if name in text:
            carriers.append(name)
    return "、".join(dict.fromkeys(carriers))
