from app.services.report_generation_service import ReportGenerationService


def test_strip_segment_title_handles_markdown_heading():
    content = "## 二、处置结论与回应话术\n\n正文内容"

    result = ReportGenerationService._strip_segment_title(content, "二、处置结论与回应话术")

    assert result == "正文内容"


def test_strip_segment_title_handles_bold_heading():
    content = "**二、处置结论与回应话术**\n\n正文内容"

    result = ReportGenerationService._strip_segment_title(content, "二、处置结论与回应话术")

    assert result == "正文内容"


def test_build_report_source_material_compresses_evidence_pack():
    evidence_pack = {
        "current_event": {
            "event_summary": "学校食堂被学生反馈食品安全问题，引发家长和学生关注。",
            "domain": "校园",
            "public_demands": ["要求信息公开", "要求监管整改"],
            "heat_level": 4,
            "risk_keywords": ["食品安全", "学生健康"],
            "inferred_strategy_direction": ["信息公开型", "行动补救型"],
            "confidence": 0.82,
        },
        "query_text": "领域：校园。公众诉求：要求信息公开、要求监管整改。",
        "retrieved_cases": [
            {
                "case_id": 1,
                "title": "校园食堂异物事件",
                "domain": "校园",
                "event_description": "学生在食堂用餐时发现异物，相关截图在校内群传播。",
                "strategy_text": "校方发布阶段性说明，公布抽检安排，开放家委会代表参与复核。",
                "semantic_score": 0.91,
                "demand_score": 0.85,
                "heat_score": 0.8,
                "domain_score": 1.0,
                "effect_score": 0.7,
                "final_score": 0.82,
                "explanation": "领域一致，诉求集中在信息公开和整改。",
            }
        ],
        "dictionary_hints": {
            "public_demands": [
                {"key": "要求信息公开", "label": "信息公开", "report_hint": "说明公开范围、频率和渠道。"}
            ],
            "heat_levels": [
                {"key": "4", "label": "高热度", "report_hint": "需快速发布正式声明。"}
            ],
            "strategy_types": [
                {"key": "信息公开型", "label": "信息公开型", "report_hint": "说明信息披露机制。"}
            ],
        },
        "context_metrics": {
            "case_library": {"total_cases": 12, "enabled_cases": 10, "embedding_ready_cases": 9},
            "retrieval": {
                "candidate_count": 8,
                "top_n": 8,
                "top_k": 1,
                "same_domain_hits": 1,
                "average_final_score": 0.82,
                "final_scores": [0.82],
                "score_weights": {
                    "semantic": 0.5,
                    "demand": 0.2,
                    "heat": 0.1,
                    "domain": 0.1,
                    "effect": 0.1,
                },
            },
        },
        "limitations": ["当前案例库为课程项目小样本案例库。"],
    }

    material = ReportGenerationService._build_report_source_material(evidence_pack)

    assert "【检索与评分概况】" in material
    assert "候选 8" in material
    assert "校园食堂异物事件" in material
    assert "综合匹配：82%" in material
    assert "语义 91%" in material
    assert "说明公开范围、频率和渠道" in material
    assert '"current_event"' not in material
