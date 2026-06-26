import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { SegmentActionBar } from "./SegmentActionBar"
import type { ReportSegmentResponse } from "@/types/api"
import { GENERATION_STATUS_LABELS } from "@/lib/constants"
import { AlertTriangle } from "lucide-react"
import Markdown from "react-markdown"

interface ReportSegmentCardProps {
  segment: ReportSegmentResponse
  onRegenerate: () => void
  onCopy: () => void
  onViewEvidence: () => void
  isRegenerating: boolean
}

function looksTruncated(content: string) {
  const text = content.trim()
  if (!text) return true
  if (/[“‘：:、，,\-—]$/.test(text)) return true
  if ((text.match(/“/g)?.length ?? 0) > (text.match(/”/g)?.length ?? 0)) return true
  if ((text.match(/‘/g)?.length ?? 0) > (text.match(/’/g)?.length ?? 0)) return true

  const lastLine = text.split(/\r?\n/).at(-1)?.trim() ?? ""
  const normalized = lastLine.replace(/^[-*]\s*/, "").replace(/[*_`]/g, "").replace(/[：:]\s*$/, "").trim()
  return ["责任主体", "具体动作", "交付物", "回应话术", "避免事项", "判断依据", "可参考点", "不确定性"].includes(normalized)
}

export function ReportSegmentCard({
  segment,
  onRegenerate,
  onCopy,
  onViewEvidence,
  isRegenerating,
}: ReportSegmentCardProps) {
  const status = segment.generation_status
  const isPossiblyTruncated = status === "ready" && looksTruncated(segment.content_md)

  // pending
  if (status === "pending") {
    return (
      <div className="rounded-lg border border-[--zx-line] bg-white/95 p-6">
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
      <div className="rounded-lg border border-[--zx-line] bg-white/95 p-6">
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
      <div className="rounded-lg border border-[--zx-danger]/30 bg-white/95 p-6">
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
    <article className="rounded-lg border border-[--zx-line] bg-white/95 p-6 text-[--zx-ink] shadow-[0_8px_24px_rgba(31,64,120,0.05)]">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="mb-1 font-mono text-[10px] uppercase text-[--zx-blue-soft]">report segment</p>
          <h3 className="text-lg font-semibold">{segment.title}</h3>
        </div>
        <Badge variant="outline" className="text-[10px]">
          {GENERATION_STATUS_LABELS[status] ?? status}
        </Badge>
      </div>

      {/* Markdown 内容 */}
      <div className="prose prose-sm max-w-none leading-relaxed text-[--zx-ink]">
        <Markdown>{segment.content_md}</Markdown>
      </div>

      {isPossiblyTruncated && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-[--zx-warning]/30 bg-[--zx-warning]/5 p-3 text-xs leading-5 text-[--zx-warning]">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p>本段可能在模型输出时被截断。请重新生成补全后再复制、导出或用于汇报。</p>
        </div>
      )}

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
        regenerateLabel={isPossiblyTruncated ? "重新生成补全" : undefined}
      />
    </article>
  )
}
