import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EXAMPLE_EVENTS } from "@/lib/constants"
import { cn } from "@/lib/utils"

interface EventInputPanelProps {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  isLoading: boolean
}

export function EventInputPanel({ value, onChange, onSubmit, isLoading }: EventInputPanelProps) {
  const len = value.length
  const valid = len >= 50 && len <= 800

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1 text-sm font-medium text-[--zx-ink]">事件评估输入</p>
        <p className="mb-2 text-xs leading-5 text-[--zx-muted]">
          输入待处置事件后，系统会先完成事件评估，再整理参考案例并生成处置建议报告。
        </p>
        <Textarea
          placeholder="请输入当前舆情事件描述（50-800 字）…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[180px] resize-y"
        />
      </div>

      {/* 字数统计 + 示例 */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLE_EVENTS.map((ev) => (
            <Badge
              key={ev.label}
              variant="outline"
              className="cursor-pointer border-[--zx-line] bg-[--zx-bg-soft] text-xs text-[--zx-muted] hover:border-[--zx-blue] hover:text-[--zx-blue-soft]"
              onClick={() => onChange(ev.text)}
            >
              {ev.label}
            </Badge>
          ))}
        </div>
        <span className={cn("shrink-0 text-xs", len < 50 ? "text-[--zx-danger]" : "text-[--zx-muted]")}>
          {len}/800
        </span>
      </div>

      <Button
        className="w-full"
        onClick={onSubmit}
        disabled={!valid || isLoading}
      >
        {isLoading ? "评估画像中…" : "开始评估并准备报告"}
      </Button>
    </div>
  )
}
