import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { EmbeddingPreview } from "./EmbeddingPreview"
import { useCase, useGenerateEmbedding } from "@/hooks/useCases"
import { formatHeatLevel } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Pencil, Trash2, WandSparkles } from "lucide-react"

interface CaseDetailDrawerProps {
  caseId: number | null
  open: boolean
  onClose: () => void
  onEdit: (data: Record<string, unknown>) => void
  onDelete: (target: { id: number; title: string }) => void
}

const STATUS_STYLE: Record<string, string> = {
  ready: "bg-[--zx-success]/10 text-[--zx-success]",
  none: "bg-[--zx-muted]/10 text-[--zx-muted]",
  pending: "bg-[--zx-warning]/10 text-[--zx-warning]",
  failed: "bg-[--zx-danger]/10 text-[--zx-danger]",
}

export function CaseDetailDrawer({ caseId, open, onClose, onEdit, onDelete }: CaseDetailDrawerProps) {
  const { data, isLoading, error } = useCase(open ? caseId : null)
  const genEmbedding = useGenerateEmbedding()

  if (error) {
    return (
      <Sheet open={open} onOpenChange={(v) => { if (!v) onClose() }}>
        <SheetContent className="w-[min(420px,calc(100vw-1rem))] border-l border-[--zx-line] bg-[--zx-stage] text-[--zx-ink]">
          <p className="text-sm text-[--zx-danger]">加载失败，请重试</p>
        </SheetContent>
      </Sheet>
    )
  }

  const c = data as Record<string, unknown> | undefined
  const title = (c?.title as string) ?? ""
  const caseCode = (c?.case_code as string) ?? null
  const domain = (c?.domain as string) ?? ""
  const heatLevel = (c?.heat_level as number) ?? 3
  const effectScore = (c?.effect_score as number) ?? null
  const enabled = (c?.enabled as boolean) ?? true
  const embeddingStatus = (c?.embedding_status as string) ?? "none"
  const embeddingText = (c?.embedding_text as string) ?? null
  const embeddingModel = (c?.embedding_model as string) ?? null
  const embeddingDimensions = (c?.embedding_dimensions as number) ?? null
  const eventDesc = (c?.event_description as string) ?? ""
  const strategyText = (c?.strategy_text as string) ?? ""
  const publicDemands = (c?.public_demands as string[]) ?? []
  const strategyTypes = (c?.strategy_types as string[]) ?? []

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <SheetContent className="flex w-[min(420px,calc(100vw-1rem))] flex-col gap-0 border-l border-[--zx-line] bg-[--zx-stage] text-[--zx-ink] sm:max-w-[420px]">
        <SheetHeader className="pb-3">
          <SheetTitle className="text-base">{title || "案例详情"}</SheetTitle>
          {caseCode && <p className="text-xs text-[--zx-muted]">{caseCode}</p>}
        </SheetHeader>
        <Separator className="bg-[--zx-line]" />

        <div className="flex-1 space-y-4 overflow-auto py-4">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <>
              {/* Badge 行 */}
              <div className="flex flex-wrap gap-1.5">
                <Badge className="bg-[--zx-blue]/10 text-[--zx-blue-soft]">{domain}</Badge>
                <Badge className="bg-[--zx-warning]/10 text-[--zx-warning]">{formatHeatLevel(heatLevel)}</Badge>
                <Badge className={cn("text-xs", STATUS_STYLE[embeddingStatus] ?? STATUS_STYLE.none)}>
                  {embeddingStatus === "ready" ? "已向量化" : embeddingStatus === "failed" ? "失败" : embeddingStatus === "pending" ? "处理中" : "未向量化"}
                </Badge>
                {effectScore != null && (
                  <span className="text-xs text-[--zx-blue]">
                    {"●".repeat(effectScore)}{"○".repeat(5 - effectScore)}
                  </span>
                )}
              </div>

              {/* 参与检索状态 */}
              <p className={cn(
                "text-xs",
                (enabled && embeddingStatus === "ready")
                  ? "text-[--zx-success]"
                  : "text-[--zx-muted]"
              )}>
                {enabled && embeddingStatus === "ready" ? "● 参与检索" : "○ 不参与检索"}
              </p>

              {/* 公众诉求 */}
              {publicDemands.length > 0 && (
                <div>
                  <p className="mb-1 text-xs text-[--zx-muted]">公众诉求</p>
                  <div className="flex flex-wrap gap-1">
                    {publicDemands.map((d) => (
                      <span key={d} className="rounded bg-[--zx-bg-soft] px-2 py-0.5 text-xs text-[--zx-muted]">{d}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* 策略类型 */}
              {strategyTypes.length > 0 && (
                <div>
                  <p className="mb-1 text-xs text-[--zx-muted]">策略类型</p>
                  <div className="flex flex-wrap gap-1">
                    {strategyTypes.map((s) => (
                      <span key={s} className="rounded bg-[--zx-panel-soft] px-1.5 py-0.5 text-xs text-[--zx-blue-soft]">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* 事件描述 */}
              <div>
                <p className="mb-1 text-xs text-[--zx-muted]">事件核心描述</p>
                <p className="text-sm leading-relaxed text-[--zx-ink]">{eventDesc || "—"}</p>
              </div>

              {/* 核心处置策略 */}
              <div>
                <p className="mb-1 text-xs text-[--zx-muted]">核心处置策略</p>
                <p className="text-sm leading-relaxed text-[--zx-ink]">{strategyText || "—"}</p>
              </div>

              {/* Embedding 预览 */}
              <div>
                <p className="mb-1 text-xs text-[--zx-muted]">Embedding 文本</p>
                <EmbeddingPreview
                  embeddingText={embeddingText}
                  modelName={embeddingModel ?? "mock-embedding"}
                  dimensions={embeddingDimensions ?? 1024}
                />
              </div>
            </>
          )}
        </div>

        {/* 底部操作 */}
        <Separator className="bg-[--zx-line]" />
        <div className="grid grid-cols-1 gap-2 py-4 sm:grid-cols-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { if (c) { onClose(); onEdit(c) } }}
            disabled={!c}
          >
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            编辑
          </Button>
          <Button
            size="sm"
            onClick={() => { if (caseId) genEmbedding.mutate(caseId) }}
            disabled={genEmbedding.isPending}
          >
            <WandSparkles className="mr-1.5 h-3.5 w-3.5" />
            {genEmbedding.isPending ? "生成中…" : "重新生成向量"}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (caseId && c) {
                onClose()
                onDelete({ id: caseId, title: title || `#${caseId}` })
              }
            }}
            disabled={!c}
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            删除
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
