from sqlmodel import Session, select

from app.models.dictionary import BackgroundDictItem


def get_dictionaries(session: Session) -> dict:
    items = session.exec(select(BackgroundDictItem)).all()
    result: dict = {
        "public_demands": [],
        "heat_levels": [],
        "strategy_types": [],
        "domain_labels": [],
        "domain_relations": [],
    }
    for item in items:
        d = {
            "key": item.key,
            "label": item.label,
            "meaning": item.meaning,
            "report_hint": item.report_hint,
            "speech_hint": item.speech_hint,
            "risk_hint": item.risk_hint,
        }
        if item.category == "domain_relations":
            d["domain_relations"] = item.extra_json
        if item.category in result:
            result[item.category].append(d)
    return result


def get_domain_relations(session: Session) -> dict[str, dict[str, float]]:
    items = session.exec(
        select(BackgroundDictItem).where(BackgroundDictItem.category == "domain_relations")
    ).all()
    return {item.key: (item.extra_json or {}) for item in items}
