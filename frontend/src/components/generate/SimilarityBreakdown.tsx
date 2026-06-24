import { formatPercent } from "@/lib/format"
import { SCORE_LABELS, SCORE_WEIGHTS, type ScoreBreakdown } from "@/lib/scores"
import { cn } from "@/lib/utils"

interface SimilarityBreakdownProps {
  scores: ScoreBreakdown
  final: number
}

const SCORE_ORDER: (keyof ScoreBreakdown)[] = [
  "semantic_score",
  "demand_score",
  "heat_score",
  "domain_score",
  "effect_score",
]

export function SimilarityBreakdown({ scores, final }: SimilarityBreakdownProps) {
  return (
    <div className="space-y-1.5">
      {SCORE_ORDER.map((key) => {
        const value = scores[key] ?? 0
        return (
          <div key={key} className="flex items-center gap-2 text-xs">
            <span className="w-28 shrink-0 text-[--zx-muted]">
              {SCORE_LABELS[key]}
              <span className="ml-1 text-[10px] opacity-60">
                ({(SCORE_WEIGHTS[key] * 100).toFixed(0)}%)
              </span>
            </span>
            {/* 进度条 */}
            <div className="h-2 flex-1 rounded-full bg-[--zx-bg]">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  value > 0.8 ? "bg-[--zx-success]" : value > 0.5 ? "bg-[--zx-blue]" : "bg-[--zx-muted]"
                )}
                style={{ width: `${Math.round(value * 100)}%` }}
              />
            </div>
            <span className="w-10 text-right font-mono text-[--zx-canvas]">
              {formatPercent(value)}
            </span>
          </div>
        )
      })}

      {/* Final Score */}
      <div className="flex items-center gap-2 border-t border-[--zx-line] pt-1.5 text-sm">
        <span className="w-28 shrink-0 font-semibold text-[--zx-canvas]">参考匹配度</span>
        <div className="h-3 flex-1 rounded-full bg-[--zx-bg]">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              final > 0.8 ? "bg-[--zx-success]" : final > 0.5 ? "bg-[--zx-blue]" : "bg-[--zx-muted]"
            )}
            style={{ width: `${Math.round(final * 100)}%` }}
          />
        </div>
        <span className="w-14 text-right font-mono text-lg font-bold text-[--zx-blue-soft]">
          {formatPercent(final)}
        </span>
      </div>
    </div>
  )
}
