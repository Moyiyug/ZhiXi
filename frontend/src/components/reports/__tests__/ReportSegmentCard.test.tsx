import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { ReportSegmentCard } from "../ReportSegmentCard"

const baseSegment = {
  id: 1,
  report_id: 1,
  segment_key: "analysis_and_cases",
  title: "一、舆情画像与历史案例参考",
  content_md: "测试内容",
  model_name: "mock-llm",
  generation_status: "ready",
  regenerated_count: 0,
  created_at: "2026-01-01T00:00:00",
  updated_at: "2026-01-01T00:00:00",
}

const noop = vi.fn()

describe("ReportSegmentCard", () => {
  it("renders ready segment with content", () => {
    render(
      <ReportSegmentCard
        segment={baseSegment}
        onRegenerate={noop}
        onCopy={noop}
        onViewEvidence={noop}
        isRegenerating={false}
      />
    )
    expect(screen.getByText("一、舆情画像与历史案例参考")).toBeDefined()
    expect(screen.getByText("测试内容")).toBeDefined()
  })

  it("shows regenerated count when > 0", () => {
    const seg = { ...baseSegment, regenerated_count: 3 }
    render(
      <ReportSegmentCard
        segment={seg}
        onRegenerate={noop}
        onCopy={noop}
        onViewEvidence={noop}
        isRegenerating={false}
      />
    )
    expect(screen.getByText("已重新生成 3 次")).toBeDefined()
  })

  it("shows model name", () => {
    render(
      <ReportSegmentCard
        segment={baseSegment}
        onRegenerate={noop}
        onCopy={noop}
        onViewEvidence={noop}
        isRegenerating={false}
      />
    )
    expect(screen.getByText("model: mock-llm")).toBeDefined()
  })

  it("renders pending state", () => {
    const seg = { ...baseSegment, generation_status: "pending", content_md: "" }
    render(
      <ReportSegmentCard
        segment={seg}
        onRegenerate={noop}
        onCopy={noop}
        onViewEvidence={noop}
        isRegenerating={false}
      />
    )
    expect(screen.getByText("等待生成…")).toBeDefined()
  })

  it("renders failed state with retry button", () => {
    const seg = { ...baseSegment, generation_status: "failed", content_md: "" }
    render(
      <ReportSegmentCard
        segment={seg}
        onRegenerate={noop}
        onCopy={noop}
        onViewEvidence={noop}
        isRegenerating={false}
      />
    )
    expect(screen.getByText("生成失败，请重试")).toBeDefined()
  })
})
