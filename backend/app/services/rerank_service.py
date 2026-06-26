from app.core.config import settings
from app.schemas.event import CurrentEventProfile
from app.schemas.rag import RetrievedCaseItem
from app.utils.case_evidence import (
    build_action_checkpoints,
    build_case_evidence_fragments,
    compact_text,
    parse_json_list,
)


class RerankService:
    def demand_score(self, query_demands: list[str], case_demands: list[str]) -> float:
        if not query_demands or not case_demands:
            return 0.5
        q, c = set(query_demands), set(case_demands)
        return len(q & c) / len(q | c)

    def heat_score(self, query_heat: int, case_heat: int) -> float:
        return max(0.0, 1.0 - abs(query_heat - case_heat) / 4.0)

    def domain_score(self, query_domain: str, case_domain: str,
                     relations: dict[str, dict[str, float]]) -> float:
        if query_domain == case_domain:
            return 1.0
        related = relations.get(query_domain, {})
        return related.get(case_domain, 0.0)

    def effect_score(self, effect: int | None) -> float:
        if effect is None:
            return 0.6
        return max(0.0, min(1.0, effect / 5.0))

    def route_match(self, case, profile: CurrentEventProfile,
                    domain_relations: dict[str, dict[str, float]]) -> tuple[float, list[str], str]:
        demands = parse_json_list(case.public_demands_json)
        risk_tags = parse_json_list(case.risk_tags_json)
        case_text = " ".join([
            case.title or "",
            case.event_description or "",
            case.strategy_text or "",
            case.carrier_target or "",
            case.notes or "",
            " ".join(risk_tags),
        ])
        domain = self.domain_score(profile.domain, case.domain, domain_relations)
        heat_band = self._heat_band_score(profile.heat_level, case.heat_level)
        demand = self.demand_score(profile.public_demands, demands)
        platform = self._keyword_overlap_score(profile.platforms, case_text)
        risk = self._keyword_overlap_score(profile.risk_keywords, case_text)

        score = (
            domain * 0.35
            + demand * 0.25
            + heat_band * 0.20
            + max(platform, risk) * 0.20
        )
        dimensions: list[str] = []
        if domain >= 1:
            dimensions.append("同领域")
        elif domain > 0:
            dimensions.append("相关领域")
        if demand >= 0.7:
            dimensions.append("诉求高度重合")
        elif demand > 0:
            dimensions.append("诉求部分重合")
        if heat_band >= 0.9:
            dimensions.append("同热度区间")
        if platform > 0:
            dimensions.append("平台线索命中")
        if risk > 0:
            dimensions.append("风险关键词命中")
        if not dimensions:
            dimensions.append("全局兜底")

        reason = "、".join(dimensions)
        return round(score, 4), dimensions, reason

    def rerank(self, candidates, profile: CurrentEventProfile, dicts: dict,
               domain_relations: dict[str, dict[str, float]], top_k: int) -> list[RetrievedCaseItem]:
        weights = {
            "semantic": settings.weight_semantic,
            "demand": settings.weight_demand,
            "heat": settings.weight_heat,
            "domain": settings.weight_domain,
            "effect": settings.weight_effect,
        }
        results = []
        for candidate in candidates:
            if isinstance(candidate, dict):
                case = candidate["case"]
                semantic_score = candidate["semantic_score"]
                route_score = candidate.get("route_score", 0.0)
                route_dimensions = candidate.get("route_dimensions", [])
                route_reason = candidate.get("route_reason", "")
            else:
                case, semantic_score = candidate
                route_score, route_dimensions, route_reason = self.route_match(
                    case, profile, domain_relations
                )

            demands = parse_json_list(case.public_demands_json)
            strategy_types = parse_json_list(case.strategy_types_json)
            risk_tags = parse_json_list(case.risk_tags_json)
            d_score = self.demand_score(profile.public_demands, demands)
            h_score = self.heat_score(profile.heat_level, case.heat_level)
            dom_score = self.domain_score(profile.domain, case.domain, domain_relations)
            e_score = self.effect_score(case.effect_score)
            final = (
                semantic_score * weights["semantic"]
                + d_score * weights["demand"]
                + h_score * weights["heat"]
                + dom_score * weights["domain"]
                + e_score * weights["effect"]
            )
            explanation_parts = []
            if dom_score == 1.0:
                explanation_parts.append(f"同属{profile.domain}")
            elif dom_score > 0:
                explanation_parts.append(f"领域相关({profile.domain} -> {case.domain})")
            if d_score > 0.7:
                explanation_parts.append("公众诉求高度一致")
            elif d_score > 0.3:
                explanation_parts.append("公众诉求部分重合")
            if h_score > 0.9:
                explanation_parts.append("热度等级接近")
            if route_reason:
                explanation_parts.append(f"路由命中：{route_reason}")
            fragments = build_case_evidence_fragments(case)
            checkpoints = build_action_checkpoints(demands, strategy_types)
            results.append(RetrievedCaseItem(
                case_id=case.id,
                title=case.title,
                domain=case.domain,
                heat_level=case.heat_level,
                response_speed=case.response_speed,
                effect_score_raw=case.effect_score,
                public_demands=demands,
                strategy_types=strategy_types,
                risk_tags=risk_tags,
                vertical_subject=case.vertical_subject,
                carrier_target=case.carrier_target,
                trigger_reason=case.trigger_reason,
                event_description=case.event_description[:240],
                strategy_text=case.strategy_text[:240],
                route_score=round(route_score, 4),
                route_dimensions=route_dimensions,
                route_reason=route_reason,
                semantic_score=round(semantic_score, 4),
                demand_score=round(d_score, 4),
                heat_score=round(h_score, 4),
                domain_score=round(dom_score, 4),
                effect_score=round(e_score, 4),
                final_score=round(final, 4),
                explanation="；".join(explanation_parts) if explanation_parts else "综合匹配",
                evidence_fragments=fragments,
                actionability_hint=compact_text("；".join(checkpoints), 220),
            ))
        results.sort(key=lambda r: r.final_score, reverse=True)
        return results[:top_k]

    @staticmethod
    def _heat_band_score(query_heat: int, case_heat: int) -> float:
        query_band = "low" if query_heat <= 2 else "mid" if query_heat == 3 else "high"
        case_band = "low" if case_heat <= 2 else "mid" if case_heat == 3 else "high"
        if query_band == case_band:
            return 1.0
        return 0.5 if abs(query_heat - case_heat) <= 1 else 0.0

    @staticmethod
    def _keyword_overlap_score(keywords: list[str], text: str) -> float:
        if not keywords:
            return 0.5
        if not text:
            return 0.0
        matched = [keyword for keyword in keywords if keyword and keyword in text]
        return len(matched) / len(keywords)
