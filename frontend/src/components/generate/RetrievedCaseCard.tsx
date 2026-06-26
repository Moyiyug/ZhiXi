import { useState } from "react"
import { motion } from "motion/react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SimilarityBreakdown } from "./SimilarityBreakdown"
import type { RetrievedCaseItem } from "@/types/api"
import { formatPercent, formatScoreLabel } from "@/lib/format"
import { cn } from "@/lib/utils"
import { ChevronDown, ChevronUp, GitBranch, ListChecks } from "lucide-react"

interface RetrievedCaseCardProps {
  result: RetrievedCaseItem
  index: number
}

export function RetrievedCaseCard({ result, index }: RetrievedCaseCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      whileHover={{ y: -2 }}
    >
      <Card className="border border-[--zx-line] bg-[--zx-stage] p-5 transition-colors hover:border-[--zx-blue]">
        {/* 头部 */}
        <div className="mb-3 flex items-start gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[--zx-blue]/20 text-xs font-bold text-[--zx-blue-soft]">
            {index + 1}
          </span>
          <div className="min-w-0 flex-1">
            <h4 className="truncate text-sm font-semibold text-[--zx-ink]">{result.title}</h4>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <Badge variant="outline" className="border-[--zx-blue]/30 bg-[--zx-blue]/10 text-xs text-[--zx-blue-soft]">
                {result.domain}
              </Badge>
              {result.heat_level != null && (
                <Badge variant="outline" className="border-[--zx-line] bg-white/60 text-xs text-[--zx-muted]">
                  热度 {result.heat_level}
                </Badge>
              )}
              {result.effect_score_raw != null && (
                <Badge variant="outline" className="border-[--zx-line] bg-white/60 text-xs text-[--zx-muted]">
                  效果 {result.effect_score_raw}/5
                </Badge>
              )}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-mono text-2xl font-bold text-[--zx-blue-soft]">{formatPercent(result.final_score)}</p>
            <Badge
              className={cn(
                "text-[10px]",
                result.final_score > 0.8
                  ? "bg-[--zx-success]/10 text-[--zx-success]"
                  : result.final_score > 0.5
                    ? "bg-[--zx-warning]/10 text-[--zx-warning]"
                    : "bg-[--zx-muted]/10 text-[--zx-muted]"
              )}
            >
              {formatScoreLabel(result.final_score)}匹配
            </Badge>
          </div>
        </div>

        {/* Explanation */}
        {result.explanation && (
          <p className="mb-3 text-xs leading-relaxed text-[--zx-muted]">{result.explanation}</p>
        )}

        <div className="mb-3 grid gap-2 rounded border border-[--zx-line] bg-white/55 p-3 text-xs leading-5 text-[--zx-muted] sm:grid-cols-[150px_minmax(0,1fr)]">
          <div className="flex items-center gap-1.5 font-medium text-[--zx-ink]">
            <GitBranch className="h-3.5 w-3.5 text-[--zx-blue-soft]" />
            路由 {formatPercent(result.route_score)}
          </div>
          <div className="min-w-0">
            <p className="truncate">{result.route_reason || "全局兜底"}</p>
            {result.route_dimensions?.length > 0 && (
              <p className="mt-0.5 text-[10px] text-[--zx-muted]/80">
                {result.route_dimensions.join(" / ")}
              </p>
            )}
          </div>
        </div>

        {/* 相似度拆解 */}
        <SimilarityBreakdown
          scores={{
            semantic_score: result.semantic_score,
            demand_score: result.demand_score,
            heat_score: result.heat_score,
            domain_score: result.domain_score,
            effect_score: result.effect_score,
          }}
          final={result.final_score}
        />

        {/* 策略摘要 */}
        {(result.strategy_text || result.evidence_fragments) && (
          <div className="mt-3 border-t border-[--zx-line] pt-3">
            <Button
              variant="ghost"
              size="sm"
              className="mb-1 h-auto p-0 text-xs text-[--zx-blue-soft] hover:bg-transparent"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <><ChevronUp className="mr-1 h-3 w-3" />收起策略</>
              ) : (
                <><ChevronDown className="mr-1 h-3 w-3" />查看策略</>
              )}
            </Button>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                className="space-y-3 text-xs leading-relaxed text-[--zx-muted]"
              >
                {result.evidence_fragments?.evolution_path && (
                  <div>
                    <p className="mb-1 font-medium text-[--zx-ink]">事件演化</p>
                    <p>{result.evidence_fragments.evolution_path}</p>
                  </div>
                )}
                {result.evidence_fragments?.response_actions && (
                  <div>
                    <p className="mb-1 font-medium text-[--zx-ink]">历史处置动作</p>
                    <p>{result.evidence_fragments.response_actions}</p>
                  </div>
                )}
                {result.evidence_fragments?.action_checkpoints?.length > 0 && (
                  <div>
                    <p className="mb-1 flex items-center gap-1 font-medium text-[--zx-ink]">
                      <ListChecks className="h-3.5 w-3.5 text-[--zx-blue-soft]" />
                      可执行检查点
                    </p>
                    <ul className="space-y-1">
                      {result.evidence_fragments.action_checkpoints.map((item) => (
                        <li key={item}>- {item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.evidence_fragments?.outcome_feedback && (
                  <p className="rounded border border-[--zx-line] bg-white/55 p-2">
                    {result.evidence_fragments.outcome_feedback}
                  </p>
                )}
              </motion.div>
            )}
          </div>
        )}
      </Card>
    </motion.div>
  )
}
