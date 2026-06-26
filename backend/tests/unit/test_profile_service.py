from app.services.profile_service import ProfileService


def test_llm_profile_normalization_keeps_strong_rule_signals():
    fallback = {
        "event_summary": "高校食堂卫生问题",
        "domain": "思想政治教育类",
        "public_demands": ["要求信息公开", "要求问责"],
        "heat_level": 4,
        "risk_keywords": ["高校", "食堂"],
    }
    llm_data = {
        "event_summary": "信息缺失",
        "domain": "其他",
        "public_demands": ["要求监管整改"],
        "heat_level": 1,
        "risk_keywords": ["信息缺失"],
        "confidence": 0.8,
    }

    profile = ProfileService._normalize_llm_profile(
        llm_data,
        fallback,
        domains=["文化传播类", "思想政治教育类", "政府管理类", "技术分析类", "其他"],
        demands=["要求信息公开", "要求问责", "要求道歉", "要求监管整改"],
    )

    assert profile["domain"] == "思想政治教育类"
    assert profile["heat_level"] == 4
    assert profile["public_demands"][:2] == ["要求信息公开", "要求问责"]
