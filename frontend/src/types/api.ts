// ============================================================
// ZhiXi 前端类型定义 — 与后端 Pydantic schema 对齐
// 优先使用 `pnpm gen:api` 自动生成，本文件为手动 fallback
// ============================================================

// ---- Case (PRD §5.1) ----
export interface CaseResponse {
  id: number
  case_code: string | null
  title: string
  domain: '文化传播类' | '思想政治教育类' | '政府管理类' | '技术分析类' | '其他'
  public_demands: string[]
  heat_level: 1 | 2 | 3 | 4 | 5
  response_speed: string | null
  effect_score: 1 | 2 | 3 | 4 | 5 | null
  strategy_types: string[]
  event_description: string
  strategy_text: string
  vertical_subject: string | null
  carrier_target: string | null
  trigger_reason: string | null
  risk_tags: string[]
  notes: string | null
  enabled: boolean
  embedding_status: 'none' | 'pending' | 'ready' | 'failed'
  embedding_text: string | null
  embedding_model: string | null
  embedding_dimensions: number | null
  created_at: string
  updated_at: string
}

// ---- Current Event Profile (PRD §5.3) ----
export interface CurrentEventProfile {
  event_summary: string
  domain: string
  public_demands: string[]
  heat_level: number
  risk_keywords: string[]
  platforms: string[]
  inferred_strategy_direction: string[]
  confidence: number
  profile_source: string
}

export interface RetrievedCaseItem {
  case_id: number
  title: string
  domain: string
  event_description: string
  strategy_text: string
  semantic_score: number
  demand_score: number
  heat_score: number
  domain_score: number
  effect_score: number
  final_score: number
  explanation: string
}

export interface EvidencePackResponse {
  current_event: CurrentEventProfile
  query_text: string
  retrieved_cases: RetrievedCaseItem[]
  dictionary_hints: Record<string, unknown>
  context_metrics?: Record<string, unknown>
  limitations: string[]
}

export interface ReportSegmentResponse {
  id: number
  report_id: number
  segment_key: string
  title: string
  content_md: string
  model_name: string | null
  generation_status: string
  regenerated_count: number
  created_at: string
  updated_at: string
}

export interface ReportResponse {
  id: number
  input_event_text: string
  profile: CurrentEventProfile
  evidence_pack: EvidencePackResponse
  status: string
  segments: ReportSegmentResponse[]
  created_at: string
  updated_at: string
}
