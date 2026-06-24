import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { SegmentActionBar } from "./SegmentActionBar"
import type { ReportSegmentResponse } from "@/types/api"
import { GENERATION_STATUS_LABELS } from "@/lib/constants"

interface ReportSegmentCardProps {
  segment: ReportSegmentResponse
  onRegenerate: () => void
  onCopy: () => void
  onViewEvidence: () => void
  isRegenerating: boolean
}

export function ReportSegmentCard({
  segment,
  onRegenerate,
  onCopy,
  onViewEvidence,
  isRegenerating,
}: ReportSegmentCardProps) {
  const status = segment.generation_status

  // pending
  if (status === "pending") {
    return (
      <div className="rounded-xl bg-[--zx-canvas] p-6">
        <Skeleton className="mb-3 h-6 w-48" />
        <Skeleton className="mb-2 h-4 w-full" />
        <Skeleton className="mb-2 h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <p className="mt-4 text-xs text-[--zx-muted]">等待生成…</p>
      </div>
    )
  }

  // generating
  if (status === "generating") {
    return (
      <div className="rounded-xl bg-[--zx-canvas] p-6">
        <Skeleton className="mb-3 h-6 w-48" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <p className="mt-4 flex items-center gap-2 text-xs text-[--zx-blue]">
          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[--zx-blue] border-t-transparent" />
          生成中…
        </p>
      </div>
    )
  }

  // failed
  if (status === "failed") {
    return (
      <div className="rounded-xl border border-[--zx-danger]/30 bg-[--zx-canvas] p-6">
        <h3 className="mb-2 text-lg font-semibold text-[--zx-ink]">{segment.title}</h3>
        <p className="mb-3 text-sm text-[--zx-danger]">生成失败，请重试</p>
        <SegmentActionBar
          onRegenerate={onRegenerate}
          onCopy={onCopy}
          onViewEvidence={onViewEvidence}
          isRegenerating={isRegenerating}
        />
      </div>
    )
  }

  // ready
  return (
    <div className="rounded-xl bg-[--zx-canvas] p-6 text-[--zx-ink]">
      <div className="mb-4 flex items-start justify-between">
        <h3 className="text-lg font-semibold">{segment.title}</h3>
        <Badge variant="outline" className="text-[10px]">
          {GENERATION_STATUS_LABELS[status] ?? status}
        </Badge>
      </div>

      {/* Markdown 内容 */}
      <div
        className="prose prose-sm max-w-none leading-relaxed whitespace-pre-wrap"
        dangerouslySetInnerHTML={{ __html: segment.content_md.replace(/\n/g, "<br/>") }}
      />

      {/* 尾部信息 */}
      <div className="mt-4 flex items-center gap-3 text-[10px] text-[--zx-muted]">
        {segment.model_name && <span>model: {segment.model_name}</span>}
        {segment.regenerated_count > 0 && <span>已重新生成 {segment.regenerated_count} 次</span>}
      </div>

      <SegmentActionBar
        onRegenerate={onRegenerate}
        onCopy={onCopy}
        onViewEvidence={onViewEvidence}
        isRegenerating={isRegenerating}
      />
    </div>
  )
}
