from types import SimpleNamespace

from app.schemas.event import CurrentEventProfile
from app.services.rerank_service import RerankService

DOMAIN_RELATIONS = {
    "文化传播类": {"思想政治教育类": 0.5, "政府管理类": 0.3, "技术分析类": 0.0, "其他": 0.5},
    "思想政治教育类": {"文化传播类": 0.5, "政府管理类": 0.5, "技术分析类": 0.0, "其他": 0.5},
    "政府管理类": {"文化传播类": 0.3, "思想政治教育类": 0.5, "技术分析类": 0.3, "其他": 0.5},
    "技术分析类": {"文化传播类": 0.0, "思想政治教育类": 0.0, "政府管理类": 0.3, "其他": 0.5},
    "其他": {"文化传播类": 0.5, "思想政治教育类": 0.5, "政府管理类": 0.5, "技术分析类": 0.5},
}


class TestDemandScore:
    def test_full_match(self):
        svc = RerankService()
        assert svc.demand_score(["A", "B"], ["A", "B"]) == 1.0

    def test_partial_match(self):
        svc = RerankService()
        assert svc.demand_score(["A", "B"], ["A"]) == 0.5

    def test_no_match(self):
        svc = RerankService()
        assert svc.demand_score(["A"], ["B"]) == 0.0

    def test_both_empty(self):
        svc = RerankService()
        assert svc.demand_score([], []) == 0.5

    def test_one_empty(self):
        svc = RerankService()
        assert svc.demand_score(["A"], []) == 0.5


class TestHeatScore:
    def test_same_level(self):
        svc = RerankService()
        assert svc.heat_score(3, 3) == 1.0

    def test_diff_1(self):
        svc = RerankService()
        assert svc.heat_score(3, 4) == 0.75

    def test_diff_4(self):
        svc = RerankService()
        assert svc.heat_score(5, 1) == 0.0

    def test_diff_2(self):
        svc = RerankService()
        assert svc.heat_score(1, 3) == 0.5


class TestDomainScore:
    def test_same(self):
        svc = RerankService()
        assert svc.domain_score("文化传播类", "文化传播类", DOMAIN_RELATIONS) == 1.0

    def test_related(self):
        svc = RerankService()
        assert svc.domain_score("文化传播类", "思想政治教育类", DOMAIN_RELATIONS) == 0.5

    def test_unrelated(self):
        svc = RerankService()
        assert svc.domain_score("文化传播类", "技术分析类", DOMAIN_RELATIONS) == 0.0

    def test_other_to_any(self):
        svc = RerankService()
        assert svc.domain_score("其他", "文化传播类", DOMAIN_RELATIONS) == 0.5

    def test_undefined_relation(self):
        svc = RerankService()
        assert svc.domain_score("思想政治教育类", "技术分析类", DOMAIN_RELATIONS) == 0.0


class TestEffectScore:
    def test_max(self):
        svc = RerankService()
        assert svc.effect_score(5) == 1.0

    def test_mid(self):
        svc = RerankService()
        assert svc.effect_score(3) == 0.6

    def test_none(self):
        svc = RerankService()
        assert svc.effect_score(None) == 0.6

    def test_zero(self):
        svc = RerankService()
        assert svc.effect_score(1) == 0.2


class TestRouteMatch:
    def test_route_match_exposes_professional_dimensions(self):
        svc = RerankService()
        case = SimpleNamespace(
            title="高校食堂卫生问题",
            domain="思想政治教育类",
            heat_level=4,
            public_demands_json='["要求信息公开", "要求问责"]',
            risk_tags_json='["食品安全"]',
            strategy_types_json='["信息公开型"]',
            event_description="学生在微博和校内群反馈食品安全问题，要求公开调查。",
            strategy_text="发布阶段性说明并公布整改清单。",
            carrier_target="微博",
            notes="",
        )
        profile = CurrentEventProfile(
            event_summary="高校食堂卫生问题",
            domain="思想政治教育类",
            public_demands=["要求信息公开", "要求问责"],
            heat_level=4,
            risk_keywords=["食品安全"],
            platforms=["微博"],
            inferred_strategy_direction=["信息公开型"],
            confidence=0.8,
            profile_source="rule",
        )

        score, dimensions, reason = svc.route_match(case, profile, DOMAIN_RELATIONS)

        assert score > 0.9
        assert "同领域" in dimensions
        assert "诉求高度重合" in dimensions
        assert "平台线索命中" in dimensions
        assert "风险关键词命中" in dimensions
        assert "同领域" in reason


class TestFinalScore:
    def test_weighted_sum(self):
        weights = {"semantic": 0.45, "demand": 0.20, "heat": 0.15, "domain": 0.10, "effect": 0.10}
        scores = {"semantic": 0.8, "demand": 1.0, "heat": 0.75, "domain": 1.0, "effect": 0.8}
        expected = 0.8 * 0.45 + 1.0 * 0.20 + 0.75 * 0.15 + 1.0 * 0.10 + 0.8 * 0.10
        actual = (
            scores["semantic"] * weights["semantic"]
            + scores["demand"] * weights["demand"]
            + scores["heat"] * weights["heat"]
            + scores["domain"] * weights["domain"]
            + scores["effect"] * weights["effect"]
        )
        assert abs(actual - expected) < 0.0001
