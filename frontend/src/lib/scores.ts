export interface ScoreBreakdown {
  semantic_score: number
  demand_score: number
  heat_score: number
  domain_score: number
  effect_score: number
}

export const SCORE_LABELS: Record<keyof ScoreBreakdown, string> = {
  semantic_score: "语义相似度",
  demand_score: "公众诉求匹配",
  heat_score: "热度等级接近度",
  domain_score: "领域匹配",
  effect_score: "历史效果权重",
}

export const SCORE_WEIGHTS: Record<keyof ScoreBreakdown, number> = {
  semantic_score: 0.45,
  demand_score: 0.20,
  heat_score: 0.15,
  domain_score: 0.10,
  effect_score: 0.10,
}
