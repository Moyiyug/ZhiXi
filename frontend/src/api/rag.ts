import { apiFetch } from "./client"

export function generateProfile(eventText: string, hints?: Record<string, unknown>) {
  return apiFetch<unknown>("/api/events/profile", {
    method: "POST",
    body: JSON.stringify({ event_text: eventText, manual_hints: hints ?? null }),
  })
}

export function retrieveCases(eventText: string, profile: unknown, topK = 3) {
  return apiFetch<unknown>("/api/rag/retrieve", {
    method: "POST",
    body: JSON.stringify({ event_text: eventText, profile, top_k: topK }),
  })
}

export function buildEvidencePack(eventText: string, profile: unknown, topK = 3) {
  return apiFetch<unknown>("/api/rag/evidence-pack", {
    method: "POST",
    body: JSON.stringify({ event_text: eventText, profile, top_k: topK }),
  })
}
