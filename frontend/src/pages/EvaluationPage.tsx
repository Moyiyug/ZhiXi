import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { apiFetch } from "@/api/client"
import { RetrievedCaseCard } from "@/components/generate/RetrievedCaseCard"
import { BlueprintPanel } from "@/components/zhi/BlueprintPanel"
import { formatPercent, formatHeatLevel } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Clock3, Gauge, ListChecks, Play, Target } from "lucide-react"
import type { CurrentEventProfile, RetrievedCaseItem } from "@/types/api"

const DEMO_EVENTS = [
  { id: "golden_event_1", title: "高校食堂卫生问题", signal: "校园 / 食安 / 问责" },
  { id: "golden_event_2", title: "景区 NPC 互动低俗争议", signal: "文旅 / 视频传播 / 道歉" },
  { id: "golden_event_3", title: "政务通报信息不透明", signal: "政务 / 数据公开 / 整改" },
]

const FOCUS_OPTIONS = [
  { label: "回应窗口", hint: "判断首轮回应和升级节奏" },
  { label: "风险升温", hint: "关注热度继续上行信号" },
  { label: "补救举措", hint: "优先召回行动补救策略" },
  { label: "话术风险", hint: "筛查容易激化质疑的表述" },
]

const MANUAL_SCORES = [
  { key: "relevance", label: "相关性" },
  { key: "actionability", label: "可操作性" },
  { key: "risk_control", label: "风险控制" },
  { key: "expression_quality", label: "表达质量" },
]

type EvaluationMetrics = {
  top_k?: number
  average_final_score: number
  has_same_domain_hit: boolean
  focus_options?: string[]
}

function getResponseWindow(heatLevel: number) {
  if (heatLevel >= 5) return "0-2 小时内"
  if (heatLevel >= 4) return "当天阶段性说明"
  if (heatLevel >= 3) return "24 小时内准备口径"
  return "常规跟进"
}

