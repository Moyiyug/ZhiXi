import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import type { RetrievedCaseItem } from "@/types/api"
import { formatPercent } from "@/lib/format"

interface EvidencePackDrawerProps {
  queryText: string
  retrievedCases: RetrievedCaseItem[]
  limitations: string[]
  open: boolean
  onClose: () => void
}

export function EvidencePackDrawer({
  queryText,
  retrievedCases,
  limitations,
  open,
  onClose,
}: EvidencePackDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <SheetContent className="flex w-[420px] flex-col gap-0 border-l border-[--zx-line] bg-[--zx-stage] text-[--zx-canvas] sm:max-w-[420px]">
        <SheetHeader className="pb-3">
          <SheetTitle className="text-base">Evidence Pack 证据包</SheetTitle>
          <p className="text-xs text-[--zx-muted]">报告生成的唯一依据</p>
        </SheetHeader>
        <Separator className="bg-[--zx-line]" />

        <div className="flex-1 space-y-4 overflow-auto py-4">
          {/* Query Text */}
          <div>
            <p className="mb-1 text-xs font-medium text-[--zx-muted]">检索 Query</p>
            <pre className="max-h-24 overflow-auto rounded border border-[--zx-line] bg-[--zx-bg] p-3 font-mono text-xs text-[--zx-muted] whitespace-pre-wrap">
              {queryText}
            </pre>
          </div>

          {/* Retrieved Cases */}
          <div>
            <p className="mb-1 text-xs font-medium text-[--zx-muted]">参考案例 ({retrievedCases.length})</p>
            <div className="space-y-2">
              {retrievedCases.map((c) => (
                <div key={c.case_id} className="rounded border border-[--zx-line] bg-[--zx-bg] p-2">
                  <p className="text-xs font-medium text-[--zx-canvas]">{c.title}</p>
                  <p className="mt-0.5 text-[10px] text-[--zx-muted]">
                    {c.domain} · 匹配度 {formatPercent(c.final_score)}
                  </p>
                  <p className="mt-1 text-[10px] leading-relaxed text-[--zx-muted] line-clamp-2">
                    {c.event_description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Limitations */}
          <div>
            <p className="mb-1 text-xs font-medium text-[--zx-muted]">数据限制</p>
            <ul className="space-y-1">
              {limitations.map((l, i) => (
                <li key={i} className="text-xs text-[--zx-danger]">⚠ {l}</li>
              ))}
            </ul>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
