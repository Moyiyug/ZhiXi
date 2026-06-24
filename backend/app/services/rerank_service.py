import json

from app.core.config import settings
from app.schemas.event import CurrentEventProfile
from app.schemas.rag import RetrievedCaseItem


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
        for case, semantic_score in candidates:
            demands = json.loads(case.public_demands_json)
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
            results.append(RetrievedCaseItem(
                case_id=case.id,
                title=case.title,
                domain=case.domain,
                event_description=case.event_description[:240],
                strategy_text=case.strategy_text[:240],
                semantic_score=round(semantic_score, 4),
                demand_score=round(d_score, 4),
                heat_score=round(h_score, 4),
                domain_score=round(dom_score, 4),
                effect_score=round(e_score, 4),
                final_score=round(final, 4),
                explanation="；".join(explanation_parts) if explanation_parts else "综合匹配",
            ))
        results.sort(key=lambda r: r.final_score, reverse=True)
        return results[:top_k]