export function EvaluationPage() {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)
  const [customText, setCustomText] = useState("")
  const [isCustom, setIsCustom] = useState(false)
  const [topK, setTopK] = useState(3)
  const [focusOptions, setFocusOptions] = useState<string[]>(["回应窗口", "补救举措"])
  const [phase, setPhase] = useState<"initial" | "loading" | "result">("initial")
  const [result, setResult] = useState<{
    profile: CurrentEventProfile
    results: RetrievedCaseItem[]
    metrics: EvaluationMetrics
  } | null>(null)
  const [scores, setScores] = useState<Record<string, number>>({
    relevance: 3,
    actionability: 3,
    risk_control: 3,
    expression_quality: 3,
  })

  const evalMut = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch<{
        profile: CurrentEventProfile
        results: RetrievedCaseItem[]
        metrics: EvaluationMetrics
      }>("/api/evaluation/run-demo", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (data) => {
      setResult(data)
      setPhase("result")
    },
    onError: (e: Error) => {
      toast.error(`评估失败: ${e.message}`)
      setPhase("initial")
    },
  })

  const customLength = customText.trim().length
  const customValid = customLength >= 50 && customLength <= 800

  const toggleFocus = (label: string) => {
    setFocusOptions((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    )
  }

  const handleRun = () => {
    if (isCustom && !customValid) {
      toast.error("自定义事件需保持在 50-800 字")
      return
    }
    if (!selectedEvent && !isCustom) return
    setPhase("loading")
    const body = isCustom
      ? { event_text: customText.trim(), top_k: topK, focus_options: focusOptions }
      : { demo_event_id: selectedEvent, top_k: topK, focus_options: focusOptions }
    evalMut.mutate(body)
  }

  return (
    <BlueprintPanel
      className="mx-auto min-h-full max-w-[1500px]"
      contentClassName="flex min-h-full flex-col gap-4 lg:flex-row"
      label="Evaluation playback"
    >
      <div className="w-full shrink-0 overflow-auto rounded-lg border border-[--zx-line] bg-white/55 p-4 lg:w-[340px]">
        <div className="mb-4">
          <p className="text-sm font-semibold text-[--zx-ink]">事件评估工作台</p>
          <p className="mt-1 text-xs leading-5 text-[--zx-muted]">预测事件压力，召回相似案例，并形成处置方案参考。</p>
        </div>

        <p className="mb-2 text-xs font-medium uppercase text-[--zx-muted]">固定样例</p>
        <div className="space-y-1">
          {DEMO_EVENTS.map((ev) => (
            <button
              key={ev.id}
              type="button"
              onClick={() => {
                setSelectedEvent(ev.id)
                setIsCustom(false)
              }}
              className={cn(
                "w-full rounded-lg px-3 py-2 text-left transition-colors",
                selectedEvent === ev.id && !isCustom
                  ? "border-l-2 border-[--zx-blue] bg-[--zx-blue]/10 text-[--zx-blue-soft]"
                  : "text-[--zx-muted] hover:bg-white/70"
              )}
            >
              <span className="block text-sm">{ev.title}</span>
              <span className="mt-0.5 block text-[10px] opacity-70">{ev.signal}</span>
            </button>
          ))}
        </div>

        <Separator className="my-4 bg-[--zx-line]" />

        <p className="mb-2 text-xs font-medium uppercase text-[--zx-muted]">自定义事件</p>
        <Textarea
          placeholder="输入自定义事件文本（50-800 字）…"
          value={customText}
          onChange={(e) => {
            setCustomText(e.target.value)
            setIsCustom(true)
            setSelectedEvent(null)
          }}
          className="min-h-[140px] text-xs"
        />
        <div className="mt-1 flex justify-between text-[10px] text-[--zx-muted]">
          <span>用于画像、检索和方案评估</span>
          <span className={cn(isCustom && !customValid ? "text-[--zx-danger]" : "text-[--zx-muted]")}>{customLength}/800</span>
        </div>

        <Separator className="my-4 bg-[--zx-line]" />

        <p className="mb-2 text-xs font-medium uppercase text-[--zx-muted]">评估侧重点</p>
        <div className="grid grid-cols-2 gap-2">
          {FOCUS_OPTIONS.map((item) => {
            const selected = focusOptions.includes(item.label)
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => toggleFocus(item.label)}
                className={cn(
                  "min-h-[64px] rounded-lg border px-3 py-2 text-left transition-colors",
                  selected
                    ? "border-[--zx-blue] bg-[--zx-blue]/10 text-[--zx-blue-soft]"
                    : "border-[--zx-line] bg-[--zx-stage] text-[--zx-muted] hover:border-[--zx-blue]/50"
                )}
              >
                <span className="block text-xs font-medium">{item.label}</span>
                <span className="mt-0.5 block text-[10px] leading-4 opacity-70">{item.hint}</span>
              </button>
            )
          })}
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <span className="text-xs text-[--zx-muted]">参考数量</span>
          <div className="flex rounded-lg border border-[--zx-line] bg-[--zx-stage] p-0.5">
            {[3, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setTopK(value)}
                className={cn(
                  "h-7 w-12 rounded-md text-xs transition-colors",
                  topK === value ? "bg-[--zx-blue] text-white" : "text-[--zx-muted] hover:bg-[--zx-bg-soft]"
                )}
              >
                Top-{value}
              </button>
            ))}
          </div>
        </div>

        <Button
          className="mt-4 w-full"
          onClick={handleRun}
          disabled={evalMut.isPending || (isCustom ? !customValid : !selectedEvent)}
        >
          <Play className="mr-1.5 h-4 w-4" />
          {evalMut.isPending ? "评估中…" : "评估风险与方案"}
        </Button>
      </div>

      <div className="min-w-0 flex-1 overflow-auto rounded-lg border border-[--zx-line] bg-white/55 p-5">
        {phase === "initial" && (
          <div className="flex h-full items-center justify-center">
            <div className="grid w-full max-w-2xl gap-3 md:grid-cols-3">
              {[
                { icon: Gauge, title: "风险压力", text: "热度、诉求与响应窗口" },
                { icon: Target, title: "参考匹配", text: "Top-K 案例与五项分数" },
                { icon: ListChecks, title: "方案参考", text: "行动节奏与话术风险" },
              ].map((item) => (
                <Card key={item.title} className="border-[--zx-line] bg-[--zx-stage] p-4">
                  <item.icon className="mb-3 h-5 w-5 text-[--zx-blue-soft]" />
                  <p className="text-sm font-medium text-[--zx-ink]">{item.title}</p>
                  <p className="mt-1 text-xs leading-5 text-[--zx-muted]">{item.text}</p>
                </Card>
              ))}
            </div>
          </div>
        )}

        {phase === "loading" && (
          <div className="space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        )}

        {phase === "result" && result && (
          <div className="space-y-6">
            <Card className="space-y-2 border-[--zx-line] bg-[--zx-stage] p-4">
              <div className="flex items-center gap-2">
                <Badge className="bg-[--zx-blue]/10 text-[--zx-blue-soft]">{result.profile.domain}</Badge>
                <Badge className="bg-[--zx-warning]/10 text-[--zx-warning]">{formatHeatLevel(result.profile.heat_level)}</Badge>
                <span className="ml-auto text-xs text-[--zx-muted]">
                  置信度 {(result.profile.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <p className="line-clamp-2 text-xs text-[--zx-muted]">{result.profile.event_summary}</p>
            </Card>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <Card className="flex flex-col items-center gap-1 border-[--zx-line] bg-[--zx-stage] p-4">
                <span className="text-xs text-[--zx-muted]">平均参考匹配度</span>
                <span className="font-mono text-2xl font-bold text-[--zx-blue-soft]">
                  {formatPercent(result.metrics.average_final_score)}
                </span>
              </Card>
              <Card className="flex flex-col items-center gap-1 border-[--zx-line] bg-[--zx-stage] p-4">
                <span className="text-xs text-[--zx-muted]">同领域命中</span>
                <span className={cn("text-lg font-semibold", result.metrics.has_same_domain_hit ? "text-[--zx-success]" : "text-[--zx-warning]")}>
                  {result.metrics.has_same_domain_hit ? "命中" : "未命中"}
                </span>
              </Card>
              <Card className="flex flex-col items-center gap-1 border-[--zx-line] bg-[--zx-stage] p-4">
                <span className="text-xs text-[--zx-muted]">建议响应窗口</span>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-[--zx-ink]">
                  <Clock3 className="h-4 w-4 text-[--zx-blue-soft]" />
                  {getResponseWindow(result.profile.heat_level)}
                </span>
              </Card>
            </div>

            {result.metrics.focus_options && result.metrics.focus_options.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-xs text-[--zx-muted]">
                <span>侧重点</span>
                {result.metrics.focus_options.map((focus) => (
                  <Badge key={focus} variant="outline" className="border-[--zx-blue]/30 bg-[--zx-blue]/5 text-[--zx-blue-soft]">
                    {focus}
                  </Badge>
                ))}
              </div>
            )}

            {result.results.length > 0 && (
              <div>
                <p className="mb-3 text-sm text-[--zx-ink]">参考案例 ({result.results.length})</p>
                <div className="space-y-3">
                  {result.results.map((r, i) => (
                    <RetrievedCaseCard key={r.case_id} result={r} index={i} />
                  ))}
                </div>
              </div>
            )}

            <Card className="space-y-3 border-[--zx-line] bg-[--zx-stage] p-4">
              <p className="text-sm text-[--zx-muted]">人工复核评分</p>
              {MANUAL_SCORES.map(({ key, label }) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="w-20 text-xs text-[--zx-muted]">{label}</span>
                  <Slider
                    value={[scores[key] ?? 3]}
                    onValueChange={(v) => setScores((prev) => ({ ...prev, [key]: (v as number[])[0] }))}
                    min={1}
                    max={5}
                    step={1}
                    className="flex-1"
                  />
                  <span className="w-4 text-right font-mono text-xs text-[--zx-ink]">{scores[key] ?? 3}</span>
                </div>
              ))}
            </Card>

            <p className="text-center text-xs text-[--zx-muted]">
              仅为课程原型验证，不声称严格因果推断。
            </p>
          </div>
        )}
      </div>
    </BlueprintPanel>
  )
}
