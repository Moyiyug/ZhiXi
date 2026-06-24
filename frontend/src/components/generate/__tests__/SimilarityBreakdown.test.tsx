import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { SimilarityBreakdown } from "../SimilarityBreakdown"

describe("SimilarityBreakdown", () => {
  const baseScores = {
    semantic_score: 0.82,
    demand_score: 1.0,
    heat_score: 0.75,
    domain_score: 1.0,
    effect_score: 0.8,
  }

  it("renders all 5 sub-score labels", () => {
    render(<SimilarityBreakdown scores={baseScores} final={0.85} />)
    expect(screen.getByText("语义相似度")).toBeDefined()
    expect(screen.getByText("公众诉求匹配")).toBeDefined()
    expect(screen.getByText("热度等级接近度")).toBeDefined()
    expect(screen.getByText("领域匹配")).toBeDefined()
    expect(screen.getByText("历史效果权重")).toBeDefined()
  })

  it("renders final score label", () => {
    render(<SimilarityBreakdown scores={baseScores} final={0.85} />)
    expect(screen.getByText("参考匹配度")).toBeDefined()
  })

  it("renders percentage values", () => {
    render(<SimilarityBreakdown scores={baseScores} final={0.85} />)
    expect(screen.getByText("82%")).toBeDefined()
    expect(screen.getByText("85%")).toBeDefined()
  })

  it("handles zero scores", () => {
    const zeros = {
      semantic_score: 0,
      demand_score: 0,
      heat_score: 0,
      domain_score: 0,
      effect_score: 0,
    }
    render(<SimilarityBreakdown scores={zeros} final={0} />)
    const zeroEls = screen.getAllByText("0%")
    expect(zeroEls.length).toBe(6) // 5 sub-scores + final
  })
})
