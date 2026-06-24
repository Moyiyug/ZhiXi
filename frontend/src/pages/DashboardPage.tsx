import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { apiFetch } from "@/api/client"
import { Archive, CheckCircle, Cpu, FileText, Sparkles, ArrowRight } from "lucide-react"

interface DashboardSummary {
  case_total: number
  case_enabled: number
  embedding_ready: number
  report_total: number
  mock_mode: boolean
}

const PIPELINE_NODES = [
  { label: "案例素材库", sub: "CSV / 手动导入" },
  { label: "背景判断字典", sub: "标签解释" },
  { label: "向量召回", sub: "cosine Top-10" },
  { label: "加权重排", sub: "5 子分数加权" },
  { label: "Evidence Pack", sub: "画像 + 案例 + 限制" },
  { label: "三段式报告", sub: "独立分段生成" },
]

export function DashboardPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => apiFetch<DashboardSummary>("/api/dashboard/summary"),
    staleTime: 15_000,
  })

  const metrics = [
    { key: "case_total", label: "案例总数", icon: Archive, value: data?.case_total },
    { key: "case_enabled", label: "可检索案例", icon: CheckCircle, value: data?.case_enabled },
    { key: "embedding_ready", label: "已向量化", icon: Cpu, value: data?.embedding_ready },
    { key: "report_total", label: "报告数量", icon: FileText, value: data?.report_total },
  ]

  if (isError) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center">
          <p className="mb-3 text-sm text-[--zx-danger]">加载失败</p>
          <Button variant="outline" onClick={() => refetch()}>重试</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      {/* Hero */}
      <div className="text-center">
        <h1 className="mb-2 text-3xl font-bold tracking-wide text-[--zx-canvas]">ZhiXi 智析</h1>
        <p className="mb-6 text-sm text-[--zx-muted]">
          基于小样本案例库的 RAG 舆情处置建议辅助生成系统
        </p>
        <div className="flex justify-center gap-3">
          <Link to="/cases">
            <Button>
              <Archive className="mr-1.5 h-4 w-4" />案例素材库
            </Button>
          </Link>
          <Link to="/generate">
            <Button variant="outline">
              <Sparkles className="mr-1.5 h-4 w-4" />智能生成
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {isLoading
          ? metrics.map((m) => <Skeleton key={m.key} className="h-28 rounded-xl" />)
          : metrics.map((m) => (
              <Card key={m.key} className="flex flex-col items-center justify-center gap-2 border-[--zx-line] bg-[--zx-stage] p-5">
                <m.icon className="h-5 w-5 text-[--zx-blue-soft]" />
                <span className="font-mono text-3xl font-bold text-[--zx-canvas]">
                  {m.value ?? "—"}
                </span>
                <span className="text-xs text-[--zx-muted]">{m.label}</span>
              </Card>
            ))}
      </div>

      {/* Pipeline */}
      <div>
        <h2 className="mb-4 text-center text-sm font-medium text-[--zx-muted]">系统流程</h2>
        <svg viewBox="0 0 900 120" className="w-full" xmlns="http://www.w3.org/2000/svg">
          {PIPELINE_NODES.map((node, i) => {
            const x = 20 + i * 148
            return (
              <g key={node.label}>
                <rect
                  x={x}
                  y={30}
                  width={118}
                  height={44}
                  rx={8}
                  fill="var(--zx-stage)"
                  stroke="var(--zx-blue)"
                  strokeWidth="1"
                />
                <text
                  x={x + 59}
                  y={50}
                  textAnchor="middle"
                  fill="var(--zx-canvas)"
                  fontSize="11"
                  fontFamily="var(--font-sans)"
                >
                  {node.label}
                </text>
                <text
                  x={x + 59}
                  y={64}
                  textAnchor="middle"
                  fill="var(--zx-muted)"
                  fontSize="9"
                  fontFamily="var(--font-sans)"
                >
                  {node.sub}
                </text>
                {i < 5 && (
                  <ArrowRight
                    x={x + 120}
                    y={42}
                    style={{ width: 18, height: 18, color: "var(--zx-line)" }}
                  />
                )}
              </g>
            )
          })}
        </svg>
      </div>

      {/* Limits */}
      <Card className="border border-[--zx-warning]/20 bg-[--zx-warning]/5 p-4 text-center">
        <p className="text-xs text-[--zx-warning]">
          当前案例库为课程项目小样本案例库，检索结果仅表示参考匹配度，不构成真实决策依据。
        </p>
      </Card>
    </div>
  )
}
