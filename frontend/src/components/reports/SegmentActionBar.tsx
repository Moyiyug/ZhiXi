import { Button } from "@/components/ui/button"
import { Copy, Eye, RefreshCw } from "lucide-react"

interface SegmentActionBarProps {
  onRegenerate: () => void
  onCopy: () => void
  onViewEvidence: () => void
  isRegenerating: boolean
}

export function SegmentActionBar({
  onRegenerate,
  onCopy,
  onViewEvidence,
  isRegenerating,
}: SegmentActionBarProps) {
  return (
    <div className="flex gap-2 border-t border-[--zx-line] pt-3">
      <Button
        variant="ghost"
        size="sm"
        onClick={onRegenerate}
        disabled={isRegenerating}
        className="text-xs text-[--zx-muted] hover:text-[--zx-blue-soft]"
      >
        <RefreshCw className={`mr-1 h-3.5 w-3.5 ${isRegenerating ? "animate-spin" : ""}`} />
        {isRegenerating ? "生成中…" : "重新生成"}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onCopy}
        className="text-xs text-[--zx-muted] hover:text-[--zx-blue-soft]"
      >
        <Copy className="mr-1 h-3.5 w-3.5" />
        复制本段
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onViewEvidence}
        className="text-xs text-[--zx-muted] hover:text-[--zx-blue-soft]"
      >
        <Eye className="mr-1 h-3.5 w-3.5" />
        查看依据
      </Button>
    </div>
  )
}
