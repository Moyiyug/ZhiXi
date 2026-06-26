"""Seed background dictionary data and demo evaluation events.

Run automatically when database tables are first created.
"""

from sqlmodel import Session

from app.core.logging import logger
from app.db.session import engine

DEFAULT_DICT_ITEMS = {
    "public_demands": [
        {
            "key": "要求信息公开",
            "label": "要求信息公开",
            "meaning": "公众主要关注事实、时间线和处置进展是否透明。",
            "report_hint": "报告中应强调信息披露、阶段性说明和持续更新机制。",
            "speech_hint": "回应话术应避免含糊表达，需说明已核查事项、未核查事项和下一次更新时间。",
        },
        {
            "key": "要求问责",
            "label": "要求问责",
            "meaning": "公众关注责任主体、责任边界和处理结果。",
            "report_hint": "报告中应强调调查责任、责任划分和问责机制。",
            "speech_hint": "回应话术应避免空泛道歉，应承诺依法依规调查和公布处理结果。",
        },
        {
            "key": "要求道歉",
            "label": "要求道歉",
            "meaning": "公众关注涉事主体是否承认错误、是否正式道歉。",
            "report_hint": "报告中应说明道歉/回应措辞和发布渠道。",
            "speech_hint": "回应话术应真诚、具体，说明为何道歉、如何改进。",
        },
        {
            "key": "要求监管整改",
            "label": "要求监管整改",
            "meaning": "公众关注监管部门是否介入、整改措施是否到位。",
            "report_hint": "报告中应强调监管介入、整改时间线和验收机制。",
            "speech_hint": "回应话术应说明具体整改措施、责任人和完成时间。",
        },
    ],
    "heat_levels": [
        {
            "key": "1",
            "label": "1 级 — 可控",
            "meaning": "事件影响范围有限，关注度低。",
            "report_hint": "保持常规关注，不需要升级响应。",
        },
        {
            "key": "2",
            "label": "2 级 — 低热度",
            "meaning": "事件在有限范围内传播，尚未形成广泛关注。",
            "report_hint": "保持关注，准备基础回应口径。",
        },
        {
            "key": "3",
            "label": "3 级 — 中热度",
            "meaning": "事件在特定圈层传播，开始引起关注。",
            "report_hint": "建议发布阶段性说明，防止进一步发酵。",
        },
        {
            "key": "4",
            "label": "4 级 — 高热度",
            "meaning": "事件在多平台广泛传播，公众情绪明显。",
            "report_hint": "需快速发布正式声明，主动引导舆论方向。",
        },
        {
            "key": "5",
            "label": "5 级 — 高热/爆",
            "meaning": "事件在全网多平台广泛传播，公众情绪高度集中。",
            "report_hint": "需快速响应，发布正式声明，启动多部门协调。",
        },
    ],
    "strategy_types": [
        {
            "key": "信息公开型",
            "label": "信息公开型",
            "meaning": "核心策略是主动、透明地发布事件信息和进展。",
            "report_hint": "说明公开的信息范围、发布频率和渠道。",
        },
        {
            "key": "行动补救型",
            "label": "行动补救型",
            "meaning": "核心策略是通过实际行动弥补过失。",
            "report_hint": "说明具体行动、时间线和预期效果。",
        },
        {
            "key": "快速道歉型",
            "label": "快速道歉型",
            "meaning": "核心策略是第一时间道歉，承认错误，表明态度。",
            "report_hint": "说明道歉的措辞、发布时机和传播渠道。",
        },
        {
            "key": "转移引导型",
            "label": "转移引导型",
            "meaning": "核心策略是将舆论注意力引导至正面议题或后续改进。",
            "report_hint": "注意平衡引导与回避的界限，避免被解读为转移焦点。",
        },
    ],
    "risk_keywords": [
        {
            "key": "高校",
            "label": "高校",
            "meaning": "涉及高校场景，学生群体为核心受众。",
            "report_hint": "需关注学生群体情绪和校园管理特殊性。",
            "speech_hint": "回应应充分考虑学生群体的知情权和参与感。",
        },
        {
            "key": "食品安全",
            "label": "食品安全",
            "meaning": "涉及食品卫生和公共健康安全。",
            "report_hint": "需强调食品安全标准和检查流程。",
            "speech_hint": "回应应引用具体检测数据和整改措施。",
        },
        {
            "key": "政务公开",
            "label": "政务公开",
            "meaning": "涉及政府信息公开和透明治理。",
            "report_hint": "需强调信息公开的法律依据和范围。",
            "speech_hint": "回应应说明已公开和未公开信息的边界及原因。",
        },
    ],
    "domain_labels": [
        {
            "key": "文化传播类",
            "label": "文化传播类",
            "meaning": "涉及文化表达、内容传播、公众文化认同的事件。",
        },
        {
            "key": "思想政治教育类",
            "label": "思想政治教育类",
            "meaning": "涉及教育管理、思想政治引导、学生群体的事件。",
        },
        {
            "key": "政府管理类",
            "label": "政府管理类",
            "meaning": "涉及政府治理、公共管理、政务通报的事件。",
        },
        {
            "key": "技术分析类",
            "label": "技术分析类",
            "meaning": "涉及技术判断、工程决策、数据分析的事件。",
        },
        {
            "key": "其他",
            "label": "其他",
            "meaning": "不属于上述四个类别的舆情事件。",
        },
    ],
    "domain_relations": {
        "文化传播类": {"思想政治教育类": 0.5, "政府管理类": 0.3, "技术分析类": 0.0, "其他": 0.5},
        "思想政治教育类": {"文化传播类": 0.5, "政府管理类": 0.5, "技术分析类": 0.0, "其他": 0.5},
        "政府管理类": {"文化传播类": 0.3, "思想政治教育类": 0.5, "技术分析类": 0.3, "其他": 0.5},
        "技术分析类": {"文化传播类": 0.0, "思想政治教育类": 0.0, "政府管理类": 0.3, "其他": 0.5},
        "其他": {"文化传播类": 0.5, "思想政治教育类": 0.5, "政府管理类": 0.5, "技术分析类": 0.5},
    },
}

