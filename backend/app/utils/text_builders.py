import json

from app.utils.case_evidence import build_case_evidence_fragments


def build_case_embedding_text(case, dictionaries: dict) -> str:
    public_demands = _parse_json_list(case.public_demands_json)
    strategy_types = _parse_json_list(case.strategy_types_json)
    risk_tags = _parse_json_list(case.risk_tags_json)
    fragments = build_case_evidence_fragments(case)
    demand_hints = []
    for d in public_demands:
        items = [i for i in dictionaries.get("public_demands", []) if i["key"] == d]
        if items:
            demand_hints.append(f"{d}表示{items[0]['meaning']}")
    heat_items = [i for i in dictionaries.get("heat_levels", []) if i["key"] == str(case.heat_level)]
    heat_meaning = heat_items[0]["meaning"] if heat_items else ""
    strategy_hints = []
    for s in strategy_types:
        items = [i for i in dictionaries.get("strategy_types", []) if i["key"] == s]
        if items:
            strategy_hints.append(f"{s}表示{items[0]['meaning']}")
    return f"""案例名称：{case.title}
所属领域：{case.domain}
公众诉求：{'、'.join(public_demands)}。{'；'.join(demand_hints)}
热度等级：{case.heat_level}。{heat_meaning}
策略类型：{'、'.join(strategy_types)}。{'；'.join(strategy_hints)}
风险标签：{'、'.join(risk_tags)}
涉及主体：{case.vertical_subject or '未知'}
传播载体/对象：{case.carrier_target or '未知'}
触发原因：{case.trigger_reason or '未知'}
事件描述：{case.event_description}
事件演化：{fragments.evolution_path}
传播与影响：{fragments.propagation_chain}；{fragments.impact_scope}
核心处置策略：{case.strategy_text}
处置动作片段：{fragments.response_actions}
反馈结果：{fragments.outcome_feedback}
处置效果：{case.effect_score or '未知'}""".strip()


def build_query_text(event_text: str, profile, dictionaries: dict) -> str:
    demand_lines = []
    for demand in profile.public_demands:
        items = [i for i in dictionaries.get("public_demands", []) if i["key"] == demand]
        if items:
            demand_lines.append(f"{demand}表示{items[0]['meaning']}")
    heat_items = [i for i in dictionaries.get("heat_levels", []) if i["key"] == str(profile.heat_level)]
    heat_hint = heat_items[0]["report_hint"] if heat_items else ""
    return f"""当前事件：{event_text}
所属领域：{profile.domain}。
公众诉求：{'、'.join(profile.public_demands)}。{'；'.join(demand_lines)}
热度等级：{profile.heat_level}，{heat_hint}
风险关键词：{'、'.join(profile.risk_keywords)}
检索目标：寻找相似历史案例及可借鉴处置策略。""".strip()


def _parse_json_list(raw: str) -> list[str]:
    try:
        return json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        return []
