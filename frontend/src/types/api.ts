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
