import { apiFetch } from "./client"

export interface CaseFilters {
  q?: string
  domain?: string
  enabled?: boolean
  embedding_status?: string
  page?: number
  page_size?: number
}

export function fetchCases(filters: CaseFilters = {}) {
  const params = new URLSearchParams()
  if (filters.q) params.set("q", filters.q)
  if (filters.domain) params.set("domain", filters.domain)
  if (filters.enabled !== undefined) params.set("enabled", String(filters.enabled))
  if (filters.embedding_status) params.set("embedding_status", filters.embedding_status)
  if (filters.page) params.set("page", String(filters.page))
  if (filters.page_size) params.set("page_size", String(filters.page_size))
  const qs = params.toString()
  return apiFetch<{ items: unknown[]; total: number; page: number; page_size: number }>(
    `/api/cases${qs ? `?${qs}` : ""}`
  )
}

export function fetchCase(id: number) {
  return apiFetch<unknown>(`/api/cases/${id}`)
}

export function createCase(data: Record<string, unknown>) {
  return apiFetch<unknown>("/api/cases", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export function updateCase(id: number, data: Record<string, unknown>) {
  return apiFetch<unknown>(`/api/cases/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

export function deleteCase(id: number) {
  return apiFetch<void>(`/api/cases/${id}`, { method: "DELETE" })
}

export function importCsv(file: File) {
  const form = new FormData()
  form.append("file", file)
  return apiFetch<{ imported: number; skipped: number; errors: string[] }>(
    "/api/cases/import-csv",
    { method: "POST", body: form, headers: {} }
  )
}

export function toggleCase(id: number) {
  return apiFetch<unknown>(`/api/cases/${id}/toggle`, { method: "POST" })
}

export function generateCaseEmbedding(id: number) {
  return apiFetch<{ case_id: number; status: string }>(
    `/api/cases/${id}/embedding`,
    { method: "POST" }
  )
}

export function rebuildEmbeddings() {
  return apiFetch<{ rebuilt: number }>("/api/cases/rebuild-embeddings", {
    method: "POST",
  })
}
