import { afterEach, describe, expect, it, vi } from "vitest"
import { apiFetch } from "./client"

describe("apiFetch", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("returns text responses such as markdown exports", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("## report", {
        status: 200,
        headers: { "content-type": "text/markdown; charset=utf-8" },
      }))
    )

    await expect(apiFetch<string>("/api/reports/1/export.md")).resolves.toBe("## report")
  })

  it("lets the browser set multipart headers for FormData uploads", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response(
      JSON.stringify({ imported: 1, skipped: 0, errors: [] }),
      { status: 200, headers: { "content-type": "application/json" } }
    ))
    vi.stubGlobal("fetch", fetchMock)

    const form = new FormData()
    form.append("file", new File(["title"], "cases.csv", { type: "text/csv" }))

    await apiFetch("/api/cases/import-csv", { method: "POST", body: form })

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit
    expect((init.headers as Headers).has("Content-Type")).toBe(false)
  })
})
