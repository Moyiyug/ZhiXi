import { useState } from "react"
import { useParams, Link } from "react-router-dom"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ReportCanvas } from "@/components/zhi/ReportCanvas"
import { ReportSegmentCard } from "@/components/reports/ReportSegmentCard"
import { EvidenceInspector } from "@/components/reports/EvidenceInspector"
import { ExportReportButton } from "@/components/reports/ExportReportButton"
import { useReport, useRegenerateSegment } from "@/hooks/useReport"
import type { ReportResponse } from "@/types/api"
import { toast } from "sonner"

export function ReportPage() {
  const { id } = useParams<{ id: string }>()
  const reportId = id ? Number(id) : null

  const { data, isLoading, isError, refetch } = useReport(reportId)
  const { mutate: regenerate, isPending: isPendingRegen } = useRegenerateSegment()

  const [regenKey, setRegenKey] = useState<string | null>(null)

  // Loading
  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-full max-w-[1500px] flex-col gap-4 xl:flex-row">
        <div className="min-w-0 flex-1 space-y-6 overflow-auto">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border border-[--zx-line] bg-[--zx-canvas] p-6">
              <Skeleton className="mb-3 h-6 w-48" />
              <Skeleton className="mb-2 h-4 w-full" />
              <Skeleton className="mb-2 h-4 w-3/4" />
              <Skeleton className="mb-2 h-4 w-5/6" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
        <div className="w-full shrink-0 rounded-lg border border-[--zx-line] bg-[--zx-stage] p-4 xl:w-[340px]">
          <Skeleton className="mb-3 h-4 w-24" />
          <Skeleton className="mb-2 h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>
    )
  }

  // Error
  if (isError) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="mb-3 text-sm text-[--zx-danger]">报告加载失败</p>
          <Button variant="outline" onClick={() => refetch()}>重试</Button>
        </div>
      </div>
    )
  }

  // Not found
  const report = data as ReportResponse | undefined
  if (!report) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="mb-3 text-sm text-[--zx-muted]">报告不存在</p>
          <Link to="/generate">
            <Button variant="outline">返回智能生成</Button>
          </Link>
        </div>
      </div>
    )
  }

  const handleRegenerate = (segmentKey: string) => {
    setRegenKey(segmentKey)
    regenerate(
      { reportId: report.id, segmentKey },
      { onSettled: () => setRegenKey(null) }
    )
  }

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content)
    toast.success("已复制到剪贴板")
  }

  const handleViewEvidence = () => {
    const panel = document.getElementById("evidence-inspector")
    if (panel) {
      panel.scrollIntoView({ behavior: "smooth", block: "start" })
      panel.classList.add("ring-2", "ring-[--zx-blue]")
      setTimeout(() => panel.classList.remove("ring-2", "ring-[--zx-blue]"), 2000)
    }
  }

  return (
    <div className="mx-auto flex min-h-full max-w-[1500px] flex-col gap-4 xl:flex-row">
      {/* 左：报告画布 */}
      <div className="min-w-0 flex-1 overflow-auto">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-[--zx-muted]">报告 #{report.id}</p>
            <p className="text-[10px] text-[--zx-muted]">
              状态: {report.status} · 创建于 {new Date(report.created_at).toLocaleString("zh-CN")}
            </p>
          </div>
          <ExportReportButton reportId={report.id} />
        </div>

        <ReportCanvas>
          <div className="space-y-6">
            {report.segments.map((seg) => (
              <ReportSegmentCard
                key={seg.id}
                segment={seg}
                onRegenerate={() => handleRegenerate(seg.segment_key)}
                onCopy={() => handleCopy(seg.content_md)}
                onViewEvidence={handleViewEvidence}
                isRegenerating={isPendingRegen && regenKey === seg.segment_key}
              />
            ))}
          </div>
        </ReportCanvas>
      </div>

      {/* 右：Evidence 查看器 */}
      <EvidenceInspector evidencePack={report.evidence_pack} />
    </div>
  )
}