DEMO_EVENTS = [
    {
        "demo_event_id": "golden_event_1",
        "title": "高校食堂卫生问题",
        "event_text": (
            "某高校食堂被曝食品卫生问题，学生在社交平台发布图片后引发大量转发，"
            "评论区集中要求学校公开调查结果并追责相关负责人。"
            "学校目前尚未发布正式通报，校内学生情绪较为集中。"
        ),
        "expected_domain": "思想政治教育类",
        "expected_demands": ["要求信息公开", "要求问责"],
        "expected_heat": 4,
    },
    {
        "demo_event_id": "golden_event_2",
        "title": "景区 NPC 互动低俗争议",
        "event_text": (
            "某景区沉浸式演出中，NPC 与游客互动环节被拍下并上传至抖音，"
            "部分观众认为互动内容低俗、不尊重游客。"
            "视频在 B 站和微博持续发酵，景区尚未回应，多家自媒体跟进报道。"
        ),
        "expected_domain": "文化传播类",
        "expected_demands": ["要求道歉", "要求监管整改"],
        "expected_heat": 5,
    },
    {
        "demo_event_id": "golden_event_3",
        "title": "政务通报信息不透明",
        "event_text": (
            "某地方政府发布一则环保整改通报，但通报中关键数据未公开，整改措施描述模糊。"
            "多家媒体和环保组织呼吁公开完整数据，公众质疑通报的透明度和诚意。"
        ),
        "expected_domain": "政府管理类",
        "expected_demands": ["要求信息公开", "要求问责"],
        "expected_heat": 4,
    },
]


def seed_dictionary() -> None:
    """Insert default dictionary items if the dictionary table is empty."""
    from sqlmodel import select

    from app.models.dictionary import BackgroundDictItem
    with Session(engine) as session:
        existing = {
            (category, key)
            for category, key in session.exec(
                select(BackgroundDictItem.category, BackgroundDictItem.key)
            ).all()
        }

        items: list[BackgroundDictItem] = []

        # Seed regular categories (public_demands, heat_levels, strategy_types, domain_labels)
        for category, entries in DEFAULT_DICT_ITEMS.items():
            if category == "domain_relations":
                continue  # handled separately below
            for entry in entries:
                item = BackgroundDictItem(
                    category=category,
                    key=entry["key"],
                    label=entry["label"],
                    meaning=entry.get("meaning", ""),
                    report_hint=entry.get("report_hint", ""),
                    speech_hint=entry.get("speech_hint", ""),
                    risk_hint=entry.get("risk_hint", ""),
                    extra_json=None,
                )
                if (category, entry["key"]) not in existing:
                    items.append(item)

        # Seed domain relations (dict of dicts, NOT a list)
        for source, relations in DEFAULT_DICT_ITEMS.get("domain_relations", {}).items():
            item = BackgroundDictItem(
                category="domain_relations",
                key=source,
                label=source,
                meaning="",
                report_hint="",
                extra_json=relations,
            )
            if ("domain_relations", source) not in existing:
                items.append(item)

        if items:
            session.add_all(items)
            session.commit()
            logger.info(f"Seeded {len(items)} missing dictionary items.")
        else:
            logger.info(f"Dictionary already complete ({len(existing)} items). Skipping.")


def seed_demo_events() -> None:
    """Insert demo evaluation events if table is empty."""
    from sqlmodel import func, select

    from app.models.evaluation import DemoEvent

    with Session(engine) as session:
        count = session.exec(select(func.count()).select_from(DemoEvent)).one()
        if count > 0:
            logger.info(f"Demo events already seeded ({count} events). Skipping.")
            return

        import json

        items: list[DemoEvent] = []
        for ev in DEMO_EVENTS:
            item = DemoEvent(
                demo_event_id=ev["demo_event_id"],
                title=ev["title"],
                event_text=ev["event_text"],
                expected_domain=ev.get("expected_domain"),
                expected_demands_json=json.dumps(ev.get("expected_demands", [])),
                expected_heat=ev.get("expected_heat"),
            )
            items.append(item)

        session.add_all(items)
        session.commit()
        logger.info(f"Seeded {len(items)} demo evaluation events.")


def run_all_seeds() -> None:
    logger.info("Running database seeds…")
    seed_dictionary()
    seed_demo_events()
    logger.info("All seeds complete.")
