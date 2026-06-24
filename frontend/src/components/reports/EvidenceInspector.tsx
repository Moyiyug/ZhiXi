import type { EvidencePackResponse } from "@/types/api"
import { formatPercent } from "@/lib/format"

interface EvidenceInspectorProps {
  evidencePack: EvidencePackResponse | null
}

export function EvidenceInspector({ evidencePack }: EvidenceInspectorProps) {
  if (!evidencePack) return null

  const { current_event, retrieved_cases, limitations } = evidencePack

  return (
    <aside className="h-full overflow-auto border-l border-[--zx-line] bg-[--zx-stage] p-4">
      <p className="mb-4 text-sm font-semibold text-[--zx-canvas]">Evidence Pack</p>

      {/* 当前事件 */}
      <div className="mb-4">
        <p className="mb-1 text-[10px] font-medium uppercase text-[--zx-muted]">当前事件</p>
        <p className="text-xs leading-relaxed text-[--zx-canvas] line-clamp-3">
          {current_event.event_summary}
        </p>
        <p className="mt-1 text-[10px] text-[--zx-muted]">
          {current_event.domain} · 热度 {current_event.heat_level}
        </p>
      </div>

      {/* 参考案例 */}
      <div className="mb-4">
        <p className="mb-1 text-[10px] font-medium uppercase text-[--zx-muted]">
          参考案例 ({retrieved_cases.length})
        </p>
        <div className="space-y-2">
          {retrieved_cases.map((c) => (
            <div
              key={c.case_id}
              className="rounded border border-[--zx-line] bg-[--zx-bg] p-2"
            >
              <p className="text-xs font-medium text-[--zx-canvas] truncate">{c.title}</p>
              <p className="mt-0.5 text-[10px] text-[--zx-muted]">
                {c.domain} · {formatPercent(c.final_score)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 数据限制 */}
      <div>
        <p className="mb-1 text-[10px] font-medium uppercase text-[--zx-muted]">数据限制</p>
        <ul className="space-y-1">
          {limitations.map((l, i) => (
            <li key={i} className="text-xs text-[--zx-danger]">⚠ {l}</li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
