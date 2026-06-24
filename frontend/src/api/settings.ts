import { apiFetch } from "./client"

export function fetchPublicSettings() {
  return apiFetch<{
    mock_mode: boolean
    embedding_model: string
    llm_model_fast: string
    llm_model_pro: string
    keys: { dashscope: string; deepseek: string }
    retrieval: {
      top_n: number
      top_k: number
      weights: Record<string, number>
    }
  }>("/api/settings/public")
}
