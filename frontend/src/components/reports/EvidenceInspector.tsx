import type { EvidencePackResponse } from "@/types/api"
import { formatPercent } from "@/lib/format"
import { AlertTriangle } from "lucide-react"

interface EvidenceInspectorProps {
  evidencePack: EvidencePackResponse | null
}

export function EvidenceInspector({ evidencePack }: EvidenceInspectorProps) {
  if (!evidencePack) return null

  const { current_event, retrieved_cases, limitations } = evidencePack
  const contextMetrics = evidencePack.context_metrics ?? {}
  const caseLibrary = (contextMetrics.case_library ?? {}) as Record<string, number>
  const retrieval = (contextMetrics.retrieval ?? {}) as Record<string, number>

  return (
    <aside id="evidence-inspector" className="zx-blueprint-border h-full w-full shrink-0 overflow-auto rounded-lg bg-[--zx-panel] p-4 xl:w-[340px]">
      <p className="mb-4 text-sm font-semibold text-[--zx-ink]">Evidence Pack</p>

      <div className="mb-4">
        <p className="mb-1 text-[10px] font-medium uppercase text-[--zx-muted]">当前事件</p>
        <p className="line-clamp-3 text-xs leading-relaxed text-[--zx-ink]">
          {current_event.event_summary}
        </p>
        <p className="mt-1 text-[10px] text-[--zx-muted]">
          {current_event.domain} · 热度 {current_event.heat_level}
        </p>
      </div>

      {(caseLibrary.total_cases != null || retrieval.average_final_score != null) && (
        <div className="mb-4">
          <p className="mb-1 text-[10px] font-medium uppercase text-[--zx-muted]">内部指标</p>
          <div className="grid grid-cols-2 gap-2">
            {caseLibrary.total_cases != null && (
              <div className="rounded border border-[--zx-line] bg-[--zx-panel-soft] p-2">
                <p className="font-mono text-base font-semibold text-[--zx-ink]">{caseLibrary.total_cases}</p>
                <p className="text-[10px] text-[--zx-muted]">案例总数</p>
              </div>
            )}
            {caseLibrary.embedding_ready_cases != null && (
              <div className="rounded border border-[--zx-line] bg-[--zx-panel-soft] p-2">
                <p className="font-mono text-base font-semibold text-[--zx-ink]">{caseLibrary.embedding_ready_cases}</p>
                <p className="text-[10px] text-[--zx-muted]">可向量检索</p>
              </div>
            )}
            {retrieval.average_final_score != null && (
              <div className="rounded border border-[--zx-line] bg-[--zx-panel-soft] p-2">
                <p className="font-mono text-base font-semibold text-[--zx-blue-soft]">
                  {formatPercent(Number(retrieval.average_final_score))}
                </p>
                <p className="text-[10px] text-[--zx-muted]">平均匹配</p>
              </div>
            )}
            {retrieval.same_domain_hits != null && (
              <div className="rounded border border-[--zx-line] bg-[--zx-panel-soft] p-2">
                <p className="font-mono text-base font-semibold text-[--zx-ink]">{retrieval.same_domain_hits}</p>
                <p className="text-[10px] text-[--zx-muted]">同领域命中</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mb-4">
        <p className="mb-1 text-[10px] font-medium uppercase text-[--zx-muted]">
          参考案例 ({retrieved_cases.length})
        </p>
        <div className="space-y-2">
          {retrieved_cases.map((c) => (
            <div
              key={c.case_id}
              className="rounded border border-[--zx-line] bg-[--zx-panel-soft] p-2"
            >
              <p className="truncate text-xs font-medium text-[--zx-ink]">{c.title}</p>
              <p className="mt-0.5 text-[10px] text-[--zx-muted]">
                {c.domain} · {formatPercent(c.final_score)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1 text-[10px] font-medium uppercase text-[--zx-muted]">数据限制</p>
        <ul className="space-y-1">
          {limitations.map((l, i) => (
            <li key={i} className="flex gap-1.5 text-xs text-[--zx-danger]">
              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
              <span>{l}</span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
