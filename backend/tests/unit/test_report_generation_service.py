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
                "heat_level": 4,
                "response_speed": "24小时内",
                "effect_score_raw": 4,
                "public_demands": ["要求信息公开", "要求监管整改"],
                "strategy_types": ["信息公开型", "行动补救型"],
                "risk_tags": ["食品安全"],
                "route_score": 0.88,
                "route_dimensions": ["同领域", "诉求高度重合"],
                "route_reason": "同领域、诉求高度重合",
                "event_description": "学生在食堂用餐时发现异物，相关截图在校内群传播。",
                "strategy_text": "校方发布阶段性说明，公布抽检安排，开放家委会代表参与复核。",
                "semantic_score": 0.91,
                "demand_score": 0.85,
                "heat_score": 0.8,
                "domain_score": 1.0,
                "effect_score": 0.7,
                "final_score": 0.82,
                "explanation": "领域一致，诉求集中在信息公开和整改。",
                "evidence_fragments": {
                    "event_overview": "学生在食堂用餐时发现异物，相关截图在校内群传播。",
                    "evolution_path": "触发点：学生发现异物；公众诉求：要求信息公开、要求监管整改；热度等级：4级。",
                    "propagation_chain": "传播载体/关注对象：校内群；相关风险标签：食品安全。",
                    "impact_scope": "领域：校园；涉及主体：学生；影响范围参考为高关注扩散。",
                    "response_actions": "校方发布阶段性说明，公布抽检安排，开放家委会代表参与复核。",
                    "outcome_feedback": "响应速度：24小时内；历史效果评分：4/5。",
                    "action_checkpoints": ["明确已核查事实、待核查事项、下一次更新时间"],
                },
                "actionability_hint": "明确已核查事实、待核查事项、下一次更新时间",
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
                "route_pool_count": 6,
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
                "routing": {
                    "route_threshold": 0.35,
                    "profile_route": {
                        "domain": "校园",
                        "heat_level": 4,
                        "public_demands": ["要求信息公开", "要求监管整改"],
                        "platforms": ["微信"],
                    },
                    "top_route_scores": [
                        {
                            "title": "校园食堂异物事件",
                            "route_score": 0.88,
                            "dimensions": ["同领域", "诉求高度重合"],
                        }
                    ],
                },
            },
            "case_feature_stats": {
                "heat": {"count": 12, "mean": 3.5, "variance": 0.8, "min": 2, "max": 5},
                "effect_score": {"count": 10, "mean": 4.1, "variance": 0.3, "min": 3, "max": 5},
                "domain_distribution": {"校园": 5, "政府管理类": 4},
                "top_public_demands": {"要求信息公开": 8},
                "top_strategy_types": {"信息公开型": 7},
                "response_speed_distribution": {"24小时内": 6},
            },
        },
        "limitations": ["当前案例库为课程项目小样本案例库。"],
    }

    material = ReportGenerationService._build_report_source_material(evidence_pack)

    assert "【检索与评分概况】" in material
    assert "第一层路由池 6/8" in material
    assert "【第一层路由诊断】" in material
    assert "【案例库结构化指标】" in material
    assert "校园食堂异物事件" in material
    assert "综合匹配：82%" in material
    assert "路由分：88%" in material
    assert "事件演化" in material
    assert "可执行检查点" in material
    assert "语义 91%" in material
    assert "说明公开范围、频率和渠道" in material
    assert '"current_event"' not in material


def test_looks_truncated_detects_dangling_quote_and_labels():
    assert ReportGenerationService._looks_truncated("可参考点在于“")
    assert ReportGenerationService._looks_truncated("- **交付物**")
    assert ReportGenerationService._looks_truncated("**可参考点：**")


def test_looks_truncated_allows_complete_report_text():
    content = (
        "**推荐处置方向：** 信息公开型为主。\n\n"
        "- **交付物**：阶段性说明、整改清单和监督渠道。\n\n"
        "所有建议均需人工复核后方可使用。"
    )

    assert not ReportGenerationService._looks_truncated(content)
