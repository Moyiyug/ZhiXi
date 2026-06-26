import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { BlueprintPanel } from "@/components/zhi/BlueprintPanel"
import { apiFetch } from "@/api/client"
import { deleteReport, fetchReports } from "@/api/reports"
import { Archive, BarChart3, CheckCircle, Cpu, FileText, Sparkles, ArrowRight, Trash2 } from "lucide-react"
import type { ReportResponse } from "@/types/api"

interface DashboardSummary {
  case_total: number
  case_enabled: number
  embedding_ready: number
  report_total: number
  mock_mode: boolean
}

const PIPELINE_NODES = [
  { label: "事件输入", sub: "待评估场景" },
  { label: "画像评估", sub: "领域 / 诉求 / 热度" },
  { label: "案例召回", sub: "Top-K 参考" },
  { label: "重排研判", sub: "5 子分数加权" },
  { label: "素材合成", sub: "Evidence Pack" },
  { label: "处置报告", sub: "建议与话术" },
]

export function DashboardPage() {
  const qc = useQueryClient()
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => apiFetch<DashboardSummary>("/api/dashboard/summary"),
    staleTime: 15_000,
  })

  const { data: recentReports, isLoading: reportsLoading } = useQuery({
    queryKey: ["recent-reports"],
    queryFn: () => fetchReports(1, 3),
    staleTime: 15_000,
  })

  const deleteMut = useMutation({
    mutationFn: deleteReport,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recent-reports"] })
      qc.invalidateQueries({ queryKey: ["dashboard"] })
      toast.success("报告历史已删除")
    },
    onError: (e: Error) => toast.error(`删除失败: ${e.message}`),
  })

  const metrics = [
    { key: "case_total", label: "案例总数", icon: Archive, value: data?.case_total },
    { key: "case_enabled", label: "可检索案例", icon: CheckCircle, value: data?.case_enabled },
    { key: "embedding_ready", label: "已向量化", icon: Cpu, value: data?.embedding_ready },
    { key: "report_total", label: "报告数量", icon: FileText, value: data?.report_total },
  ]
  const reports = (recentReports as ReportResponse[] | undefined) ?? []

  const handleDeleteReport = (report: ReportResponse) => {
    const confirmed = window.confirm(`删除报告 #${report.id}？此操作不可撤销。`)
    if (confirmed) deleteMut.mutate(report.id)
  }

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
    <BlueprintPanel className="mx-auto max-w-6xl" contentClassName="space-y-8 p-6 md:p-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-lg border border-[--zx-line] bg-white/62">
        <div className="grid min-h-[260px] gap-6 px-6 py-9 md:grid-cols-[minmax(0,1fr)_300px] md:px-9">
          <div className="relative z-10 flex flex-col justify-center">
            <div className="mb-5 h-px w-32 bg-[--zx-blue]" />
            <p className="mb-3 font-mono text-[10px] uppercase text-[--zx-blue-soft]">evaluation / response report</p>
            <h1 className="mb-3 text-4xl font-bold tracking-normal text-[--zx-ink]">ZhiXi 智析</h1>
            <p className="mb-7 max-w-xl text-sm leading-relaxed text-[--zx-muted]">
              面向舆情事件的评估与处置建议工作台：先判断风险走向与参考匹配度，再生成可复核、可执行的解决方案报告。
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/generate">
                <Button>
                  <Sparkles className="mr-1.5 h-4 w-4" />评估并生成报告
                </Button>
              </Link>
              <Link to="/evaluation">
                <Button variant="outline">
                  <BarChart3 className="mr-1.5 h-4 w-4" />单独事件评估
                </Button>
              </Link>
            </div>
          </div>
          <div className="relative hidden min-h-[210px] md:block">
            <div className="absolute inset-y-2 right-0 w-px bg-[--zx-line-strong]" />
            <div className="absolute right-8 top-4 font-mono text-[10px] uppercase text-[--zx-muted]/70">response map</div>
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 300 230" aria-hidden="true">
              <path d="M22 170 C76 86 120 116 166 62 S250 24 282 78" fill="none" stroke="var(--zx-line)" strokeDasharray="6 9" strokeWidth="1.1" />
              <path d="M46 38 H216 L264 86 V182" fill="none" stroke="var(--zx-line-strong)" strokeWidth="1" />
              <circle cx="152" cy="106" r="62" fill="none" stroke="var(--zx-line)" strokeWidth="1" />
              <circle cx="152" cy="106" r="24" fill="none" stroke="var(--zx-blue)" strokeWidth="1.2" />
              <circle cx="152" cy="106" r="4" fill="var(--zx-blue)" />
              <circle cx="58" cy="166" r="7" fill="var(--zx-panel)" stroke="var(--zx-blue)" strokeWidth="1.2" />
              <circle cx="232" cy="64" r="7" fill="var(--zx-panel)" stroke="var(--zx-blue)" strokeWidth="1.2" />
              <path d="M58 166 L152 106 L232 64" fill="none" stroke="var(--zx-blue)" strokeDasharray="4 8" strokeWidth="0.9" />
              <path d="M42 206 h72 M42 214 h118" stroke="var(--zx-line-strong)" strokeWidth="0.8" />
            </svg>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {isLoading
          ? metrics.map((m) => <Skeleton key={m.key} className="h-28 rounded-xl" />)
          : metrics.map((m) => (
              <Card key={m.key} className="flex flex-col items-center justify-center gap-2 border-[--zx-line] bg-[--zx-stage] p-5">
                <m.icon className="h-5 w-5 text-[--zx-blue-soft]" />
                <span className="font-mono text-3xl font-bold text-[--zx-ink]">
                  {m.value ?? "—"}
                </span>
                <span className="text-xs text-[--zx-muted]">{m.label}</span>
              </Card>
            ))}
      </div>

      {/* Pipeline */}
      <div className="rounded-lg border border-[--zx-line] bg-white/55 p-4">
        <h2 className="mb-4 text-center text-sm font-medium text-[--zx-muted]">系统流程</h2>
        <div className="overflow-x-auto">
          <svg viewBox="0 0 900 120" className="min-w-[900px]" xmlns="http://www.w3.org/2000/svg">
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
                    fill="var(--zx-panel)"
                    stroke="var(--zx-blue)"
                    strokeWidth="1"
                  />
                  <text
                    x={x + 59}
                    y={50}
                    textAnchor="middle"
                    fill="var(--zx-ink)"
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
      </div>

      {/* Recent Reports */}
      <div className="rounded-lg border border-[--zx-line] bg-white/55 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-[--zx-muted]">最近报告</h2>
          {reports.length > 0 && (
            <Link to="/generate">
              <Button variant="ghost" size="sm">
                <Sparkles className="mr-1 h-3.5 w-3.5" />评估并生成
              </Button>
            </Link>
          )}
        </div>
        {reportsLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
          </div>
        ) : reports.length > 0 ? (
          <div className="space-y-2">
            {reports.map((r) => (
              <Card key={r.id} className="flex items-center gap-3 border-[--zx-line] bg-[--zx-stage] p-3 transition-colors hover:border-[--zx-blue]/30">
                <Link to={`/reports/${r.id}`} className="min-w-0 flex-1">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-[--zx-ink]">{r.input_event_text.slice(0, 60)}{r.input_event_text.length > 60 ? "…" : ""}</p>
                    <p className="text-[10px] text-[--zx-muted]">
                      {new Date(r.created_at).toLocaleString("zh-CN")} · {r.status === "ready" ? "已就绪" : r.status}
                    </p>
                  </div>
                </Link>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[--zx-muted]" />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  title="删除报告"
                  aria-label={`删除报告 ${r.id}`}
                  disabled={deleteMut.isPending}
                  onClick={() => handleDeleteReport(r)}
                >
                  <Trash2 className="h-3.5 w-3.5 text-[--zx-danger]" />
                </Button>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-dashed border-[--zx-line] bg-[--zx-stage] p-3">
            <p className="text-xs text-[--zx-muted]">暂无报告历史</p>
            <Link to="/generate">
              <Button variant="outline" size="sm">
                <Sparkles className="mr-1 h-3.5 w-3.5" />生成首份报告
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Limits */}
      <Card className="border border-[--zx-warning]/20 bg-[--zx-warning]/5 p-4 text-center">
        <p className="text-xs text-[--zx-warning]">
          当前案例库为课程项目小样本案例库，检索结果仅表示参考匹配度，不构成真实决策依据。
        </p>
      </Card>
    </BlueprintPanel>
  )
}
