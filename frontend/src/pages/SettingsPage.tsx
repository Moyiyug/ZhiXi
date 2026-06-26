import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { BlueprintPanel } from "@/components/zhi/BlueprintPanel"
import { fetchPublicSettings } from "@/api/settings"
import { apiFetch } from "@/api/client"
import { SCORE_LABELS } from "@/lib/scores"
import { cn } from "@/lib/utils"
import { useState } from "react"

const DICT_CATEGORIES = [
  { key: "public_demands", label: "公众诉求" },
  { key: "heat_levels", label: "热度等级" },
  { key: "strategy_types", label: "策略类型" },
  { key: "domain_labels", label: "领域标签" },
  { key: "domain_relations", label: "领域关系" },
]

export function SettingsPage() {
  const { data: settings, isLoading: sLoading, isError: sError, refetch: sRefetch } = useQuery({
    queryKey: ["settings"],
    queryFn: fetchPublicSettings,
    staleTime: 60_000,
  })

  const { data: dicts, isLoading: dLoading } = useQuery({
    queryKey: ["dictionaries"],
    queryFn: () => apiFetch<Record<string, unknown[]>>("/api/dictionaries"),
    staleTime: 120_000,
  })

  const [expandedCat, setExpandedCat] = useState<string | null>(null)

  if (sError) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center">
          <p className="mb-3 text-sm text-[--zx-danger]">加载失败</p>
          <Button variant="outline" onClick={() => sRefetch()}>重试</Button>
        </div>
      </div>
    )
  }

  if (sLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-6">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    )
  }

  const s = settings!

  return (
    <BlueprintPanel className="mx-auto max-w-4xl" contentClassName="space-y-4 p-5 md:p-6" label="System configuration">
      <h2 className="text-lg font-semibold text-[--zx-ink]">系统设置</h2>

      {/* Mock 模式 + Key 状态 */}
      <Card className="space-y-3 border-[--zx-line] bg-[--zx-stage] p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[--zx-muted]">运行模式</span>
          <Badge className={s.mock_mode ? "bg-[--zx-success]/10 text-[--zx-success]" : "bg-[--zx-blue]/10 text-[--zx-blue-soft]"}>
            {s.mock_mode ? "Mock 模式" : "真实模型"}
          </Badge>
        </div>
        <Separator className="bg-[--zx-line]" />
        <div>
          <span className="text-sm text-[--zx-muted]">API Key 状态</span>
          <div className="mt-2 space-y-1.5">
            {["dashscope", "deepseek"].map((k) => {
              const status = s.keys[k as keyof typeof s.keys] ?? "missing"
              const label = k === "dashscope" ? "Embedding (DashScope)" : "LLM (DeepSeek)"
              return (
                <div key={k} className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-full", status === "configured" ? "bg-[--zx-success]" : "bg-[--zx-muted]")} />
                  <span className="text-sm text-[--zx-ink]">{label}</span>
                  <span className={cn("text-xs", status === "configured" ? "text-[--zx-success]" : "text-[--zx-muted]")}>
                    {status === "configured" ? "已配置" : "未配置"}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </Card>

      {/* 模型 */}
      <Card className="space-y-2 border-[--zx-line] bg-[--zx-stage] p-5">
        <span className="text-sm text-[--zx-muted]">模型配置（只读）</span>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div><span className="text-[--zx-muted]">Embedding: </span><span className="text-[--zx-ink]">{s.embedding_model}</span></div>
          <div><span className="text-[--zx-muted]">LLM Fast: </span><span className="text-[--zx-ink]">{s.llm_model_fast}</span></div>
          <div className="col-span-2"><span className="text-[--zx-muted]">LLM Pro: </span><span className="text-[--zx-ink]">{s.llm_model_pro}</span></div>
        </div>
      </Card>

      {/* 检索权重 */}
      <Card className="space-y-2 border-[--zx-line] bg-[--zx-stage] p-5">
        <span className="text-sm text-[--zx-muted]">检索权重</span>
        <div className="space-y-1.5">
          {Object.entries(s.retrieval.weights).map(([k, v]) => (
            <div key={k} className="flex items-center gap-2 text-xs">
              <span className="w-32 text-[--zx-muted]">{SCORE_LABELS[k as keyof typeof SCORE_LABELS] ?? k}</span>
              <div className="h-2 flex-1 rounded-full bg-[--zx-track]">
                <div className="h-full rounded-full bg-[--zx-blue]" style={{ width: `${v * 100}%` }} />
              </div>
              <span className="w-8 text-right font-mono text-[--zx-ink]">{(v * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </Card>

      {/* 字典 */}
      <Card className="border-[--zx-line] bg-[--zx-stage] p-5">
        <span className="text-sm text-[--zx-muted]">背景判断字典</span>
        {dLoading ? (
          <Skeleton className="mt-3 h-32 w-full rounded" />
        ) : (
          <div className="mt-3 space-y-1">
            {DICT_CATEGORIES.map((cat) => {
              const items = (dicts?.[cat.key] ?? []) as Record<string, unknown>[]
              const open = expandedCat === cat.key
              return (
                <div key={cat.key} className="rounded border border-[--zx-line]">
                  <button
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-[--zx-ink] hover:bg-white/5"
                    onClick={() => setExpandedCat(open ? null : cat.key)}
                  >
                    {cat.label} ({items.length})
                    <span className="text-xs text-[--zx-muted]">{open ? "▲" : "▼"}</span>
                  </button>
                  {open && (
                    <div className="space-y-2 border-t border-[--zx-line] px-3 py-2">
                      {items.map((item: Record<string, unknown>, i: number) => (
                        <div key={i} className="text-xs">
                          <p className="text-[--zx-ink] font-medium">{String(item.key ?? "")}</p>
                          {Boolean(item.meaning) && <p className="text-[--zx-muted]">{String(item.meaning)}</p>}
                          {Boolean(item.report_hint) && <p className="text-[--zx-blue-soft]">报告: {String(item.report_hint)}</p>}
                          {Boolean(item.speech_hint) && <p className="text-[--zx-success]">话术: {String(item.speech_hint)}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </BlueprintPanel>
  )
}
