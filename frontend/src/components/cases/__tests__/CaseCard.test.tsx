import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CaseCard } from "../CaseCard"

const MOCK_CASE = {
  id: 1,
  title: "某高校食堂卫生事件",
  domain: "思想政治教育类",
  heat_level: 4,
  effect_score: 4,
  enabled: true,
  embedding_status: "ready",
  public_demands: ["要求信息公开", "要求问责"],
  strategy_types: ["信息公开型", "行动补救型"],
  event_description: "某高校食堂被曝食品卫生问题",
  strategy_text: "及时通报并启动调查",
}

describe("CaseCard", () => {
  it("renders case title", () => {
    render(<CaseCard caseItem={MOCK_CASE} onClick={vi.fn()} onToggle={vi.fn()} />)
    expect(screen.getByText("某高校食堂卫生事件")).toBeDefined()
  })

  it("renders domain badge", () => {
    render(<CaseCard caseItem={MOCK_CASE} onClick={vi.fn()} onToggle={vi.fn()} />)
    expect(screen.getByText("思想政治教育类")).toBeDefined()
  })

  it("renders heat level badge", () => {
    render(<CaseCard caseItem={MOCK_CASE} onClick={vi.fn()} onToggle={vi.fn()} />)
    // formatHeatLevel(4) should return something with "4"
    expect(screen.getByText(/4/)).toBeDefined()
  })

  it("renders embedding status badge", () => {
    render(<CaseCard caseItem={MOCK_CASE} onClick={vi.fn()} onToggle={vi.fn()} />)
    expect(screen.getByText("已向量化")).toBeDefined()
  })

  it("renders effect score dots", () => {
    render(<CaseCard caseItem={MOCK_CASE} onClick={vi.fn()} onToggle={vi.fn()} />)
    // 4 filled dots + 1 empty dot
    expect(screen.getByText("●●●●○")).toBeDefined()
  })

  it("renders public demand chips (max 3)", () => {
    render(<CaseCard caseItem={MOCK_CASE} onClick={vi.fn()} onToggle={vi.fn()} />)
    expect(screen.getByText("要求信息公开")).toBeDefined()
    expect(screen.getByText("要求问责")).toBeDefined()
  })

  it("renders strategy type chips", () => {
    render(<CaseCard caseItem={MOCK_CASE} onClick={vi.fn()} onToggle={vi.fn()} />)
    expect(screen.getByText("信息公开型")).toBeDefined()
  })

  it("calls onClick when card is clicked", async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(<CaseCard caseItem={MOCK_CASE} onClick={onClick} onToggle={vi.fn()} />)
    await user.click(screen.getByText("某高校食堂卫生事件"))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it("calls onToggle when switch is clicked", async () => {
    const onToggle = vi.fn()
    const user = userEvent.setup()
    render(<CaseCard caseItem={MOCK_CASE} onClick={vi.fn()} onToggle={onToggle} />)
    const switchEl = screen.getByRole("switch")
    await user.click(switchEl)
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it("shows disabled opacity when case is not enabled", () => {
    const disabledCase = { ...MOCK_CASE, enabled: false }
    const { container } = render(<CaseCard caseItem={disabledCase} onClick={vi.fn()} onToggle={vi.fn()} />)
    const card = container.querySelector(".cursor-pointer")
    expect(card?.className).toContain("opacity-50")
  })

  it("shows correct embedding status for failed cases", () => {
    const failedCase = { ...MOCK_CASE, embedding_status: "failed" }
    render(<CaseCard caseItem={failedCase} onClick={vi.fn()} onToggle={vi.fn()} />)
    expect(screen.getByText("失败")).toBeDefined()
  })

  it("shows '未向量化' for none embedding status", () => {
    const noneCase = { ...MOCK_CASE, embedding_status: "none" }
    render(<CaseCard caseItem={noneCase} onClick={vi.fn()} onToggle={vi.fn()} />)
    expect(screen.getByText("未向量化")).toBeDefined()
  })
})
