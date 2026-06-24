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
import { formatPercent, formatHeatLevel } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Play } from "lucide-react"
import type { CurrentEventProfile, RetrievedCaseItem } from "@/types/api"

const DEMO_EVENTS = [
  { id: "golden_event_1", title: "高校食堂卫生问题" },
  { id: "golden_event_2", title: "景区 NPC 互动低俗争议" },
  { id: "golden_event_3", title: "政务通报信息不透明" },
]

const MANUAL_SCORES = [
  { key: "relevance", label: "相关性" },
  { key: "actionability", label: "可操作性" },
  { key: "risk_control", label: "风险控制" },
  { key: "expression_quality", label: "表达质量" },
]

export function EvaluationPage() {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)
  const [customText, setCustomText] = useState("")
  const [isCustom, setIsCustom] = useState(false)
  const [phase, setPhase] = useState<"initial" | "loading" | "result">("initial")
  const [result, setResult] = useState<{
    profile: CurrentEventProfile
    results: RetrievedCaseItem[]
    metrics: { average_final_score: number; has_same_domain_hit: boolean }
  } | null>(null)
  const [scores, setScores] = useState<Record<string, number>>({
    relevance: 3, actionability: 3, risk_control: 3, expression_quality: 3,
  })

  const evalMut = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch<{
        profile: CurrentEventProfile
        results: RetrievedCaseItem[]
        metrics: { average_final_score: number; has_same_domain_hit: boolean }
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

  const handleRun = () => {
    if (!selectedEvent && !isCustom) return
    setPhase("loading")
    const body = isCustom
      ? { event_text: customText, top_k: 3 }
      : { demo_event_id: selectedEvent, top_k: 3 }
    evalMut.mutate(body)
  }

  return (
    <div className="flex h-full gap-0">
      {/* 左栏：选择事件 */}
      <div className="w-[340px] shrink-0 overflow-auto border-r border-[--zx-line] p-4">
        <p className="mb-3 text-sm font-medium text-[--zx-canvas]">测试事件</p>
        <div className="space-y-1">
          {DEMO_EVENTS.map((ev) => (
            <button
              key={ev.id}
              onClick={() => { setSelectedEvent(ev.id); setIsCustom(false) }}
              className={cn(
                "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                selectedEvent === ev.id && !isCustom
                  ? "border-l-2 border-[--zx-blue] bg-[--zx-blue]/10 text-[--zx-blue-soft]"
                  : "text-[--zx-muted] hover:bg-white/5"
              )}
            >
              {ev.title}
            </button>
          ))}
        </div>

        <Separator className="my-4 bg-[--zx-line]" />

        <p className="mb-2 text-sm font-medium text-[--zx-canvas]">或自定义事件</p>
        <Textarea
          placeholder="输入自定义事件文本（50-800 字）…"
          value={customText}
          onChange={(e) => { setCustomText(e.target.value); setIsCustom(true); setSelectedEvent(null) }}
          className="min-h-[140px] text-xs"
        />

        <Button
          className="mt-4 w-full"
          onClick={handleRun}
          disabled={evalMut.isPending || (!selectedEvent && !isCustom)}
        >
          <Play className="mr-1.5 h-4 w-4" />
          {evalMut.isPending ? "评估中…" : "运行评估"}
        </Button>
      </div>

      {/* 右栏：结果 */}
      <div className="flex-1 overflow-auto p-6">
        {phase === "initial" && (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-[--zx-muted]">选择左侧测试事件，开始评估</p>
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
            {/* Profile */}
            <Card className="space-y-2 border-[--zx-line] bg-[--zx-stage] p-4">
              <div className="flex items-center gap-2">
                <Badge className="bg-[--zx-blue]/10 text-[--zx-blue-soft]">{result.profile.domain}</Badge>
                <Badge className="bg-[--zx-warning]/10 text-[--zx-warning]">{formatHeatLevel(result.profile.heat_level)}</Badge>
                <span className="ml-auto text-xs text-[--zx-muted]">
                  置信度 {(result.profile.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-xs text-[--zx-muted] line-clamp-2">{result.profile.event_summary}</p>
            </Card>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="flex flex-col items-center gap-1 border-[--zx-line] bg-[--zx-stage] p-4">
                <span className="text-xs text-[--zx-muted]">平均参考匹配度</span>
                <span className="font-mono text-2xl font-bold text-[--zx-blue-soft]">
                  {formatPercent(result.metrics.average_final_score)}
                </span>
              </Card>
              <Card className="flex flex-col items-center gap-1 border-[--zx-line] bg-[--zx-stage] p-4">
                <span className="text-xs text-[--zx-muted]">同领域命中</span>
                <span className="text-2xl">{result.metrics.has_same_domain_hit ? "✅" : "❌"}</span>
              </Card>
            </div>

            {/* Top-K */}
            {result.results.length > 0 && (
              <div>
                <p className="mb-3 text-sm text-[--zx-canvas]">检索结果 ({result.results.length})</p>
                <div className="space-y-3">
                  {result.results.map((r, i) => (
                    <RetrievedCaseCard key={r.case_id} result={r} index={i} />
                  ))}
                </div>
              </div>
            )}

            {/* 人工评分 */}
            <Card className="space-y-3 border-[--zx-line] bg-[--zx-stage] p-4">
              <p className="text-sm text-[--zx-muted]">人工评分</p>
              {MANUAL_SCORES.map(({ key, label }) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="w-20 text-xs text-[--zx-muted]">{label}</span>
                  <Slider
                    value={[scores[key] ?? 3]}
                    onValueChange={(v) => setScores((prev) => ({ ...prev, [key]: (v as number[])[0] }))}
                    min={1} max={5} step={1}
                    className="flex-1"
                  />
                  <span className="w-4 text-right text-xs font-mono text-[--zx-canvas]">{scores[key] ?? 3}</span>
                </div>
              ))}
            </Card>

            {/* 底部提示 */}
            <p className="text-center text-xs text-[--zx-muted]">
              仅为课程原型验证，不声称严格因果推断
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
