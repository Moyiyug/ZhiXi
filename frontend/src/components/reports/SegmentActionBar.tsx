import { Button } from "@/components/ui/button"
import { Copy, Eye, RefreshCw } from "lucide-react"

interface SegmentActionBarProps {
  onRegenerate: () => void
  onCopy: () => void
  onViewEvidence: () => void
  isRegenerating: boolean
  regenerateLabel?: string
}

export function SegmentActionBar({
  onRegenerate,
  onCopy,
  onViewEvidence,
  isRegenerating,
  regenerateLabel = "重新生成",
}: SegmentActionBarProps) {
  return (
    <div className="grid grid-cols-1 gap-2 border-t border-[--zx-line] pt-3 sm:flex sm:flex-wrap">
      <Button
        variant="ghost"
        size="sm"
        onClick={onRegenerate}
        disabled={isRegenerating}
        className="w-full justify-start text-xs text-[--zx-muted] hover:text-[--zx-blue-soft] sm:w-auto"
      >
        <RefreshCw className={`mr-1 h-3.5 w-3.5 ${isRegenerating ? "animate-spin" : ""}`} />
        {isRegenerating ? "生成中..." : regenerateLabel}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onCopy}
        className="w-full justify-start text-xs text-[--zx-muted] hover:text-[--zx-blue-soft] sm:w-auto"
      >
        <Copy className="mr-1 h-3.5 w-3.5" />
        复制本段
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onViewEvidence}
        className="w-full justify-start text-xs text-[--zx-muted] hover:text-[--zx-blue-soft] sm:w-auto"
      >
        <Eye className="mr-1 h-3.5 w-3.5" />
        查看依据
      </Button>
    </div>
  )
}
