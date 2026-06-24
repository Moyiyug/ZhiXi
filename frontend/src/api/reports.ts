import { apiFetch } from "./client"

export function createReport(data: {
  input_event_text: string
  profile: unknown
  evidence_pack: unknown
  generate_now?: boolean
}) {
  return apiFetch<unknown>("/api/reports", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export function fetchReport(id: number) {
  return apiFetch<unknown>(`/api/reports/${id}`)
}

export function regenerateSegment(reportId: number, segmentKey: string) {
  return apiFetch<unknown>(
    `/api/reports/${reportId}/segments/${segmentKey}/regenerate`,
    { method: "POST" }
  )
}

export function exportMarkdown(reportId: number): Promise<string> {
  return apiFetch<string>(`/api/reports/${reportId}/export.md`)
}
