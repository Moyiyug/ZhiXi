import { motion } from "motion/react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { formatHeatLevel } from "@/lib/format"

interface CaseCardProps {
  caseItem: Record<string, unknown>
  onClick: () => void
  onToggle: () => void
}

const STATUS_STYLE: Record<string, string> = {
  ready: "bg-[--zx-success]/10 text-[--zx-success] border-[--zx-success]/30",
  none: "bg-[--zx-muted]/10 text-[--zx-muted] border-[--zx-muted]/30",
  pending: "bg-[--zx-warning]/10 text-[--zx-warning] border-[--zx-warning]/30",
  failed: "bg-[--zx-danger]/10 text-[--zx-danger] border-[--zx-danger]/30",
}

const STATUS_LABEL: Record<string, string> = {
  ready: "已向量化",
  none: "未向量化",
  pending: "处理中",
  failed: "失败",
}

export function CaseCard({ caseItem, onClick, onToggle }: CaseCardProps) {
  const title = (caseItem.title as string) ?? ""
  const domain = (caseItem.domain as string) ?? ""
  const heatLevel = (caseItem.heat_level as number) ?? 3
  const effectScore = (caseItem.effect_score as number) ?? null
  const enabled = (caseItem.enabled as boolean) ?? true
  const embeddingStatus = (caseItem.embedding_status as string) ?? "none"
  const publicDemands = (caseItem.public_demands as string[]) ?? []
  const strategyTypes = (caseItem.strategy_types as string[]) ?? []

  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
      <Card
        onClick={onClick}
        className={cn(
          "relative cursor-pointer border transition-colors hover:border-[--zx-blue]",
          "bg-[--zx-stage] border-[--zx-line] p-5",
          !enabled && "opacity-50"
        )}
      >
        {/* 标题 + 启用开关 */}
        <div className="mb-3 flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 flex-1 text-sm font-semibold text-[--zx-canvas]">
            {title}
          </h3>
          <Switch
            checked={enabled}
            onClick={(e) => { e.stopPropagation(); onToggle() }}
            className="shrink-0"
          />
        </div>

        {/* Badge 行 */}
        <div className="mb-3 flex flex-wrap gap-1.5">
          <Badge variant="outline" className="border-[--zx-blue]/30 bg-[--zx-blue]/10 text-[--zx-blue-soft] text-xs">
            {domain}
          </Badge>
          <Badge variant="outline" className="border-[--zx-warning]/30 bg-[--zx-warning]/10 text-[--zx-warning] text-xs">
            {formatHeatLevel(heatLevel)}
          </Badge>
          <Badge variant="outline" className={cn("text-xs", STATUS_STYLE[embeddingStatus] ?? STATUS_STYLE.none)}>
            {STATUS_LABEL[embeddingStatus] ?? embeddingStatus}
          </Badge>
          {effectScore != null && (
            <span className="ml-auto text-xs text-[--zx-blue]">
              {"●".repeat(effectScore)}{"○".repeat(5 - effectScore)}
            </span>
          )}
        </div>

        {/* Chips */}
        {publicDemands.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {publicDemands.slice(0, 3).map((d) => (
              <span key={d} className="rounded-full bg-[--zx-bg-soft] px-2 py-0.5 text-[10px] text-[--zx-muted]">
                {d}
              </span>
            ))}
            {publicDemands.length > 3 && (
              <span className="text-[10px] text-[--zx-muted]">+{publicDemands.length - 3}</span>
            )}
          </div>
        )}
        {strategyTypes.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {strategyTypes.slice(0, 2).map((s) => (
              <span key={s} className="rounded bg-[--zx-bg] px-1.5 py-0.5 text-[10px] text-[--zx-muted]">
                {s}
              </span>
            ))}
          </div>
        )}
      </Card>
    </motion.div>
  )
}
